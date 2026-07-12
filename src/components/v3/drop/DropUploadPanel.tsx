"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Card, MonoLabel } from "@/components/v3/ui";
import { formatBytes } from "@/lib/format";
import { UploadCloud, X, RotateCcw, Lock, Globe } from "lucide-react";
import type { UploadItem } from "@/hooks/use-drop-uploads";
import type { DropVisibility } from "@/lib/drop/types";

const STATUS_LABEL: Record<UploadItem["status"], string> = {
  queued: "Queued",
  preparing: "Preparing",
  reserving: "Reserving",
  uploading: "Uploading",
  finalizing: "Finalizing",
  done: "Done",
  error: "Failed",
  canceled: "Canceled",
};

const STATUS_COLOR: Record<UploadItem["status"], string> = {
  queued: "var(--text-3)",
  preparing: "var(--text-2)",
  reserving: "var(--text-2)",
  uploading: "var(--accent-hi)",
  finalizing: "var(--accent-hi)",
  done: "var(--success)",
  error: "var(--danger)",
  canceled: "var(--text-3)",
};

export function DropUploadPanel({
  disabled,
  disabledReason,
  visibility,
  publicAllowed = true,
  onVisibilityChange,
  onFiles,
  items,
  onCancel,
  onRetry,
  onRemove,
  onClearFinished,
}: {
  disabled: boolean;
  disabledReason?: string;
  visibility: DropVisibility;
  publicAllowed?: boolean;
  onVisibilityChange: (v: DropVisibility) => void;
  onFiles: (files: File[]) => void;
  items: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onClearFinished: () => void;
}) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length) onFiles(accepted);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  const hasFinished = items.some((i) => i.status === "done" || i.status === "canceled");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonoLabel>Upload files</MonoLabel>
        <div
          className="flex items-center gap-1 rounded-lg border border-white/[0.08] p-0.5"
          role="group"
          aria-label="File visibility"
        >
          <VisibilityToggle
            active={visibility === "private"}
            onClick={() => onVisibilityChange("private")}
            icon={<Lock size={13} />}
            label="Private"
          />
          <VisibilityToggle
            active={visibility === "public"}
            disabled={!publicAllowed}
            onClick={() => onVisibilityChange("public")}
            icon={<Globe size={13} />}
            label="Public"
          />
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          isDragActive
            ? "border-[var(--accent)]/60 bg-[var(--accent)]/8"
            : "border-white/[0.12] bg-white/[0.02]",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} aria-label="File input" />
        <UploadCloud className="mb-3 h-7 w-7 text-[var(--text-3)]" />
        <p className="text-sm text-[var(--text-2)]">
          {disabled
            ? disabledReason ?? "Select an eligible node to upload."
            : isDragActive
              ? "Drop files to upload"
              : "Drag & drop files here"}
        </p>
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="mt-3 rounded-[10px] border border-[var(--accent)]/40 bg-[var(--accent)]/12 px-4 py-2 text-xs font-semibold text-[var(--accent-hi)] transition-colors hover:bg-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose files
        </button>
        <p className="mt-3 text-[11px] text-[var(--text-3)]">
          {visibility === "private"
            ? "Private files are encrypted in your browser before upload."
            : "Public files are plaintext; anyone with the link or CID may retrieve them."}
        </p>
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-2)]">
              Transfer queue ({items.length})
            </span>
            {hasFinished && (
              <button
                type="button"
                onClick={onClearFinished}
                className="text-[11px] text-[var(--text-3)] hover:text-[var(--text)]"
              >
                Clear finished
              </button>
            )}
          </div>
          {items.map((item) => {
            const pct =
              item.totalBytes > 0
                ? Math.min(100, (item.sentBytes / item.totalBytes) * 100)
                : 0;
            const active = item.status === "uploading" || item.status === "reserving";
            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm">{item.filename}</span>
                  <span
                    className="shrink-0 font-mono text-[11px]"
                    style={{ color: STATUS_COLOR[item.status] }}
                  >
                    {STATUS_LABEL[item.status]}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    {(item.status === "error" || item.status === "canceled") && (
                      <button
                        type="button"
                        aria-label={`Retry ${item.filename}`}
                        onClick={() => onRetry(item.id)}
                        className="rounded p-1 text-[var(--text-3)] hover:text-[var(--accent-hi)]"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={
                        active ? `Cancel ${item.filename}` : `Remove ${item.filename}`
                      }
                      onClick={() => (active ? onCancel(item.id) : onRemove(item.id))}
                      className="rounded p-1 text-[var(--text-3)] hover:text-[var(--danger)]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${item.status === "done" ? 100 : pct}%`,
                        background:
                          item.status === "error"
                            ? "var(--danger)"
                            : "linear-gradient(90deg, #FF7E44, #E0531F)",
                      }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--text-3)]">
                    {formatBytes(item.sentBytes)} / {formatBytes(item.totalBytes)}
                  </span>
                </div>
                {item.error && (
                  <p className="mt-1.5 text-[11px] text-[var(--danger)]">{item.error}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function VisibilityToggle({
  active,
  onClick,
  icon,
  label,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        disabled
          ? "cursor-not-allowed text-[var(--text-3)] opacity-40"
          : active
          ? "bg-[var(--accent)]/15 text-[var(--accent-hi)]"
          : "text-[var(--text-3)] hover:text-[var(--text)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
