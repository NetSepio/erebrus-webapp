import { describe, expect, it } from "vitest";
import {
  normalizeTier,
  resolveEffectiveEntitlement,
  isHigherTier,
  tierLabel,
} from "./entitlements";
import type { GatewayOrg } from "@/lib/gateway/types";

function org(partial: Partial<GatewayOrg>): GatewayOrg {
  return {
    id: partial.id ?? "org-1",
    name: partial.name ?? "Org",
    kind: partial.kind ?? "team",
    verified: partial.verified ?? false,
    ...partial,
  };
}

describe("normalizeTier", () => {
  it("maps personal Basic/free/unknown/empty to free", () => {
    expect(normalizeTier("personal.basic")).toBe("free");
    expect(normalizeTier("free")).toBe("free");
    expect(normalizeTier("")).toBe("free");
    expect(normalizeTier(null)).toBe("free");
    expect(normalizeTier("something-else")).toBe("free");
  });

  it("passes through recognized paid tiers case-insensitively", () => {
    expect(normalizeTier("Starter")).toBe("starter");
    expect(normalizeTier("PRO")).toBe("pro");
    expect(normalizeTier("business")).toBe("business");
    expect(normalizeTier("enterprise")).toBe("enterprise");
  });

  it("maps family-qualified plan IDs to capability tiers", () => {
    expect(normalizeTier("personal.starter")).toBe("starter");
    expect(normalizeTier("personal.pro")).toBe("pro");
    expect(normalizeTier("business.launch")).toBe("pro");
    expect(normalizeTier("business.scale")).toBe("business");
    expect(normalizeTier("business.enterprise")).toBe("enterprise");
  });
});

describe("resolveEffectiveEntitlement", () => {
  it("resolves free for a user with only a personal basic org", () => {
    const result = resolveEffectiveEntitlement([org({ plan: "personal.basic" })]);
    expect(result.tier).toBe("free");
    expect(result.isMember).toBe(true);
    expect(result.hasPaidSeat).toBe(false);
    expect(result.org?.id).toBe("org-1");
  });

  it("resolves free for an unauthenticated user with no orgs", () => {
    const result = resolveEffectiveEntitlement([]);
    expect(result.tier).toBe("free");
    expect(result.isMember).toBe(false);
    expect(result.org).toBeNull();
  });

  it("uses the highest active paid seat tier across orgs", () => {
    const result = resolveEffectiveEntitlement([
      org({ id: "a", plan: "personal.basic" }),
      org({ id: "b", plan: "personal.pro", seat_tier: "pro", has_paid_seat: true }),
      org({ id: "c", plan: "personal.starter", seat_tier: "starter", has_paid_seat: true }),
    ]);
    expect(result.tier).toBe("pro");
    expect(result.org?.id).toBe("b");
    expect(result.hasPaidSeat).toBe(true);
  });

  it("treats an unpaid seat in a paid-plan org as free for that member", () => {
    const result = resolveEffectiveEntitlement([
      org({ id: "a", plan: "business.scale", seat_tier: "free", has_paid_seat: false, role: "member" }),
    ]);
    expect(result.tier).toBe("free");
    expect(result.hasPaidSeat).toBe(false);
  });

  it("treats owners and node operators as holding a paid seat", () => {
    expect(
      resolveEffectiveEntitlement([org({ plan: "personal.starter", seat_tier: "free", role: "owner" })]).tier
    ).toBe("starter");
    expect(
      resolveEffectiveEntitlement([
        org({ plan: "business.launch", seat_tier: "free", role: "node_operator" }),
      ]).tier
    ).toBe("pro");
  });
});

describe("tier helpers", () => {
  it("orders tiers", () => {
    expect(isHigherTier("pro", "starter")).toBe(true);
    expect(isHigherTier("free", "enterprise")).toBe(false);
  });

  it("labels tiers", () => {
    expect(tierLabel("free")).toBe("Free");
    expect(tierLabel("enterprise")).toBe("Enterprise");
  });
});
