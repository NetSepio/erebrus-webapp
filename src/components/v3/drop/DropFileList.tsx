"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, ActionButton } from "@/components/v3/ui";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { Download, Trash2, Copy, Share2, Lock, Globe, Check } from "lucide-react";
import type { DropFile, DropFileStatus } from "@/lib/drop/types";

const STATUS_META: Record<
  DropFileStatus,
  { label: string; color: string }
> = {
  reserved: { label: "Reserved", color: "var(--text-3)" },
  uploading: { label: "Uploading", color: "var(--accent-hi)" },
  pinning: { label: "Pinning", color: "var(--warn)" },
  available: { label: "Available", color: "var(--success)" },
  failed: { label: "Failed", color: "var(--danger)" },
  stale: { label: "Stale", color: "var(--warn)" },
  delete_pending: { label: "Delete pending", color: "var(--warn)" },
};

export function DropFileList({
  files,
  loading,
  busyId,
  onDownload,
  onDelete,
  onShare,
}: {
  files: DropFile[];
  loading: boolean;
  busyId: string | null;
  onDownload: (file: DropFile) => void;
  onDelete: (file: DropFile) => void;
  onShare: (file: DropFile) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCid = async (file: DropFile) => {
    if (!file.cid) return;
    await navigator.clipboard.writeText(file.cid);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId((id) => (id === file.id ? null : id)), 1500);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold">Files</span>
          <span className="font-mono text-[11px] text-[var(--text-3)]">{files.length}</span>
        </div>
      </div>

      {loading ? (
        <p className="px-5 py-8 text-sm text-[var(--text-3)]">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[var(--text-2)]">
          No files yet. Upload a file to get started.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {files.map((file) => {
            const status = STATUS_META[file.status];
            const canDownload =
              file.status === "available" && (!file.encrypted || file.can_decrypt);
            const busy = busyId === file.id;
            return (
              <li key={file.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      file.visibility === "public"
                        ? "bg-white/[0.06] text-[var(--text-2)]"
                        : "bg-[var(--accent)]/12 text-[var(--accent-hi)]"
                    )}
                  >
                    {file.visibility === "public" ? <Globe size={15} /> : <Lock size={15} />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{file.filename}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-[var(--text-3)]">
                      <span>{formatBytes(file.size_bytes)}</span>
                      <span>·</span>
                      <span style={{ color: status.color }}>{status.label}</span>
                      {file.created_at && (
                        <>
                          <span>·</span>
                          <span>{formatRelativeTime(file.created_at)}</span>
                        </>
                      )}
                      {file.encrypted && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--accent-hi)]">encrypted</span>
                        </>
                      )}
                      {file.encrypted && !file.can_decrypt && (
                        <>
                          <span>·</span>
                          <span>owner-only decryption</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {file.cid && (
                    <ActionButton
                      variant="neutral"
                      onClick={() => copyCid(file)}
                      aria-label={`Copy CID of ${file.filename}`}
                    >
                      {copiedId === file.id ? <Check size={13} /> : <Copy size={13} />}
                      CID
                    </ActionButton>
                  )}
                  {file.visibility === "public" && canDownload && (
                    <ActionButton
                      variant="neutral"
                      onClick={() => onShare(file)}
                      aria-label={`Share ${file.filename}`}
                    >
                      <Share2 size={13} />
                      Share
                    </ActionButton>
                  )}
                  <ActionButton
                    variant="accent"
                    disabled={!canDownload || busy}
                    onClick={() => onDownload(file)}
                    aria-label={`Download ${file.filename}`}
                  >
                    <Download size={13} />
                    {busy ? "…" : "Get"}
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    disabled={busy || file.status === "delete_pending"}
                    onClick={() => onDelete(file)}
                    aria-label={`Delete ${file.filename}`}
                  >
                    <Trash2 size={13} />
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
