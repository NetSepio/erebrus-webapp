"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchNodes } from "@/lib/gateway/client";
import type { GatewayNode } from "@/lib/gateway/types";
import { NodeGlobe } from "@/components/v3/NodeGlobe";
import { NodeDetailPanel } from "@/components/v3/app/NodeDetailPanel";
import { uniqueCountries } from "@/lib/regions";

export function LandingNetworkPreview() {
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes({ status: "online" })
      .then((n) => {
        const sorted = n.sort((a, b) => (a.load_pct ?? 99) - (b.load_pct ?? 99));
        setNodes(sorted);
        setSelectedId((prev) => prev ?? sorted[0]?.id);
      })
      .catch(() => setNodes([]));
  }, []);

  const detailNode = useMemo(
    () => (detailId ? nodes.find((n) => n.id === detailId) ?? null : null),
    [detailId, nodes]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setDetailId(id);
  }, []);

  return (
    <div className="mt-16 overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[var(--surface)] to-[var(--elevated)] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2A2A2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2A2A2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2A2A2E]" />
        <span className="ml-3 font-mono text-[11px] text-[var(--text-3)]">app.erebrus.io/dashboard</span>
      </div>
      <div className="relative aspect-[16/10] bg-[var(--bg)] sm:aspect-[16/8.4]">
        <NodeGlobe
          nodes={nodes}
          selectedId={selectedId}
          onSelect={handleSelect}
          className="absolute inset-0 h-full"
        />

        <div className="pointer-events-none absolute left-5 top-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-[var(--success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
            LIVE NETWORK
          </span>
        </div>

        {!detailNode && nodes.length > 0 && (
          <div className="pointer-events-none absolute right-5 top-5 font-mono text-[11px] text-[var(--text-3)]">
            Tap a node →
          </div>
        )}

        <div className="pointer-events-none absolute bottom-5 left-5 flex gap-6">
          <Stat value={nodes.length} label="Nodes online" />
          <Stat value={uniqueCountries(nodes) || "—"} label="Regions" />
          <Stat value="0" label="Logs kept" highlight />
        </div>

        {detailNode && (
          <NodeDetailPanel
            node={detailNode}
            showAction={false}
            onClose={() => setDetailId(null)}
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  highlight,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className="text-xl font-bold tracking-tight md:text-[22px]"
        style={{ color: highlight ? "var(--success)" : "var(--text)" }}
      >
        {value}
      </div>
      <div className="font-mono text-[10.5px] uppercase tracking-wide text-[var(--text-3)]">
        {label}
      </div>
    </div>
  );
}
