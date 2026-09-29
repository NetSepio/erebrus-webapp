import type { GatewayOrg } from "@/lib/gateway/types";

/**
 * The selected workspace is *context only*: it decides which workspace's nodes,
 * files, members and billing the UI shows. Plan limits always come from the
 * caller's best workspace on the gateway, never from this selection.
 */
export const ACTIVE_WORKSPACE_KEY = "erebrus_active_workspace_v1";

/**
 * Resolve the workspace to show: the stored choice when still a member, else
 * the workspace that supplies the plan, else the first owned, else the first.
 */
export function pickSelectedWorkspace(
  orgs: GatewayOrg[],
  storedId: string | null | undefined,
  entitlementOrgId?: string | null
): GatewayOrg | null {
  const usable = orgs.filter((o) => o.id);
  if (usable.length === 0) return null;
  return (
    usable.find((o) => o.id === storedId) ??
    usable.find((o) => o.id === entitlementOrgId) ??
    usable.find((o) => o.role === "owner") ??
    usable[0]
  );
}

export function readStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

export function storeWorkspaceId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    // Storage may be unavailable (private mode); selection falls back per load.
  }
}
