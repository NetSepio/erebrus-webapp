"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchOrgBilling,
  requestOrgBillingCancel,
  GatewayApiError,
} from "@/lib/gateway/client";
import type { GatewayBillingStatus, GatewayOrg } from "@/lib/gateway/types";
import { isOrgOwner } from "@/lib/gateway/org-permissions";
import { useOptionalWorkspace } from "@/context/workspace";
import { orgPlanLabel } from "@/lib/org-plans";
import {
  billingErrorMessage,
  formatMinor,
  providerStatusLabel,
  safeCheckoutUrl,
} from "@/lib/billing";
import {
  actionButtonClass,
  ActionButton,
  Card,
  MonoLabel,
  StatusDot,
} from "@/components/v3/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : format(d, "PPP");
}

function statusColor(status: string | undefined): string {
  switch (status) {
    case "active":
      return "var(--success)";
    case "past_due":
    case "on_hold":
      return "var(--danger)";
    case "cancelled":
    case "expired":
      return "var(--text-3)";
    default:
      return "var(--text-2)";
  }
}

/** Consistent banner for billing notices — one pattern, three tones. */
function NoticeCard({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "text-[var(--text-2)]",
    accent: "border-[var(--accent)]/25 bg-[var(--accent)]/5 text-[var(--text-2)]",
    danger: "border-[var(--danger)]/30 bg-[var(--danger)]/5 text-[var(--danger)]",
  };
  return (
    <Card className={cn("flex flex-wrap items-center gap-3 p-4 text-sm", tones[tone])}>
      {children}
    </Card>
  );
}

export function BillingPanel({ org }: { org: GatewayOrg }) {
  const workspace = useOptionalWorkspace();
  const [status, setStatus] = useState<GatewayBillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const cancelInFlight = useRef(false);
  const request = useRef<AbortController | null>(null);
  const currentOrgId = useRef(org.id);
  currentOrgId.current = org.id;

  const isOwner = isOrgOwner(org);

  const load = useCallback(() => {
    if (!isOwner) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    fetchOrgBilling(org.id, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setStatus(value); })
      .catch((e) => {
        if (controller.signal.aborted) return;
        // Orgs with no billing record may 404 — that is "no subscription".
        if (e instanceof GatewayApiError && e.status === 404) {
          setStatus(null);
          return;
        }
        setError(billingErrorMessage(e));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  }, [org.id, isOwner]);

  useEffect(() => {
    setStatus(null);
    setCancelPending(false);
    setConfirmOpen(false);
    load();
    return () => request.current?.abort();
  }, [load]);

  const handleCancel = async () => {
    if (!isOwner || cancelInFlight.current || cancelPending) return;
    cancelInFlight.current = true;
    setCancelling(true);
    try {
      await requestOrgBillingCancel(org.id);
      if (currentOrgId.current !== org.id) return;
      setCancelPending(true);
      toast.success("Cancellation requested. Check billing status for confirmation.");
      setConfirmOpen(false);
      load();
    } catch (e) {
      if (currentOrgId.current !== org.id) return;
      setCancelPending(!(e instanceof GatewayApiError) || e.status >= 500);
      toast.error(billingErrorMessage(e));
      setConfirmOpen(false);
      load();
    } finally {
      cancelInFlight.current = false;
      setCancelling(false);
    }
  };

  if (!isOwner) {
    return <Card className="p-5 text-sm text-[var(--text-2)]">Only the workspace owner can view and manage billing. Contact your owner for plan changes.</Card>;
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-10">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-[var(--accent)]" />
        <span role="status" className="ml-3 text-sm text-[var(--text-2)]">Loading billing status…</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5 text-sm text-[var(--danger)]">
        <p role="alert">{error}</p>
        <ActionButton variant="neutral" className="mt-3" onClick={load}>Check billing again</ActionButton>
      </Card>
    );
  }

  const planId = status?.plan_id ?? org.plan ?? org.kind;
  // What Basic means for this user after paid access ends (gateway numbers).
  const basicDevices = workspace?.usage?.vpn.limit_after_access_ends ?? 1;
  const liveDevices = (workspace?.usage?.vpn.public_clients ?? 0) - (workspace?.usage?.vpn.paused_clients ?? 0);
  const suppliesPlan = workspace?.usage?.entitlement_org?.id === org.id;
  const toPause = suppliesPlan ? Math.max(0, liveDevices - basicDevices) : 0;
  const afterBasicShort = `Basic allows ${basicDevices} VPN device${basicDevices === 1 ? "" : "s"} on public nodes.`;
  const afterBasic = `After that the workspace moves to Basic. ${afterBasicShort}${
    toPause > 0 ? ` ${toPause} of your devices will be paused (newest first) — remove the ones you don't need.` : ""
  }`;
  const nextBilling = fmtDate(status?.next_billing_date);
  const paidAccessUntil = fmtDate(status?.paid_access_until);
  const pastDueEnds = fmtDate(status?.past_due_ends_at);
  const checkoutInProgress =
    status?.checkout &&
    ["creating", "unknown", "ready"].includes(status.checkout.status);
  const canCancel =
    isOwner &&
    !cancelPending &&
    status?.provider_status === "active" &&
    !status.cancel_at_period_end;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-semibold">Billing for {org.name}</p>
        <ActionButton variant="neutral" disabled={cancelling} onClick={load}>Refresh status</ActionButton>
      </div>
      {cancelPending && !status?.cancel_at_period_end && (
        <NoticeCard>
          <p role="status" className="min-w-0 flex-1">Cancellation confirmation is pending. Refresh the status before sending another request. Your current access is shown below.</p>
        </NoticeCard>
      )}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <MonoLabel>Current plan</MonoLabel>
            <div className="mt-1.5 text-xl font-semibold">
              {orgPlanLabel(planId)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot color={statusColor(status?.provider_status)} />
            <span className="font-mono text-xs uppercase tracking-wide text-[var(--text-2)]">
              {providerStatusLabel(status?.provider_status)}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <MonoLabel>Billing interval</MonoLabel>
            <div className="mt-1 text-sm capitalize">
              {status?.billing_interval ?? "—"}
            </div>
          </div>
          <div>
            <MonoLabel>Amount</MonoLabel>
            <div className="mt-1 text-sm">
              {status?.recurring_amount_minor != null
                ? `${formatMinor(
                    status.recurring_amount_minor,
                    status.currency ?? "USD"
                  )}${status.billing_interval === "yearly" ? "/yr" : "/mo"}`
                : "—"}
            </div>
          </div>
          <div>
            <MonoLabel>Next billing date</MonoLabel>
            <div className="mt-1 text-sm">{nextBilling ?? "—"}</div>
          </div>
          <div>
            <MonoLabel>Access until</MonoLabel>
            <div className="mt-1 text-sm">{paidAccessUntil ?? "—"}</div>
          </div>
        </div>
      </Card>

      {status?.cancel_at_period_end && (
        <NoticeCard tone="accent">
          <p className="min-w-0 flex-1">
            Cancels on{" "}
            <span className="font-semibold text-[var(--text)]">
              {nextBilling ?? paidAccessUntil ?? "the next billing date"}
            </span>
            {paidAccessUntil ? ` — access remains until ${paidAccessUntil}.` : "."} {afterBasic}
          </p>
        </NoticeCard>
      )}

      {(status?.provider_status === "cancelled" || status?.provider_status === "expired") && (
        <NoticeCard>
          <p className="min-w-0 flex-1">
            This subscription has ended and the workspace is on Basic. {afterBasicShort} Upgrade again from Plans at any time.
          </p>
        </NoticeCard>
      )}

      {(status?.provider_status === "past_due" ||
        status?.provider_status === "on_hold") && (
        <NoticeCard tone="danger">
          <p className="min-w-0 flex-1">
            {status.provider_status === "past_due"
              ? `A payment is past due${
                  pastDueEnds ? ` — resolve it by ${pastDueEnds}` : ""
                } to keep your subscription active.`
              : "This subscription is on hold due to a payment issue. Update your payment method to restore paid access."}{" "}
            {status.provider_status === "on_hold" ? afterBasicShort : ""}
          </p>
        </NoticeCard>
      )}

      {checkoutInProgress && (
        <NoticeCard>
          <span role="status" className="min-w-0 flex-1">An existing checkout is pending. Resume it if you have not paid, or refresh the status if you have.</span>
          {status?.checkout?.status === "ready" && safeCheckoutUrl(status.checkout.checkout_url) && (
            <a
              href={safeCheckoutUrl(status.checkout.checkout_url)!}
              className={actionButtonClass("accent")}
            >
              Resume checkout
            </a>
          )}
        </NoticeCard>
      )}

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm text-[var(--text-2)]">
            {isOwner
              ? "Plan changes and invoices are handled through checkout."
              : "Only the workspace owner can change or cancel the plan."}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwner && (
              <Link href="/pricing">
                <ActionButton type="button" variant="neutral">
                  View plans
                </ActionButton>
              </Link>
            )}
            {canCancel && (
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => setConfirmOpen(true)}
              >
                Cancel at next billing date
              </ActionButton>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!cancelInFlight.current) setConfirmOpen(open); }}>
        <AlertDialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-2)]">
              Cancellation takes effect on{" "}
              {nextBilling ?? "the next billing date"}. Your workspace keeps
              paid access
              {paidAccessUntil ? ` until ${paidAccessUntil}` : " until then"}. {afterBasic}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling} className="border-white/10 bg-white/[0.05]">
              Keep plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
              disabled={cancelling}
              className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
            >
              {cancelling ? "Cancelling…" : "Cancel at next billing date"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
