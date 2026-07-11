import type { GatewayOrg } from "@/lib/gateway/types";

/**
 * Effective product tier. Organization membership is the sole source of a
 * user's tier — there is no personal trial/subscription/NFT entitlement. Every
 * account is expected to have a personal `basic` organization from bootstrap,
 * so an authenticated user without any paid seat still resolves to `free`.
 */
export type EffectiveTier = "free" | "starter" | "pro" | "business" | "enterprise";

const TIER_ORDER: EffectiveTier[] = ["free", "starter", "pro", "business", "enterprise"];

const TIER_RANK: Record<EffectiveTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
};

export const TIER_LABELS: Record<EffectiveTier, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

/** Map an organization plan or seat-tier string to an effective tier. */
export function normalizeTier(value?: string | null): EffectiveTier {
  const v = (value ?? "").toLowerCase().trim();
  if ((TIER_ORDER as string[]).includes(v)) return v as EffectiveTier;
  // `basic`, `free`, empty, and anything unknown collapse to the free tier.
  return "free";
}

export function tierLabel(tier: EffectiveTier): string {
  return TIER_LABELS[tier];
}

/**
 * VPN device (WireGuard client) limit per effective tier. The gateway remains
 * authoritative and rejects over-limit provisioning with 409; this is an
 * advisory display/UX value only.
 */
const TIER_DEVICE_LIMIT: Record<EffectiveTier, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  business: 10,
  enterprise: 25,
};

export function deviceLimitForTier(tier: EffectiveTier): number {
  return TIER_DEVICE_LIMIT[tier];
}

export function isHigherTier(a: EffectiveTier, b: EffectiveTier): boolean {
  return TIER_RANK[a] > TIER_RANK[b];
}

export interface EffectiveEntitlement {
  /** Highest active tier across the caller's organization memberships. */
  tier: EffectiveTier;
  /** Organization that supplied the effective tier (entitlement provenance). */
  org: GatewayOrg | null;
  /** Caller is an active member of at least one organization. */
  isMember: boolean;
  /** Caller holds a paid seat in at least one organization. */
  hasPaidSeat: boolean;
}

/**
 * A paid seat is what raises a member above `free`; unpaid membership of a
 * higher-plan org still resolves to the org's free floor for that member.
 */
function seatTierFor(org: GatewayOrg): EffectiveTier {
  if (org.role === "owner" || org.role === "node_operator") {
    return normalizeTier(org.plan);
  }
  const paidSeat =
    org.has_paid_seat === true || (!!org.seat_tier && org.seat_tier !== "free");
  if (!paidSeat) return "free";
  return normalizeTier(org.seat_tier);
}

/**
 * Resolve the caller's effective tier from organization memberships only.
 * Public quota remains per-user; the winning org is recorded purely as
 * provenance for display.
 */
export function resolveEffectiveEntitlement(
  orgs: GatewayOrg[] | null | undefined
): EffectiveEntitlement {
  const list = orgs ?? [];
  let best: EffectiveEntitlement = {
    tier: "free",
    org: null,
    isMember: list.length > 0,
    hasPaidSeat: false,
  };

  for (const org of list) {
    const seat = seatTierFor(org);
    if (seat !== "free") best.hasPaidSeat = true;
    if (TIER_RANK[seat] > TIER_RANK[best.tier] || (best.org === null && seat === "free")) {
      best = {
        tier: seat,
        org,
        isMember: true,
        hasPaidSeat: best.hasPaidSeat || seat !== "free",
      };
    }
  }
  return best;
}
