"use client";

import { useEffect, useState } from "react";
import { fetchNodes } from "@/lib/gateway/client";
import { uniqueCountries } from "@/lib/regions";

export type NetworkStats = {
  nodesOnline: number;
  countries: number;
  loading: boolean;
};

export function useNetworkStats(): NetworkStats {
  const [stats, setStats] = useState<NetworkStats>({
    nodesOnline: 0,
    countries: 0,
    loading: true,
  });

  useEffect(() => {
    fetchNodes({ status: "online" })
      .then((nodes) => {
        setStats({
          nodesOnline: nodes.length,
          countries: uniqueCountries(nodes),
          loading: false,
        });
      })
      .catch(() => setStats((s) => ({ ...s, loading: false })));
  }, []);

  return stats;
}