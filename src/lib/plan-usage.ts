import type { GatewayAccountUsage } from "@/lib/gateway/types";

/**
 * Display helpers for the gateway `usage` summary. Nothing here enforces a
 * limit — the gateway does. These only shape copy for cards and banners.
 */

export interface PlanEndingNotice {
  until: string;
  /** Devices that will be paused when access ends (newest first). */
  pauseCount: number;
  limitAfter: number;
  planName: string;
}

/** Notice to show when paid access ends soon and devices exceed the Basic limit. */
export function planEndingNotice(usage: GatewayAccountUsage | null | undefined): PlanEndingNotice | null {
  const org = usage?.entitlement_org;
  if (!usage || !org?.access_ending || !org.paid_access_until) return null;
  const live = usage.vpn.public_clients - usage.vpn.paused_clients;
  const pauseCount = Math.max(0, live - usage.vpn.limit_after_access_ends);
  if (pauseCount === 0) return null;
  return {
    until: org.paid_access_until,
    pauseCount,
    limitAfter: usage.vpn.limit_after_access_ends,
    planName: planShortName(org.plan),
  };
}

/** "personal.starter" → "Starter". */
export function planShortName(plan?: string | null): string {
  const tier = (plan ?? "").split(".").pop() ?? "";
  return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Basic";
}

/** Percent (0–100) of a quota used, for progress bars. */
export function usagePercent(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}

/** True when a public-node device can be added without hitting the limit. */
export function hasDeviceSlot(usage: GatewayAccountUsage | null | undefined): boolean | null {
  if (!usage) return null;
  return usage.vpn.public_clients < usage.vpn.client_limit;
}
