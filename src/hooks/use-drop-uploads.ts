"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDropUpload, uploadDropContent } from "@/lib/drop/client";
import { GatewayApiError } from "@/lib/gateway/client";
import type {
  DropEncryptionMetadata,
  DropScope,
  DropVisibility,
} from "@/lib/drop/types";

const MAX_CONCURRENT_UPLOADS = 3;

export type UploadItemStatus =
  | "queued"
  | "preparing"
  | "reserving"
  | "uploading"
  | "finalizing"
  | "done"
  | "error"
  | "canceled";

export interface UploadItem {
  id: string;
  file: File;
  filename: string;
  size: number;
  scope: DropScope;
  orgId: string | null;
  nodeId: string;
  visibility: DropVisibility;
  status: UploadItemStatus;
  sentBytes: number;
  totalBytes: number;
  error?: string;
  /** Set once the gateway accepts the reservation. */
  uploadId?: string;
  fileId?: string;
}

/**
 * Result of turning a picked file into an uploadable body. Phase 3 supplies an
 * encrypting implementation; the default is an unencrypted passthrough.
 */
export interface PreparedContent {
  blob: Blob;
  contentType: string;
  encrypted: boolean;
  encryptionMetadata?: DropEncryptionMetadata;
  sha256?: string;
}

export type PrepareContent = (
  item: UploadItem,
  signal: AbortSignal
) => Promise<PreparedContent>;

const defaultPrepare: PrepareContent = async (item) => ({
  blob: item.file,
  contentType: item.file.type || "application/octet-stream",
  encrypted: false,
});

export interface EnqueueInput {
  file: File;
  scope: DropScope;
  orgId: string | null;
  nodeId: string;
  visibility: DropVisibility;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useDropUploads(
  options: { prepare?: PrepareContent; onComplete?: () => void } = {}
) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const controllers = useRef(new Map<string, AbortController>());
  const activeCount = useRef(0);
  const itemsRef = useRef<UploadItem[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
  }, []);

  // Mutual recursion between run and pump goes through refs so neither callback
  // needs the other in its dependency list.
  const runRef = useRef<(item: UploadItem) => Promise<void>>(async () => {});
  const pumpRef = useRef<() => void>(() => {});

  const run = useCallback(
    async (item: UploadItem) => {
      const prepare = optionsRef.current.prepare ?? defaultPrepare;
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      activeCount.current += 1;
      try {
        patch(item.id, { status: "preparing", error: undefined });
        const prepared = await prepare(item, controller.signal);

        patch(item.id, { status: "reserving" });
        const upload = await createDropUpload({
          node_id: item.nodeId,
          org_id: item.orgId,
          filename: item.filename,
          content_type: prepared.contentType,
          size_bytes: prepared.blob.size,
          sha256: prepared.sha256,
          visibility: item.visibility,
          encrypted: prepared.encrypted,
          encryption_metadata: prepared.encryptionMetadata,
          idempotency_key: item.id,
        });

        patch(item.id, {
          status: "uploading",
          uploadId: upload.upload_id,
          totalBytes: prepared.blob.size,
        });
        const result = await uploadDropContent(upload.upload_id, prepared.blob, {
          contentType: prepared.contentType,
          signal: controller.signal,
          onProgress: (sent, total) => patch(item.id, { sentBytes: sent, totalBytes: total }),
        });

        patch(item.id, {
          status: "done",
          fileId: result.file_id,
          sentBytes: prepared.blob.size,
        });
        optionsRef.current.onComplete?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          patch(item.id, { status: "canceled" });
        } else {
          patch(item.id, { status: "error", error: errorMessage(err) });
        }
      } finally {
        controllers.current.delete(item.id);
        activeCount.current -= 1;
        pumpRef.current();
      }
    },
    [patch]
  );

  const pump = useCallback(() => {
    const free = MAX_CONCURRENT_UPLOADS - activeCount.current;
    if (free <= 0) return;
    const toStart = itemsRef.current
      .filter((it) => it.status === "queued")
      .slice(0, free);
    if (toStart.length === 0) return;
    const starting = new Set(toStart.map((it) => it.id));
    setItems((prev) =>
      prev.map((it) => (starting.has(it.id) ? { ...it, status: "preparing" } : it))
    );
    for (const it of toStart) void runRef.current({ ...it, status: "preparing" });
  }, []);

  runRef.current = run;
  pumpRef.current = pump;

  const enqueue = useCallback((inputs: EnqueueInput[]) => {
    const newItems: UploadItem[] = inputs.map((input) => ({
      id: uuid(),
      file: input.file,
      filename: input.file.name,
      size: input.file.size,
      scope: input.scope,
      orgId: input.orgId,
      nodeId: input.nodeId,
      visibility: input.visibility,
      status: "queued",
      sentBytes: 0,
      totalBytes: input.file.size,
    }));
    setItems((prev) => {
      const next = [...newItems, ...prev];
      itemsRef.current = next;
      return next;
    });
    pumpRef.current();
  }, []);

  const cancel = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && (it.status === "queued" || it.status === "reserving")
          ? { ...it, status: "canceled" }
          : it
      )
    );
  }, []);

  const retry = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((it) =>
        it.id === id && (it.status === "error" || it.status === "canceled")
          ? { ...it, status: "queued" as UploadItemStatus, error: undefined, sentBytes: 0 }
          : it
      );
      itemsRef.current = next;
      return next;
    });
    pumpRef.current();
  }, []);

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status !== "done" && it.status !== "canceled"));
  }, []);

  return { items, enqueue, cancel, retry, remove, clearFinished };
}

function errorMessage(err: unknown): string {
  if (err instanceof GatewayApiError) {
    if (err.status === 402) return "Quota exceeded — free space or upgrade your plan.";
    if (err.status === 409) return "Reservation conflict — retry this file.";
    if (err.status === 403) return "Not authorized to upload to this node.";
    return err.message;
  }
  return "Upload failed";
}
