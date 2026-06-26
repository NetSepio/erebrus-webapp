"use client";

import { useNetworkStats } from "@/hooks/use-network-stats";

export function LiveNetworkBadge() {
  const { nodesOnline, loading } = useNetworkStats();

  return (
    <span className="text-[13px] text-[var(--text-2)]">
      Community-run infrastructure ·{" "}
      {loading ? "syncing network…" : `${nodesOnline} nodes live`}
    </span>
  );
}