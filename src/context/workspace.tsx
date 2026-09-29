"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchAccountSummary, fetchOrgs } from "@/lib/gateway/client";
import type { GatewayAccountUsage, GatewayOrg } from "@/lib/gateway/types";
import { resolveEffectiveEntitlement, type EffectiveEntitlement } from "@/lib/entitlements";
import { useWalletAuth } from "@/context/appkit";
import { pickSelectedWorkspace, readStoredWorkspaceId, storeWorkspaceId } from "@/lib/workspace-selection";

export interface WorkspaceContextValue {
  orgs: GatewayOrg[];
  /** Workspace the UI is viewing/managing. Never changes plan limits. */
  selectedOrg: GatewayOrg | null;
  selectOrg: (id: string) => void;
  /** Best plan across all workspaces (display only; gateway enforces). */
  entitlement: EffectiveEntitlement;
  /** Gateway plan & usage summary; null until loaded or when unavailable. */
  usage: GatewayAccountUsage | null;
  loading: boolean;
  /** Set when workspaces or usage could not be loaded — show it, don't fake "Free". */
  error: string | null;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useWalletAuth();
  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [usage, setUsage] = useState<GatewayAccountUsage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrgs([]);
      setUsage(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [orgsResult, summaryResult] = await Promise.allSettled([fetchOrgs(), fetchAccountSummary()]);
    if (orgsResult.status === "fulfilled") setOrgs(orgsResult.value);
    if (summaryResult.status === "fulfilled") setUsage(summaryResult.value.usage);
    setError(
      orgsResult.status === "rejected"
        ? "Could not load your workspaces."
        : summaryResult.status === "rejected"
          ? "Could not load your plan usage."
          : null
    );
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    setSelectedId(readStoredWorkspaceId());
    void refresh();
  }, [refresh]);

  const entitlement = useMemo(() => resolveEffectiveEntitlement(orgs), [orgs]);
  const selectedOrg = useMemo(
    () => pickSelectedWorkspace(orgs, selectedId, usage?.entitlement_org?.id ?? entitlement.org?.id),
    [orgs, selectedId, usage, entitlement.org]
  );

  const selectOrg = useCallback((id: string) => {
    setSelectedId(id);
    storeWorkspaceId(id);
  }, []);

  const value = useMemo(
    () => ({ orgs, selectedOrg, selectOrg, entitlement, usage, loading, error, refresh }),
    [orgs, selectedOrg, selectOrg, entitlement, usage, loading, error, refresh]
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/** Workspace context; must be used inside the authenticated app shell. */
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

/** Optional variant for components that can render outside the app shell. */
export function useOptionalWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
