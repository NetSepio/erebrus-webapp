import type { GatewayOrgEntitlements } from "@/lib/gateway/types";

/** Plan tiers that can include Erebrus Shield (AdGuard DNS filtering). */
export function planIncludesShield(plan?: string | null): boolean {
  const p = (plan ?? "").toLowerCase();
  return p === "starter" || p === "pro" || p === "business" || p === "enterprise";
}

/** Plan tiers that can include Erebrus Sentinel (network-layer firewall). */
export function planIncludesSentinel(plan?: string | null): boolean {
  const p = (plan ?? "").toLowerCase();
  return p === "business" || p === "enterprise";
}

export type OrgEntitlementBadge = {
  key: "shield" | "sentinel";
  label: string;
  count: number;
};

/**
 * Workspace plan banner badges — only show entitlements the plan can include
 * and that are actually allocated (count > 0). Never show "0 Sentinel" on Pro.
 */
export function orgEntitlementBadges(
  plan: string | null | undefined,
  entitlements: GatewayOrgEntitlements | null | undefined
): OrgEntitlementBadge[] {
  const out: OrgEntitlementBadge[] = [];
  const shield = entitlements?.shield_instances_included ?? 0;
  const sentinel = entitlements?.sentinel_licenses_included ?? 0;

  if (planIncludesShield(plan) && shield > 0) {
    out.push({ key: "shield", label: "Shield", count: shield });
  }
  if (planIncludesSentinel(plan) && sentinel > 0) {
    out.push({ key: "sentinel", label: "Sentinel", count: sentinel });
  }
  return out;
}