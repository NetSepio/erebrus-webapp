"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useOnlineNodesPoller,
  type OnlineNodesSnapshot,
} from "@/hooks/use-online-nodes";
const OnlineNodesContext = createContext<OnlineNodesSnapshot | null>(null);

export function OnlineNodesProvider({ children }: { children: ReactNode }) {
  const value = useOnlineNodesPoller();
  return (
    <OnlineNodesContext.Provider value={value}>
      {children}
    </OnlineNodesContext.Provider>
  );
}

type UseOnlineNodesOptions = {
  /** Sort by load ascending (lightest first). Default true. */
  sortByLoad?: boolean;
};

export function useOnlineNodes(
  options: UseOnlineNodesOptions = {},
): OnlineNodesSnapshot {
  const { sortByLoad = true } = options;
  const ctx = useContext(OnlineNodesContext);
  if (!ctx) {
    throw new Error("useOnlineNodes must be used within OnlineNodesProvider");
  }

  const nodes = useMemo(() => {
    if (!sortByLoad) return ctx.nodes;
    return [...ctx.nodes].sort(
      (a, b) => (a.load_pct ?? 99) - (b.load_pct ?? 99),
    );
  }, [ctx.nodes, sortByLoad]);

  return { nodes, loading: ctx.loading, refresh: ctx.refresh };
}