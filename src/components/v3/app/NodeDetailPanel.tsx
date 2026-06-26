"use client";

import type { GatewayNode } from "@/lib/gateway/types";
import { AccentButton, MonoLabel } from "@/components/v3/ui";
import { formatRelativeTime } from "@/lib/format";
import { X, Download, Loader2, Check } from "lucide-react";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-3)]">{label}</div>
      <div className="mt-0.5 font-mono text-[13px]" style={{ color: color ?? "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

/**
 * Detail card for a node selected on the globe. Floats over the globe canvas.
 */
export function NodeDetailPanel({
  node,
  isSelectedEgress,
  provisioning,
  canProvision,
  onUse,
  onClose,
}: {
  node: GatewayNode;
  isSelectedEgress: boolean;
  provisioning: boolean;
  canProvision: boolean;
  onUse: () => void;
  onClose: () => void;
}) {
  const online = node.status === "online";
  const mbps = (v?: number) => (v != null ? `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} Mbps` : "—");

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-10 w-[270px] max-w-[calc(100%-2rem)] rounded-2xl border border-white/[0.1] bg-[var(--elevated)]/95 p-4 shadow-2xl backdrop-blur-xl md:right-[22px] md:top-[22px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: online ? "var(--success)" : "var(--text-3)",
                boxShadow: online ? "0 0 8px var(--success)" : "none",
              }}
            />
            <span className="truncate text-[15px] font-semibold">{node.name || node.region}</span>
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-3)]">
            {[node.country, node.region].filter(Boolean).join(" · ")}
            {node.org_name ? ` · ${node.org_name}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          className="rounded-md p-1 text-[var(--text-3)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Stat
          label="Status"
          value={node.status}
          color={online ? "var(--success)" : "var(--text-3)"}
        />
        <Stat
          label="Access"
          value={node.access_mode}
          color={node.access_mode === "private" ? "var(--warn)" : "var(--text-2)"}
        />
        <Stat label="Latency" value={node.latency_ms != null ? `${node.latency_ms} ms` : "—"} />
        <Stat
          label="Load"
          value={node.load_pct != null ? `${node.load_pct.toFixed(0)}%` : "—"}
          color={(node.load_pct ?? 0) > 80 ? "var(--warn)" : "var(--success)"}
        />
        <Stat label="Down" value={mbps(node.download_mbps)} />
        <Stat label="Up" value={mbps(node.upload_mbps)} />
      </div>

      {node.protocols && node.protocols.length > 0 && (
        <div className="mt-3">
          <MonoLabel>Protocols</MonoLabel>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {node.protocols.map((p) => (
              <span
                key={p}
                className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-[var(--text-2)]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-white/[0.06] pt-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-[var(--text-3)]">DID</span>
          <span className="ml-2 truncate font-mono text-[var(--text-2)]" title={node.did}>
            {node.did ? `…${node.did.slice(-12)}` : "—"}
          </span>
        </div>
        {node.speedtest_at != null && (
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="font-mono text-[var(--text-3)]">Speedtest</span>
            <span className="font-mono text-[var(--text-2)]">{formatRelativeTime(node.speedtest_at)}</span>
          </div>
        )}
      </div>

      <AccentButton
        className="mt-3.5 w-full !py-2.5 !text-[13px]"
        variant={isSelectedEgress ? "ghost" : "primary"}
        onClick={onUse}
        disabled={provisioning || !canProvision || !online}
      >
        {provisioning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
          </>
        ) : isSelectedEgress ? (
          <>
            <Download size={14} /> Download config
          </>
        ) : (
          <>
            <Check size={14} /> Use this node
          </>
        )}
      </AccentButton>
    </div>
  );
}
