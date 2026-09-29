import { GatewayApiError } from "@/lib/gateway/client";
import type {
  GatewayBillingPlan,
  GatewayBillingPrice,
  GatewayBillingStatus,
} from "@/lib/gateway/types";

/** Gateway interval vocabulary: the pricing UI uses "annual", the API "yearly". */
export type BillingInterval = "monthly" | "yearly";

export const FREE_PLAN_ID = "personal.basic";
export const ENTERPRISE_PLAN_ID = "business.enterprise";

/** Formats a full-interval charge from integer minor units (e.g. 23988 → "$239.88"). */
export function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amountMinor / 100);
}

/** Monthly equivalent (in major units) of a yearly `amount_minor`. */
export function monthlyEquivalent(amountMinor: number): number {
  return amountMinor / 100 / 12;
}

/** Picks the gateway price for a plan + interval, if the catalog offers one. */
export function priceForInterval(
  plan: GatewayBillingPlan | undefined,
  interval: BillingInterval
): GatewayBillingPrice | undefined {
  return plan?.billing_prices?.find((p) => p.billing_interval === interval);
}

/** True only when the catalog offers the plan for this interval with checkout enabled. */
export function planOpenForCheckout(
  plan: GatewayBillingPlan | undefined,
  interval: BillingInterval
): boolean {
  return priceForInterval(plan, interval)?.checkout_enabled === true;
}

/**
 * Initial release scope: Basic (free) → paid checkout only. Paid-to-paid
 * upgrades, interval changes and Enterprise (contact sales) are not supported.
 */
export function canCheckout(currentPlan: string, targetPlan: string): boolean {
  return (
    currentPlan === FREE_PLAN_ID &&
    targetPlan !== FREE_PLAN_ID &&
    targetPlan !== ENTERPRISE_PLAN_ID
  );
}

/** Paid personal plan (Starter, Pro). Mirrors the gateway `IsPersonalPaidPlan`. */
export function isPersonalPaidPlan(plan?: string | null): boolean {
  return !!plan && plan.startsWith("personal.") && plan !== FREE_PLAN_ID;
}

export type MultiWorkspaceCheckout =
  | { kind: "ok" }
  /** Another owned workspace already has a personal plan: the gateway refuses a second one. */
  | { kind: "blocked"; org: { id: string; name: string; plan?: string } };

/** One personal plan per owner; business plans may be added to other workspaces. */
export function multiWorkspaceCheckout(
  ownedOrgs: { id: string; name: string; plan?: string }[],
  targetOrgId: string,
  targetPlan: string
): MultiWorkspaceCheckout {
  if (!isPersonalPaidPlan(targetPlan)) return { kind: "ok" };
  const personal = ownedOrgs.find((o) => o.id !== targetOrgId && isPersonalPaidPlan(o.plan));
  return personal ? { kind: "blocked", org: personal } : { kind: "ok" };
}

/** Gateway error bodies carry `{ error, code? }` — surface the code when present. */
export function billingErrorCode(err: unknown): string | null {
  if (!(err instanceof GatewayApiError)) return null;
  const body = err.body;
  if (body && typeof body === "object" && "code" in body) {
    const code = (body as { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
  }
  return null;
}

const BILLING_ERROR_MESSAGES: Record<string, string> = {
  BILLING_DISABLED: "Billing is not enabled on this deployment.",
  BILLING_EMAIL_REQUIRED:
    "Add and verify an email address on your profile before upgrading.",
  INVALID_BILLING_REQUEST: "The billing request was invalid.",
  INVALID_BILLING_PLAN: "That plan cannot be purchased through checkout.",
  BILLING_CONFLICT:
    "There is already an active subscription or checkout for this workspace.",
  BILLING_ALREADY_SUBSCRIBED:
    "You already have a personal plan on another workspace, and it applies across all your workspaces. Business plans can still be added to other workspaces.",
  BILLING_PRODUCT_UNAVAILABLE:
    "This plan is not available for purchase right now.",
  BILLING_CHECKOUT_UNCONFIRMED:
    "Checkout could not be confirmed. Check billing status before retrying.",
  BILLING_CANCEL_UNCONFIRMED:
    "Cancellation could not be confirmed. Check billing status before retrying.",
};

/** Friendly message for a gateway billing error; falls back to the raw message. */
export function billingErrorMessage(err: unknown): string {
  const code = billingErrorCode(err);
  if (code && BILLING_ERROR_MESSAGES[code]) return BILLING_ERROR_MESSAGES[code];
  if (err instanceof GatewayApiError && err.status === 409) {
    return BILLING_ERROR_MESSAGES.BILLING_CONFLICT;
  }
  if (err instanceof GatewayApiError) {
    if (err.status === 401) return "Your session has expired. Please sign in again to check billing.";
    if (err.status === 403) return "Only the workspace owner can manage billing.";
    if (err.status === 429) return "Too many requests. Please wait before checking billing again.";
    if (err.status >= 500) return "Billing is temporarily unavailable. Check billing status before trying another purchase.";
    return err.message;
  }
  return "Unable to confirm the billing request. Check your connection and billing status before trying again.";
}

/** Short human label for `GatewayBillingStatus.provider_status`. */
export function providerStatusLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    none: "No subscription",
    active: "Active",
    past_due: "Past due",
    on_hold: "On hold",
    cancelled: "Cancelled",
    expired: "Expired",
    failed: "Payment failed",
    paused: "Paused",
  };
  return labels[status ?? "none"] ?? status ?? "No subscription";
}

export function safeCheckoutUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function billingReturnPhase(status: GatewayBillingStatus, attemptId?: string | null) {
  if (status.provider_status === "active" && status.plan_id && status.plan_id !== FREE_PLAN_ID) return "active";
  if (["past_due", "on_hold", "failed", "paused"].includes(status.provider_status)) return "payment-issue";
  const attempt = status.checkout;
  if (attempt && attemptId && attempt.attempt_id === attemptId && (attempt.status === "failed" || attempt.status === "expired")) {
    return attempt.status;
  }
  return "verifying";
}
