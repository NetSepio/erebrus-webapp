import type { OperatorRewardSummary, WithdrawalStatus } from "@/lib/gateway/types";

export const ACTIVE_WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  "pending",
  "approved",
  "processing",
];

export function canCreateClaim(summary: OperatorRewardSummary): boolean {
  if (summary.payouts_paused || summary.conflicting_withdrawal) return false;
  return compareDecimalStrings(summary.claimable_usdc, summary.minimum_claim_usdc) >= 0;
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
