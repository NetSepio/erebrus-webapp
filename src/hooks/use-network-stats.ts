"use client";

import { useOnlineNodes } from "@/context/online-nodes";
import { uniqueCountries } from "@/lib/regions";

export type NetworkStats = {
  nodesOnline: number;
  countries: number;
  loading: boolean;
};

export function useNetworkStats(): NetworkStats {
  const { nodes, loading } = useOnlineNodes({ sortByLoad: false });

  return {
    nodesOnline: nodes.length,
    countries: uniqueCountries(nodes),
    loading,
  };
}