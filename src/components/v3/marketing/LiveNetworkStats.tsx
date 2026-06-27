"use client";

import { useNetworkStats } from "@/hooks/use-network-stats";

export function LiveNetworkStats({ variant = "bar" }: { variant?: "bar" | "inline" }) {
  const { nodesOnline, countries, loading } = useNetworkStats();

  if (variant === "inline") {
    return (
      <span className="text-[13px] text-[var(--text-2)]">
        {loading ? "Loading network…" : `${nodesOnline} nodes live · ${countries || "—"} regions`}
      </span>
    );
  }

  const stats = [
    { value: loading ? "…" : String(nodesOnline), label: "Nodes online" },
    { value: loading ? "…" : String(countries || "—"), label: "Regions" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06]">
      {stats.map((s) => (
        <div key={s.label} className="bg-[var(--elevated)] px-6 py-7 text-center">
          <div className="text-2xl font-bold tracking-tight md:text-[32px]">{s.value}</div>
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}