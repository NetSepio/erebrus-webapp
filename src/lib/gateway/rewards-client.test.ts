import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/context/appkit", () => ({ getCurrentAuthToken: () => "test-token" }));

import {
  approveRewardWithdrawal,
  createRewardWithdrawal,
  fetchAdminRewardsSummary,
  fetchGenesisLeaderboard,
  fetchRewardAccess,
  fetchOperatorRewardSummary,
  fetchAdminRewardWithdrawals,
  fetchRewardWithdrawals,
  GatewayApiError,
  previewRewardClaim,
  rejectRewardWithdrawal,
  retryRewardWithdrawal,
  submitRewardApplication,
} from "./client";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Genesis rewards Gateway client", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("renders partial and full claim previews exactly as calculated by Gateway", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ amount_usdc: 4_000_000, xp_to_reserve: 2000, projected_retained_xp: 8000, payout_wallet: "sol", network: "solana", token: "USDC" }))
      .mockResolvedValueOnce(json({ amount_usdc: 8_000_000, xp_to_reserve: 4000, projected_retained_xp: 6000, payout_wallet: "sol", network: "solana", token: "USDC" }));
    expect((await previewRewardClaim("4.00")).xp_to_reserve).toBe(2000);
    const full = await previewRewardClaim("8.00");
    expect(full.projected_retained_xp).toBe(6000);
    expect(full.amount_usdc).toBe("8.00");
  });

  it("requests authoritative category leaderboards", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ entries: [{ rank: 1, wallet: "reward…ator", contribution_xp: 123 }] }));
    const result = await fetchGenesisLeaderboard({ kind: "vpn", limit: 5 });
    expect(result.entries[0].contribution_xp).toBe(123);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("kind=vpn");
  });

  it("builds operator node counts from finalized Gateway reward nodes", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ season_id: "s1", verified_solana_wallet: "sol", contribution_xp: 300, retained_xp: 300, reserved_xp: 0, claimable_usdc: 3_000_000, spent_usdc: 0 }))
      .mockResolvedValueOnce(json({ can_view_rewards: true, approved: true, season_started: true, season: { id: "s1", name: "Genesis", status: "active", xp_multiplier: 1.5, min_payout_usdc: 5_000_000, total_budget_usdc: 500_000_000, vpn_envelope_usdc: 275_000_000, ai_envelope_usdc: 200_000_000, reserve_usdc: 25_000_000, spent_usdc: 0, reserved_usdc: 0 } }))
      .mockResolvedValueOnce(json({ withdrawals: [] }))
      .mockResolvedValueOnce(json({ nodes: [{ node_id: "n1", node_type: "vpn", slot_status: "active", contribution_xp: 300, cash_entitlement_usdc: 3_000_000, average_quality_score: 0.95 }] }));
    const summary = await fetchOperatorRewardSummary();
    expect(summary.active_nodes).toBe(1);
    expect(summary.nodes[0]).toMatchObject({ id: "n1", kind: "vpn", contribution_xp: 300, quality_band: "excellent" });
  });

  it("sends and preserves an idempotency key when creating a claim", async () => {
    const key = "00000000-0000-4000-8000-000000000123";
    vi.mocked(fetch).mockResolvedValue(json({ withdrawal_id: "w1", amount_usdc: 5_000_000, reserved_xp: 2000, status: "pending" }));
    await createRewardWithdrawal("5.00", key, "sol-wallet");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe(key);
    expect(JSON.parse(String(init?.body))).toEqual({ amount_usdc: "5.00", payout_address: "sol-wallet", idempotency_key: key });
  });

  it.each([400, 401, 403, 409])("preserves Gateway claim error status %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(json({ error: `error-${status}` }, status));
    const error = await createRewardWithdrawal("9.00", "00000000-0000-4000-8000-000000000124", "sol-wallet").catch((value) => value);
    expect(error).toBeInstanceOf(GatewayApiError);
    expect(error.status).toBe(status);
  });

  it("keeps approval processing until a later authoritative refresh reports paid", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ status: "approved" }))
      .mockResolvedValueOnce(json({ withdrawals: [{ id: "w1", status: "paid", amount_usdc: 5_000_000, reserved_xp: 2000, payout_address: "sol", created_at: "2026-01-01T00:00:00Z", payout_attempt: { signature: "sig" } }] }));
    expect((await approveRewardWithdrawal("w1")).status).toBe("approved");
    expect((await fetchAdminRewardWithdrawals()).withdrawals[0].status).toBe("paid");
  });

  it("supports rejection and Gateway-authorized payout retry", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ status: "rejected" }))
      .mockResolvedValueOnce(json({ status: "approved" }));
    expect((await rejectRewardWithdrawal("w1", "Not eligible")).status).toBe("rejected");
    expect((await retryRewardWithdrawal("w2")).status).toBe("approved");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("/admin/rewards/withdrawals/w2/approve");
  });

  it("uses authoritative treasury base-unit balances in the admin summary", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ season_id: "s1", name: "Genesis", status: "active", xp_multiplier: 1.5, min_payout_usdc: 5_000_000, total_budget: 500_000_000, vpn_envelope: 275_000_000, ai_envelope: 200_000_000, reserve: 25_000_000, spent: 0, reserved: 0, remaining: 500_000_000, payouts_paused: false }))
      .mockResolvedValueOnce(json({ treasury_address: "treasury", usdc_balance: 12_345_678, sol_balance_lamports: 1_250_000_000 }));
    const summary = await fetchAdminRewardsSummary();
    expect(summary.treasury_usdc_balance).toBe("12.345678");
    expect(summary.treasury_sol_balance).toBe("1.2500");
  });

  it("keeps treasury fields out of pre-approval access and submits the application contract", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ season_available: true, season_started: false, applications_open: true, approved: false, can_view_rewards: false, season: { id: "s1", name: "Genesis", status: "upcoming", xp_multiplier: 1.5 } }))
      .mockResolvedValueOnce(json({ id: "a1", status: "pending" }, 201));
    const access = await fetchRewardAccess();
    expect(access.can_view_rewards).toBe(false);
    expect(access.season).not.toHaveProperty("total_budget_usdc");
    await submitRewardApplication({ service_types: ["vpn"], node_ids: ["n1"], country: "India", infrastructure: "Static IPv4 with monitored redundant connectivity", experience: "Production operations with incident response coverage", availability_hours: 168, public_vpn_consent: true, terms_accepted: true });
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("/rewards/applications");
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toMatchObject({ node_ids: ["n1"], terms_accepted: true });
  });

  it("can reconcile an ambiguous create failure by refetching active history", async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError("network timeout"))
      .mockResolvedValueOnce(json({ withdrawals: [{ id: "w1", status: "pending", amount_usdc: 5_000_000, reserved_xp: 2000, payout_address: "sol", created_at: "2026-01-01T00:00:00Z" }] }));
    await expect(createRewardWithdrawal("5.00", "00000000-0000-4000-8000-000000000125", "sol")).rejects.toThrow("network timeout");
    expect((await fetchRewardWithdrawals()).withdrawals[0].status).toBe("pending");
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("/rewards/me/withdrawals");
  });
});
