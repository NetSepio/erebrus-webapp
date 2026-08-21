import { describe, expect, it } from "vitest";
import { canCreateClaim, capacityModeDescription, compareDecimalStrings, publicLeaderboardRow, withdrawalStatusLabel, withdrawalXpLabel } from "./rewards";
import type { OperatorRewardSummary } from "./gateway/types";

const summary = (overrides: Partial<OperatorRewardSummary> = {}): OperatorRewardSummary => ({
  season_id: "genesis",
  contribution_xp: 10000,
  retained_xp: 10000,
  reserved_xp: 0,
  claimable_usdc: "8.00",
  claimed_usdc: "0",
  minimum_claim_usdc: "5.00",
  verified_solana_wallet: "So11111111111111111111111111111111111111112",
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
    expect(canCreateClaim(summary({ verified_solana_wallet: undefined }))).toBe(false);
  });

  it("uses user-facing withdrawal labels", () => {
    expect(withdrawalStatusLabel("pending")).toBe("Pending review");
    expect(withdrawalStatusLabel("failed")).toContain("needs review");
  });

  it("keeps XP reserved until paid and releases it after rejection/failure", () => {
    expect(withdrawalXpLabel({ status: "processing" })).toBe("reserved");
    expect(withdrawalXpLabel({ status: "paid" })).toBe("deducted");
    expect(withdrawalXpLabel({ status: "rejected" })).toBe("released");
    expect(withdrawalXpLabel({ status: "failed", reservation_released: true })).toBe("released");
    expect(withdrawalXpLabel({ status: "failed" })).toBe("reserved");
  });

  it("projects only Contribution XP into public leaderboard rows", () => {
    const row = publicLeaderboardRow({
      rank: 1,
      display_name: "abc…xyz",
      contribution_xp: 4840,
      active_eligible_nodes: 2,
      contribution_types: ["vpn", "ai"],
    });
    expect(row.contributionXp).toBe(4840);
    expect(row).not.toHaveProperty("wallet");
    expect(row).not.toHaveProperty("retainedXp");
  });

  it("distinguishes persistent and opportunistic AI capacity", () => {
    expect(capacityModeDescription("persistent")).toContain("remain available");
    expect(capacityModeDescription("opportunistic")).toContain("while online");
  });
});
