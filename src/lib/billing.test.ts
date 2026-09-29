import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-session", () => ({ getCurrentAuthToken: () => null, invalidateSession: vi.fn() }));

import {
  billingErrorMessage,
  billingReturnPhase,
  isPersonalPaidPlan,
  multiWorkspaceCheckout,
  planOpenForCheckout,
  safeCheckoutUrl,
} from "./billing";

describe("multi-workspace checkout", () => {
  const starterWs = { id: "a", name: "My Workspace", plan: "personal.starter" };
  const freeWs = { id: "b", name: "Family", plan: "personal.basic" };
  const launchWs = { id: "c", name: "Company", plan: "business.launch" };

  it("classifies personal paid plans", () => {
    expect(isPersonalPaidPlan("personal.starter")).toBe(true);
    expect(isPersonalPaidPlan("personal.pro")).toBe(true);
    expect(isPersonalPaidPlan("personal.basic")).toBe(false);
    expect(isPersonalPaidPlan("business.launch")).toBe(false);
  });

  it("blocks a second personal plan", () => {
    expect(multiWorkspaceCheckout([starterWs, freeWs], "b", "personal.starter")).toEqual({ kind: "blocked", org: starterWs });
  });

  it("allows a business plan next to a personal plan", () => {
    expect(multiWorkspaceCheckout([starterWs, freeWs], "b", "business.launch")).toEqual({ kind: "ok" });
  });

  it("allows a personal plan next to a business plan", () => {
    expect(multiWorkspaceCheckout([launchWs, freeWs], "b", "personal.starter")).toEqual({ kind: "ok" });
  });

  it("is plain ok when no other workspace is paid", () => {
    expect(multiWorkspaceCheckout([freeWs], "b", "personal.starter")).toEqual({ kind: "ok" });
  });
});
import { GatewayApiError } from "./gateway/client";
import type { GatewayBillingPlan, GatewayBillingStatus } from "./gateway/types";

const status = (overrides: Partial<GatewayBillingStatus> = {}): GatewayBillingStatus => ({
  org_id: "org", plan_id: "personal.basic", billing_managed: false,
  provider_status: "none", cancel_at_period_end: false, ...overrides,
});

describe("billing confirmation", () => {
  it("requires an active paid plan, not just a completed checkout", () => {
    expect(billingReturnPhase(status({ checkout: { attempt_id: "a", org_id: "org", status: "completed", created_at: "" } }), "a")).toBe("verifying");
    expect(billingReturnPhase(status({ provider_status: "active" }))).toBe("verifying");
    expect(billingReturnPhase(status({ provider_status: "active", plan_id: "personal.pro" }))).toBe("active");
  });

  it.each(["failed", "expired"] as const)("distinguishes a matching %s checkout", (state) => {
    const value = status({ checkout: { attempt_id: "a", org_id: "org", status: state, created_at: "" } });
    expect(billingReturnPhase(value, "a")).toBe(state);
    expect(billingReturnPhase(value, "different-attempt")).toBe("verifying");
  });

  it.each(["past_due", "on_hold", "failed", "paused"])("recognizes %s subscriptions", (provider_status) => {
    expect(billingReturnPhase(status({ provider_status }))).toBe("payment-issue");
  });
});

describe("plan checkout availability", () => {
  const plan = (checkout_enabled: boolean): GatewayBillingPlan => ({
    id: "personal.starter", family: "personal", tier: "starter", name: "Starter",
    period_days: 30, max_clients: 3,
    billing_prices: [{ plan_id: "personal.starter", billing_interval: "monthly", currency: "USD", amount_minor: 499, checkout_enabled }],
  });

  it("is closed when the catalog has no plan or no price for the interval", () => {
    expect(planOpenForCheckout(undefined, "monthly")).toBe(false);
    expect(planOpenForCheckout(plan(true), "yearly")).toBe(false);
  });

  it("follows the gateway checkout flag", () => {
    expect(planOpenForCheckout(plan(false), "monthly")).toBe(false);
    expect(planOpenForCheckout(plan(true), "monthly")).toBe(true);
  });

  it("is closed when an older gateway omits billing_prices", () => {
    expect(planOpenForCheckout({ ...plan(true), billing_prices: undefined }, "monthly")).toBe(false);
  });
});

describe("checkout links", () => {
  it.each([undefined, "", "javascript:alert(1)", "http://checkout.example.com", "https://user:password@checkout.example.com", "/billing"])("rejects unsafe or unusable links: %s", (value) => {
    expect(safeCheckoutUrl(value)).toBeNull();
  });

  it("preserves a valid HTTPS provider URL", () => {
    expect(safeCheckoutUrl("https://checkout.example.com/session/abc")).toBe("https://checkout.example.com/session/abc");
  });
});

describe("billing recovery messages", () => {
  it("explains expired sessions and owner permissions", () => {
    expect(billingErrorMessage(new GatewayApiError("Unauthorized", 401))).toContain("sign in");
    expect(billingErrorMessage(new GatewayApiError("Forbidden", 403))).toContain("owner");
  });

  it("explains that a personal plan on another workspace already applies everywhere", () => {
    const err = new GatewayApiError("x", 409, { error: "x", code: "BILLING_ALREADY_SUBSCRIBED" });
    expect(billingErrorMessage(err)).toContain("personal plan on another workspace");
  });

  it("does not encourage a second purchase after a connection failure", () => {
    expect(billingErrorMessage(new TypeError("Failed to fetch"))).toContain("billing status");
  });
});
