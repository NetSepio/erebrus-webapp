"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNodes } from "@/lib/gateway/client";
import type { GatewayNode } from "@/lib/gateway/types";

/** Matches gateway node WS heartbeat interval. */
export const NODE_POLL_INTERVAL_MS = 30_000;

export type OnlineNodesSnapshot = {
  nodes: GatewayNode[];
  loading: boolean;
  refresh: () => Promise<void>;
};

/** Polls online nodes every 30s. Used by OnlineNodesProvider — prefer useOnlineNodes() in UI. */
export function useOnlineNodesPoller(): OnlineNodesSnapshot {
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const list = await fetchNodes({ status: "online" });
      if (!mounted.current) return;
      setNodes(list);
    } catch {
      if (mounted.current) setNodes([]);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    const id = window.setInterval(() => void load(), NODE_POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [load]);

  return { nodes, loading, refresh: load };
}