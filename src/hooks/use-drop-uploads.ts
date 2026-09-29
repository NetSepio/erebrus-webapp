"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDropUpload, uploadDropContent } from "@/lib/drop/client";
import { GatewayApiError } from "@/lib/gateway/client";
import { describeGatewayError, formatStorageBytes, gatewayErrorCode } from "@/lib/gateway-errors";
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

export function isUploadActive(status: UploadItemStatus): boolean {
  return ["queued", "preparing", "reserving", "uploading", "finalizing"].includes(status);
}

export function claimQueuedUploads(items: UploadItem[], capacity: number) {
  const toStart = items.filter((item) => item.status === "queued").slice(0, Math.max(0, capacity));
  const starting = new Set(toStart.map((item) => item.id));
  return {
    toStart,
    items: items.map((item): UploadItem => starting.has(item.id) ? { ...item, status: "preparing" } : item),
  };
}

export function useDropUploads(
  options: { prepare?: PrepareContent; onComplete?: () => void } = {}
) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const controllers = useRef(new Map<string, AbortController>());
  const preparedContent = useRef(new Map<string, PreparedContent>());
  const activeCount = useRef(0);
  const itemsRef = useRef<UploadItem[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const running = controllers.current;
    const prepared = preparedContent.current;
    return () => {
      mounted.current = false;
      for (const controller of running.values()) controller.abort();
      running.clear();
      prepared.clear();
    };
  }, []);

  const updateItems = useCallback((update: (current: UploadItem[]) => UploadItem[]) => {
    if (!mounted.current) return;
    itemsRef.current = update(itemsRef.current);
    setItems(itemsRef.current);
  }, []);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    updateItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
  }, [updateItems]);

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
        let prepared = preparedContent.current.get(item.id);
        if (!prepared) {
          prepared = await prepare(item, controller.signal);
          controller.signal.throwIfAborted();
          preparedContent.current.set(item.id, prepared);
        }
        controller.signal.throwIfAborted();

        patch(item.id, { status: "reserving" });
        const upload = await createDropUpload(
          {
            node_id: item.nodeId,
            org_id: item.orgId,
            scope: item.scope,
            filename: item.filename,
            content_type: prepared.contentType,
            size_bytes: prepared.blob.size,
            sha256: prepared.sha256,
            visibility: item.visibility,
            encrypted: prepared.encrypted,
            encryption_metadata: prepared.encryptionMetadata,
            idempotency_key: item.id,
          },
          controller.signal
        );

        controller.signal.throwIfAborted();
        patch(item.id, {
          status: "uploading",
          uploadId: upload.upload_id,
          totalBytes: prepared.blob.size,
        });
        // The node's content endpoint only accepts application/octet-stream
        // bodies; the file's real content type travels in the reservation.
        const result = await uploadDropContent(upload.upload_id, prepared.blob, {
          contentType: "application/octet-stream",
          signal: controller.signal,
          onProgress: (sent, total) => patch(item.id, {
            sentBytes: sent, totalBytes: total,
            status: total > 0 && sent >= total ? "finalizing" : "uploading",
          }),
        });

        patch(item.id, {
          status: "done",
          fileId: result.file_id,
          sentBytes: prepared.blob.size,
        });
        preparedContent.current.delete(item.id);
        if (mounted.current) optionsRef.current.onComplete?.();
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
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
    if (!mounted.current) return;
    const claimed = claimQueuedUploads(itemsRef.current, MAX_CONCURRENT_UPLOADS - activeCount.current);
    if (claimed.toStart.length === 0) return;
    updateItems(() => claimed.items);
    for (const it of claimed.toStart) void runRef.current({ ...it, status: "preparing" });
  }, [updateItems]);

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
    updateItems((prev) => [...prev, ...newItems]);
    pumpRef.current();
  }, [updateItems]);

  const cancel = useCallback((id: string) => {
    const controller = controllers.current.get(id);
    if (controller) controller.abort();
    else updateItems((prev) => prev.map((it) => it.id === id && isUploadActive(it.status) ? { ...it, status: "canceled" } : it));
  }, [updateItems]);

  const retry = useCallback((id: string) => {
    if (controllers.current.has(id)) return;
    updateItems((prev) => prev.map((it) =>
      it.id === id && (it.status === "error" || it.status === "canceled")
        ? { ...it, status: "queued", error: undefined, sentBytes: 0 }
        : it
    ));
    pumpRef.current();
  }, [updateItems]);

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    preparedContent.current.delete(id);
    updateItems((prev) => prev.filter((it) => it.id !== id));
  }, [updateItems]);

  const clearFinished = useCallback(() => {
    for (const item of itemsRef.current) {
      if (item.status === "done" || item.status === "canceled") {
        preparedContent.current.delete(item.id);
      }
    }
    updateItems((prev) => prev.filter((it) => it.status !== "done" && it.status !== "canceled"));
  }, [updateItems]);

  return { items, enqueue, cancel, retry, remove, clearFinished };
}

export interface DropQuotaSnapshot {
  /** Bytes still available on the public quota (quota − used − reserved). */
  availableBytes: number;
  maxFileBytes: number;
}

/**
 * Warn before uploading instead of failing afterwards. Only public uploads
 * count against the per-user quota; workspace (private-org) uploads are bound
 * by the node's capacity and the per-file limit. The gateway re-checks both.
 */
export function preUploadCheck(
  files: { name: string; size: number }[],
  scope: DropScope,
  quota: DropQuotaSnapshot | null
): { ok: true } | { ok: false; message: string } {
  if (!quota) return { ok: true };
  const tooBig = files.find((f) => quota.maxFileBytes > 0 && f.size > quota.maxFileBytes);
  if (tooBig) {
    return {
      ok: false,
      message: `"${tooBig.name}" is ${formatStorageBytes(tooBig.size)}; your plan allows ${formatStorageBytes(quota.maxFileBytes)} per file.`,
    };
  }
  if (scope === "public") {
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > quota.availableBytes) {
      return {
        ok: false,
        message: `Not enough Drop storage: these files need ${formatStorageBytes(total)} but you have ${formatStorageBytes(quota.availableBytes)} left. Delete files or upgrade for more space.`,
      };
    }
  }
  return { ok: true };
}

function errorMessage(err: unknown): string {
  if (gatewayErrorCode(err)) return describeGatewayError(err).message;
  if (err instanceof GatewayApiError) {
    if (
      err.status === 402 ||
      (err.status === 409 && err.message.toLowerCase().includes("quota"))
    ) {
      return "Quota exceeded — free space or upgrade your plan.";
    }
    if (err.status === 507) return "The selected node does not have enough capacity.";
    if (err.status === 503) return "The selected node is offline or unavailable.";
    if (err.status === 409) return "Reservation conflict — retry this file.";
    if (err.status === 403) return "Not authorized to upload to this node.";
    return err.message;
  }
  return "Upload failed";
}
