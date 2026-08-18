import { describe, expect, it } from "vitest";
import { canCreateClaim, compareDecimalStrings, withdrawalStatusLabel } from "./rewards";
import type { OperatorRewardSummary } from "./gateway/types";

const summary = (overrides: Partial<OperatorRewardSummary> = {}): OperatorRewardSummary => ({
  season_id: "genesis",
  contribution_xp: 10000,
  retained_xp: 10000,
  reserved_xp: 0,
  claimable_usdc: "8.00",
  claimed_usdc: "0",
  minimum_claim_usdc: "5.00",
  conflicting_withdrawal: false,
  active_nodes: 1,
  standby_nodes: 0,
  probation_nodes: 0,
  nodes: [],
  ...overrides,
});

describe("Genesis reward claim states", () => {
  it("enables a claim at the exact minimum without floating point math", () => {
    expect(canCreateClaim(summary({ claimable_usdc: "5.000000" }))).toBe(true);
    expect(compareDecimalStrings("5.000000", "5")).toBe(0);
  });

  it("disables below-minimum, pending, and paused claims", () => {
    expect(canCreateClaim(summary({ claimable_usdc: "4.999999" }))).toBe(false);
    expect(canCreateClaim(summary({ conflicting_withdrawal: true }))).toBe(false);
    expect(canCreateClaim(summary({ payouts_paused: true }))).toBe(false);
  });

  it("uses user-facing withdrawal labels", () => {
    expect(withdrawalStatusLabel("pending")).toBe("Pending review");
    expect(withdrawalStatusLabel("failed")).toContain("needs review");
  });
});
