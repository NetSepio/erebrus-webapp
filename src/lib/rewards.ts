import type { GenesisLeaderboardEntry, OperatorRewardSummary, RewardWithdrawal, WithdrawalStatus } from "@/lib/gateway/types";

export const ACTIVE_WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  "pending",
  "approved",
  "processing",
  // Failed payouts retain their reservation so an admin can safely reconcile
  // and retry them without exposing the same entitlement to a second claim.
  "failed",
];

export function canCreateClaim(summary: OperatorRewardSummary): boolean {
  if (!summary.verified_solana_wallet || summary.payouts_paused || summary.conflicting_withdrawal) return false;
  return compareDecimalStrings(summary.claimable_usdc, summary.minimum_claim_usdc) >= 0;
}

export function withdrawalXpLabel(withdrawal: Pick<RewardWithdrawal, "status" | "reservation_released">): "reserved" | "deducted" | "released" {
  if (withdrawal.status.toLowerCase() === "paid") return "deducted";
  if (withdrawal.reservation_released || withdrawal.status.toLowerCase() === "rejected") return "released";
  return "reserved";
}

/** Deliberately excludes wallets, payout data, and telemetry from public rows. */
export function publicLeaderboardRow(entry: GenesisLeaderboardEntry) {
  return {
    rank: entry.rank,
    displayName: entry.display_name,
    contributionXp: entry.contribution_xp,
    activeEligibleNodes: entry.active_eligible_nodes,
    contributionTypes: entry.contribution_types,
    countryCodes: entry.country_codes,
  };
}

export function capacityModeDescription(mode?: string): string {
  return mode?.toLowerCase() === "persistent"
    ? "Expected to remain available; qualifies through verified availability and usage."
    : "Contributes while online; earns primarily from verified capacity and usage.";
}

export function compareDecimalStrings(left: string, right: string): number {
  const normalize = (value: string) => {
    const [whole = "0", fraction = ""] = value.replace(/^\+/, "").split(".");
    return { whole: whole.replace(/^0+(?=\d)/, ""), fraction: fraction.replace(/0+$/, "") };
  };
  const a = normalize(left);
  const b = normalize(right);
  if (a.whole.length !== b.whole.length) return a.whole.length > b.whole.length ? 1 : -1;
  if (a.whole !== b.whole) return a.whole > b.whole ? 1 : -1;
  const width = Math.max(a.fraction.length, b.fraction.length);
  const af = a.fraction.padEnd(width, "0");
  const bf = b.fraction.padEnd(width, "0");
  return af === bf ? 0 : af > bf ? 1 : -1;
}

export function withdrawalStatusLabel(status: WithdrawalStatus): string {
  const labels: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    processing: "Processing",
    paid: "Paid",
    rejected: "Rejected",
    failed: "Failed — needs review",
  };
  return labels[status.toLowerCase()] ?? status;
}

export function createIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `genesis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
