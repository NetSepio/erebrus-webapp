import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/context/appkit", () => ({ getCurrentAuthToken: () => "test-token" }));

import {
  approveRewardWithdrawal,
  createRewardWithdrawal,
  fetchAdminRewardWithdrawals,
  fetchRewardWithdrawals,
  GatewayApiError,
  previewRewardClaim,
  rejectRewardWithdrawal,
  retryRewardWithdrawal,
} from "./client";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("Genesis rewards Gateway client", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("renders partial and full claim previews exactly as calculated by Gateway", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ amount_usdc: "4.00", xp_to_reserve: 2000, projected_retained_xp: 8000, payout_wallet: "sol", network: "solana", token: "USDC" }))
      .mockResolvedValueOnce(json({ amount_usdc: "8.00", xp_to_reserve: 4000, projected_retained_xp: 6000, payout_wallet: "sol", network: "solana", token: "USDC" }));
    expect((await previewRewardClaim("4.00")).xp_to_reserve).toBe(2000);
    expect((await previewRewardClaim("8.00")).projected_retained_xp).toBe(6000);
  });

  it("sends and preserves an idempotency key when creating a claim", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ id: "w1", status: "pending" }));
    await createRewardWithdrawal("5.00", "idem-123");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("idem-123");
    expect(String(init?.body)).toContain('"idempotency_key":"idem-123"');
  });

  it.each([400, 401, 403, 409])("preserves Gateway claim error status %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(json({ error: `error-${status}` }, status));
    const error = await createRewardWithdrawal("9.00", "idem").catch((value) => value);
    expect(error).toBeInstanceOf(GatewayApiError);
    expect(error.status).toBe(status);
  });

  it("keeps approval processing until a later authoritative refresh reports paid", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ id: "w1", status: "processing" }))
      .mockResolvedValueOnce(json({ withdrawals: [{ id: "w1", status: "paid", transaction_signature: "sig" }] }));
    expect((await approveRewardWithdrawal("w1")).status).toBe("processing");
    expect((await fetchAdminRewardWithdrawals()).withdrawals[0].status).toBe("paid");
  });

  it("supports rejection and Gateway-authorized payout retry", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json({ id: "w1", status: "rejected", rejection_reason: "Not eligible" }))
      .mockResolvedValueOnce(json({ id: "w2", status: "processing", retryable: false }));
    expect((await rejectRewardWithdrawal("w1", "Not eligible")).status).toBe("rejected");
    expect((await retryRewardWithdrawal("w2")).status).toBe("processing");
  });

  it("can reconcile an ambiguous create failure by refetching active history", async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError("network timeout"))
      .mockResolvedValueOnce(json({ withdrawals: [{ id: "w1", status: "pending" }] }));
    await expect(createRewardWithdrawal("5.00", "idem-timeout")).rejects.toThrow("network timeout");
    expect((await fetchRewardWithdrawals()).withdrawals[0].status).toBe("pending");
  });
});
