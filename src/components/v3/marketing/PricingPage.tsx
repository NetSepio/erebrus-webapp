"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Card, Eyebrow, MonoLabel } from "@/components/v3/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useWalletAuth } from "@/context/appkit";
import {
  fetchBillingPlans,
  fetchOrgBilling,
  fetchOrgs,
  fetchProfile,
  startOrgBillingCheckout,
} from "@/lib/gateway/client";
import type {
  GatewayBillingPlan,
  GatewayBillingPrice,
  GatewayOrg,
} from "@/lib/gateway/types";
import { isOrgOwner } from "@/lib/gateway/org-permissions";
import { orgPlanLabel } from "@/lib/org-plans";
import {
  FREE_PLAN_ID,
  billingErrorMessage,
  canCheckout,
  formatMinor,
  planOpenForCheckout,
  priceForInterval,
  safeCheckoutUrl,
  type BillingInterval,
} from "@/lib/billing";
import {
  type BillingPeriod,
  type PricingPlan,
  PRICING_PLANS,
  ENTERPRISE_PLAN,
  COMPARISON_ROWS,
  getInheritsLabel,
  getDisplayPrice,
  getComparisonPrice,
  getComparisonMonthlyEquivalent,
  COMMUNITY_EDITION_FEATURE,
  COMMUNITY_EDITION_FOOTNOTE,
  ORG_MEMBERS_NOTE,
  UNLIMITED_ORG_MEMBERS_FEATURE,
  UNLIMITED_FREE_ORG_MEMBERS_FEATURE,
} from "@/lib/pricing-plans";

import { createIdempotencyKey } from "@/lib/rewards";

const CHECKOUT_POLL_MS = 2500;
const CHECKOUT_POLL_TIMEOUT_MS = 60_000;

function intervalFor(period: BillingPeriod): BillingInterval {
  return period === "annual" ? "yearly" : "monthly";
}

/** Live gateway price wins; static marketing copy is the fallback. */
function liveDisplayPrice(
  plan: PricingPlan,
  period: BillingPeriod,
  price: GatewayBillingPrice | undefined
): { main: string; sub: string } {
  if (price) {
    if (price.billing_interval === "yearly") {
      return {
        main: `${formatMinor(Math.round(price.amount_minor / 12), price.currency)}/mo`,
        sub: `${formatMinor(price.amount_minor, price.currency)} billed annually`,
      };
    }
    return {
      main: `${formatMinor(price.amount_minor, price.currency)}/mo`,
      sub: "Billed monthly",
    };
  }
  return getDisplayPrice(plan, period);
}

type PlanCta =
  | { kind: "free" }
  | { kind: "signin" }
  | { kind: "loading" }
  | { kind: "no-owned-org" }
  | { kind: "verify-email" }
  | { kind: "current" }
  | { kind: "unavailable"; reason: string }
  | { kind: "upgrade" };

function FeatureLabel({ feature }: { feature: string }) {
  if (feature === COMMUNITY_EDITION_FEATURE) {
    return (
      <>
        {COMMUNITY_EDITION_FEATURE}
        <sup className="ml-0.5 font-mono text-[10px] text-[var(--accent-hi)]">
          *
        </sup>
      </>
    );
  }

  if (
    feature === UNLIMITED_ORG_MEMBERS_FEATURE ||
    feature === UNLIMITED_FREE_ORG_MEMBERS_FEATURE
  ) {
    return (
      <>
        {feature}
        <sup className="ml-0.5 font-mono text-[10px] text-[var(--text-3)]">
          †
        </sup>
      </>
    );
  }

  return <>{feature}</>;
}

function BillingToggle({
  period,
  onChange,
  disabled = false,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5" role="group" aria-label="Billing frequency">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          disabled={disabled}
          aria-pressed={period === "monthly"}
          className={cn(
            "min-h-9 rounded-md px-3 text-xs font-semibold transition-colors",
            period === "monthly"
              ? "bg-white/[0.09] text-[var(--text)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          disabled={disabled}
          aria-pressed={period === "annual"}
          className={cn(
            "min-h-9 rounded-md px-3 text-xs font-semibold transition-colors",
            period === "annual"
              ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_3px_14px_rgba(255,107,53,0.24)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]",
          )}
        >
          Yearly
        </button>
      </div>
      <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide", period === "annual" ? "border-[var(--success)]/25 bg-[var(--success)]/10 text-[var(--success)]" : "border-white/[0.08] text-[var(--text-3)]")}>
        Save ~20%
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  period,
  price,
  cta,
  isCurrent,
  pending,
  onUpgrade,
}: {
  plan: (typeof PRICING_PLANS)[number];
  period: BillingPeriod;
  price: GatewayBillingPrice | undefined;
  cta: PlanCta;
  isCurrent: boolean;
  pending: boolean;
  onUpgrade: (planId: string) => void;
}) {
  const display = liveDisplayPrice(plan, period, price);
  const inheritsLabel = getInheritsLabel(plan);

  return (
    <Card
      className={cn(
        "relative grid h-full grid-rows-[auto_auto_auto_1fr_auto] p-6 pt-8 xl:row-span-5 xl:grid-rows-subgrid",
        plan.highlighted &&
          "border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/20",
      )}
      style={
        plan.highlighted
          ? {
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,107,53,0.1), transparent 70%), linear-gradient(180deg, #131318, #0C0B0E)",
            }
          : undefined
      }
    >
      <div
        className={cn(
          "absolute -top-px right-4 z-10 border bg-[#131318] px-3 py-1.5 font-mono text-[10px] tracking-wide uppercase",
          plan.highlighted
            ? "border-[var(--accent)]/40 text-[var(--accent-hi)]"
            : "border-white/[0.12] text-[var(--text-2)]",
        )}
      >
        {plan.edgeBadge}
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          {plan.name}
          {isCurrent && (
            <span className="ml-2 align-middle rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--success)]">
              Current plan
            </span>
          )}
        </h3>
        <p className="font-mono text-[11px] tracking-wide text-[var(--accent-hi)] uppercase">
          {plan.subtitle}
        </p>
      </div>

      <div className="min-h-[5.5rem]">
        <p className="text-base font-medium leading-snug text-[var(--text)]">
          {plan.tagline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
          {plan.description}
        </p>
      </div>

      <div className="border-t border-white/[0.06] pt-5">
        <div className="text-3xl font-bold tracking-tight">{display.main}</div>
        <div className="mt-1 font-mono text-xs text-[var(--text-3)]">
          {display.sub}
        </div>
      </div>

      <div className="pt-5">
        {inheritsLabel ? (
          <MonoLabel className="mb-3 block !text-[var(--text-2)]">
            {inheritsLabel}
          </MonoLabel>
        ) : (
          <MonoLabel className="mb-3 block !text-[var(--text-2)]">
            Includes:
          </MonoLabel>
        )}

        {plan.seatsIncluded && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/14 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,107,53,0.12)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/20 font-mono text-base font-bold text-[var(--accent-hi)]">
              {plan.seatsIncluded.count}
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[9px] tracking-[0.14em] text-[var(--accent-hi)] uppercase">
                Seats included
              </div>
              <div className="text-sm font-semibold tracking-tight text-[var(--text)]">
                {plan.seatsIncluded.label}
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {plan.includes.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-[var(--text)]"
            >
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                strokeWidth={2.5}
              />
              <span>
                <FeatureLabel feature={feature} />
              </span>
            </li>
          ))}
        </ul>

        {plan.additionalSeats && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs font-medium text-[var(--text-2)]">
              {plan.additionalSeats.label}
            </div>
            <span className="mt-1.5 inline-block rounded-full border border-white/[0.1] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-3)]">
              Coming soon
            </span>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col pt-5">
        <MonoLabel className="mb-2 block">Best for</MonoLabel>
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {plan.bestFor.map((item) => (
            <span
              key={item}
              className="flex min-h-[2.75rem] items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-center text-[11px] leading-tight text-[var(--text-2)]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="w-full">
          {cta.kind === "free" && (
            <div className="py-3.5 text-center font-mono text-xs text-[var(--text-3)]">
              Free forever
            </div>
          )}

          {cta.kind === "loading" && (
            <AccentButton className="!flex !w-full !py-3.5" disabled>
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </AccentButton>
          )}

          {cta.kind === "signin" && (
            <AuthModalTrigger className="flex w-full">
              <AccentButton className="!flex !w-full !py-3.5">
                {plan.cta}
              </AccentButton>
            </AuthModalTrigger>
          )}

          {cta.kind === "no-owned-org" && (
            <>
              <AccentButton className="!flex !w-full !py-3.5" disabled>
                {plan.cta}
              </AccentButton>
              <p className="mt-2 text-center font-mono text-[10px] text-[var(--text-3)]">
                You must own a workspace to subscribe
              </p>
            </>
          )}

          {cta.kind === "verify-email" && (
            <Link href="/profile" className="flex w-full">
              <AccentButton className="!flex !w-full !py-3.5">
                Verify email to upgrade
              </AccentButton>
            </Link>
          )}

          {cta.kind === "current" && (
            <AccentButton className="!flex !w-full !py-3.5" disabled>
              Current plan
            </AccentButton>
          )}

          {cta.kind === "unavailable" && (
            <>
              <AccentButton className="!flex !w-full !py-3.5" disabled>
                {plan.ctaEnabled ? plan.cta : "Coming soon"}
              </AccentButton>
              <p className="mt-2 text-center font-mono text-[10px] text-[var(--text-3)]">
                {cta.reason}
              </p>
            </>
          )}

          {cta.kind === "upgrade" && (
            <AccentButton
              className="!flex !w-full !py-3.5"
              disabled={pending}
              onClick={() => onUpgrade(plan.id)}
            >
              {pending ? "Preparing checkout…" : plan.cta}
            </AccentButton>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PricingPageContent() {
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const audience = searchParams.get("audience") === "business" ? "business" : "personal";
  const visiblePlans = PRICING_PLANS.filter((plan) => plan.id.startsWith(`${audience}.`));
  const comparisonRows = COMPARISON_ROWS.filter((row) => row.planId.startsWith(`${audience}.`));

  // Auth state is cookie-based — identical markup on server and first client
  // render (signed-out), then re-resolve after mount (same pattern as RequireAuth).
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useWalletAuth();
  const authed = mounted && isAuthenticated;

  const [billingPlans, setBillingPlans] = useState<Record<string, GatewayBillingPlan>>({});
  const [ownedOrgs, setOwnedOrgs] = useState<GatewayOrg[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [recoveryOrgId, setRecoveryOrgId] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);
  const checkoutController = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => checkoutController.current?.abort();
  }, []);

  useEffect(() => {
    let active = true;
    setCatalogError(false);
    fetchBillingPlans()
      .then((plans) => {
        if (active) setBillingPlans(Object.fromEntries(plans.map((p) => [p.id, p])));
      })
      .catch(() => { if (active) { setBillingPlans({}); setCatalogError(true); } });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    let active = true;
    setAccountError(false);
    if (!authed) {
      setOwnedOrgs([]);
      setSelectedOrgId(null);
      setEmailVerified(null);
      setPendingPlanId(null);
      checkoutController.current?.abort();
      return;
    }
    setOrgsLoading(true);
    Promise.all([fetchOrgs(), fetchProfile()])
      .then(([orgs, profile]) => {
        if (!active) return;
        setOwnedOrgs(orgs.filter((o) => isOrgOwner(o)));
        setEmailVerified(profile.email_verified === true);
      })
      .catch(() => { if (active) setAccountError(true); })
      .finally(() => { if (active) setOrgsLoading(false); });
    return () => { active = false; };
  }, [authed, retry]);

  const selectedOrg =
    ownedOrgs.find((o) => o.id === selectedOrgId) ?? ownedOrgs[0] ?? null;

  const setAudience = (value: "personal" | "business") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("audience", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /**
   * Poll billing until the checkout attempt resolves: `ready` hands back the
   * Dodo URL to redirect to, `completed`/`active` means payment already landed.
   * Only `GET /orgs/:id/billing` is trusted — never the redirect params.
   */
  const pollCheckout = async (orgId: string, attemptId: string, signal: AbortSignal) => {
    const deadline = Date.now() + CHECKOUT_POLL_TIMEOUT_MS;
    while (Date.now() < deadline && !signal.aborted) {
      await new Promise((r) => setTimeout(r, CHECKOUT_POLL_MS));
      if (signal.aborted) return;
      if (document.visibilityState === "hidden") continue;
      const status = await fetchOrgBilling(orgId, signal).catch(() => null);
      if (signal.aborted) return;
      if (!status) continue;
      if (status.provider_status === "active" && status.plan_id !== FREE_PLAN_ID) {
        toast.success("Subscription activated");
        router.push(`/workspace/${orgId}?tab=billing`);
        return;
      }
      const attempt = status.checkout;
      if (!attempt || attempt.attempt_id !== attemptId) continue;
      const url = safeCheckoutUrl(attempt.checkout_url);
      if (attempt.status === "ready" && url) {
        window.location.assign(url);
        return;
      }
      if (attempt.status === "completed") {
        router.push(`/billing/return?org_id=${orgId}&attempt_id=${encodeURIComponent(attemptId)}`);
        return;
      }
      if (attempt.status === "failed" || attempt.status === "expired") {
        toast.error("Checkout could not be prepared. Please try again.");
        return;
      }
    }
    if (!signal.aborted) {
      setRecoveryOrgId(orgId);
      toast.message("Checkout is still being prepared. Check workspace billing before another purchase.");
    }
  };

  const startCheckout = async (planId: string) => {
    if (!selectedOrg || checkoutInFlight.current || accountError || catalogError || !emailVerified || recoveryOrgId === selectedOrg.id) return;
    const price = priceForInterval(billingPlans[planId], intervalFor(period));
    if (!price?.checkout_enabled || !canCheckout(selectedOrg.plan ?? FREE_PLAN_ID, planId)) return;
    checkoutInFlight.current = true;
    const controller = new AbortController();
    checkoutController.current = controller;
    setPendingPlanId(planId);
    const orgId = selectedOrg.id;
    const timeout = setTimeout(() => {
      if (controller.signal.aborted) return;
      setRecoveryOrgId(orgId);
      setPendingPlanId(null);
      controller.abort();
    }, CHECKOUT_POLL_TIMEOUT_MS);
    try {
      const current = await fetchOrgBilling(orgId, controller.signal);
      if (controller.signal.aborted) return;
      if (!canCheckout(current.plan_id, planId) || (current.checkout && ["ready", "creating", "unknown"].includes(current.checkout.status))) {
        setRecoveryOrgId(orgId);
        toast.message("Review the existing subscription or checkout in workspace billing.");
        return;
      }
      // One key per attempt, kept in component state only.
      const idempotencyKey = createIdempotencyKey();
      const attempt = await startOrgBillingCheckout(orgId, {
        plan_id: planId,
        billing_interval: intervalFor(period),
        idempotency_key: idempotencyKey,
      });
      if (controller.signal.aborted) return;
      const url = safeCheckoutUrl(attempt.checkout_url);
      if (attempt.status === "ready" && url) {
        setRecoveryOrgId(orgId);
        window.location.assign(url);
        return;
      }
      if (attempt.status === "creating" || attempt.status === "unknown") {
        toast.message("Preparing checkout…");
        await pollCheckout(orgId, attempt.attempt_id, controller.signal);
        return;
      }
      if (attempt.status === "completed") {
        setRecoveryOrgId(orgId);
        router.push(`/billing/return?org_id=${orgId}&attempt_id=${encodeURIComponent(attempt.attempt_id)}`);
        return;
      }
      setRecoveryOrgId(orgId);
      toast.message("Review checkout status in workspace billing before trying again.");
    } catch (err) {
      if (controller.signal.aborted) return;
      setRecoveryOrgId(orgId);
      toast.error(billingErrorMessage(err));
    } finally {
      clearTimeout(timeout);
      checkoutInFlight.current = false;
      if (!controller.signal.aborted) setPendingPlanId(null);
    }
  };

  const resolveCta = (plan: (typeof PRICING_PLANS)[number]): PlanCta => {
    if (plan.id === "personal.basic") return { kind: "free" };
    if (!authed) {
      const catalogLoaded = Object.keys(billingPlans).length > 0;
      return catalogLoaded && !planOpenForCheckout(billingPlans[plan.id], intervalFor(period))
        ? { kind: "unavailable", reason: "Plan launching soon" }
        : { kind: "signin" };
    }
    if (catalogError || accountError) return { kind: "unavailable", reason: "Could not load checkout details. Use Retry on this page." };
    if (recoveryOrgId && recoveryOrgId === selectedOrg?.id) return { kind: "unavailable", reason: "Review workspace billing before another purchase." };
    if (orgsLoading || emailVerified === null) return { kind: "loading" };
    if (ownedOrgs.length === 0) return { kind: "no-owned-org" };
    if (!selectedOrg) return { kind: "loading" };
    if (emailVerified === false) return { kind: "verify-email" };
    if (selectedOrg.plan === plan.id) return { kind: "current" };
    if (!canCheckout(selectedOrg.plan ?? FREE_PLAN_ID, plan.id)) {
      return { kind: "unavailable", reason: "Plan changes aren't supported yet" };
    }
    const price = priceForInterval(billingPlans[plan.id], intervalFor(period));
    if (!price) {
      return { kind: "unavailable", reason: "Not available for this interval" };
    }
    if (!planOpenForCheckout(billingPlans[plan.id], intervalFor(period))) {
      return { kind: "unavailable", reason: "Plan launching soon" };
    }
    return { kind: "upgrade" };
  };

  const liveComparisonPrice = (planId: string, p: BillingPeriod): string => {
    const price = priceForInterval(billingPlans[planId], intervalFor(p));
    if (price) {
      return `${formatMinor(price.amount_minor, price.currency)}/${price.billing_interval === "yearly" ? "yr" : "mo"}`;
    }
    return getComparisonPrice(planId as never, p);
  };

  const liveComparisonMonthly = (planId: string, p: BillingPeriod): string => {
    const price = priceForInterval(billingPlans[planId], intervalFor(p));
    if (price) {
      const perMonth =
        price.billing_interval === "yearly"
          ? Math.round(price.amount_minor / 12)
          : price.amount_minor;
      return `${formatMinor(perMonth, price.currency)}/mo`;
    }
    return getComparisonMonthlyEquivalent(planId as never, p);
  };

  return (
    <>
      <section className="mx-auto max-w-[1180px] px-4 pt-16 pb-6 text-center md:px-8 md:pt-20 md:pb-6">
        <Eyebrow className="mb-4">Plans for the way you connect</Eyebrow>
        <h1 className="mx-auto max-w-[900px] text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-[56px]">
          {audience === "business" ? "Private infrastructure for " : "Private connectivity for "}{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)",
            }}
          >
            {audience === "business" ? "growing teams." : "individuals and families."}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[900px] text-base leading-relaxed text-[var(--text-2)] md:text-[19px] md:leading-[1.55]">
          {audience === "business"
            ? "Start with a dedicated company gateway, add business firewall protection, and connect private AI services when your team is ready."
            : "Start free, unlock faster VPN access, or add a dedicated network and Shield protection for a household or small shared group."}
        </p>

        <div className="mt-8 flex flex-col items-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Pricing audience">
            {(["personal", "business"] as const).map((value) => <button key={value} type="button" onClick={() => setAudience(value)} aria-pressed={audience === value} className={cn("min-h-11 rounded-full px-6 text-sm font-semibold capitalize transition-colors", audience === value ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--text-2)] hover:text-[var(--text)]")}>{value}</button>)}
          </div>
        </div>

        {authed && (
          <div className="mt-8 flex flex-col items-center gap-2.5">
            <MonoLabel>
              {ownedOrgs.length > 0 ? "Subscribing" : "Workspace"}
            </MonoLabel>
            {ownedOrgs.length > 0 ? (
              <Select
                value={selectedOrg?.id ?? ""}
                disabled={pendingPlanId !== null}
                onValueChange={(v) => setSelectedOrgId(v)}
              >
                <SelectTrigger aria-label="Workspace to subscribe" className="w-full max-w-[300px] border-white/10 bg-white/[0.03]">
                  <SelectValue placeholder="Choose a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {ownedOrgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} — {orgPlanLabel(o.plan ?? o.kind)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              !orgsLoading && !accountError && (
                <p className="text-sm text-[var(--text-3)]">
                  You must own a workspace to subscribe.
                </p>
              )
            )}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-2 pb-12 md:px-8">
        {(catalogError || accountError) && (
          <Card className="mb-5 p-4 text-sm">
            <p role="alert">{catalogError ? "Live pricing could not be loaded. Displayed prices are informational; checkout is unavailable until pricing is confirmed." : "We could not load your account and workspace details."}</p>
            <button type="button" disabled={pendingPlanId !== null} onClick={() => setRetry((value) => value + 1)} className="mt-2 min-h-11 font-semibold text-[var(--accent-hi)] underline">Retry</button>
          </Card>
        )}
        {recoveryOrgId && (
          <Card className="mb-5 p-4 text-sm">
            <p role="status">Review your existing checkout or subscription before making another purchase.</p>
            <Link href={`/workspace/${recoveryOrgId}?tab=billing`} className="mt-2 inline-flex min-h-11 items-center font-semibold text-[var(--accent-hi)] underline">Open workspace billing</Link>
          </Card>
        )}
        {pendingPlanId && <p role="status" className="mb-4 text-sm text-[var(--text-2)]">Preparing {orgPlanLabel(pendingPlanId)} for {selectedOrg?.name}. Please keep this page open.</p>}
        <div className="mb-5 flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">All prices in USD</span>
          <BillingToggle period={period} onChange={setPeriod} disabled={pendingPlanId !== null} />
        </div>
        <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-rows-[auto_auto_auto_1fr_auto]", audience === "personal" ? "xl:grid-cols-3" : "xl:grid-cols-2")}>
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              period={period}
              price={priceForInterval(billingPlans[plan.id], intervalFor(period))}
              cta={resolveCta(plan)}
              isCurrent={authed && selectedOrg?.plan === plan.id}
              pending={pendingPlanId !== null}
              onUpgrade={startCheckout}
            />
          ))}
        </div>
      </section>

      {audience === "business" && <section className="mx-auto max-w-[1280px] px-4 pb-20 md:px-6">
        <Card
          className="p-6 md:p-8"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(255,107,53,0.12), transparent 55%), linear-gradient(180deg, #131318, #0C0B0E)",
          }}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center lg:gap-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-2xl font-bold md:text-[28px]">
                  {ENTERPRISE_PLAN.name}
                </h2>
                <span className="font-mono text-[11px] tracking-wide text-[var(--accent-hi)] uppercase">
                  {ENTERPRISE_PLAN.subtitle}
                </span>
              </div>
              <p className="mt-1.5 text-base font-medium">
                {ENTERPRISE_PLAN.tagline}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-2)]">
                {ENTERPRISE_PLAN.description}
              </p>

              <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {ENTERPRISE_PLAN.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-snug text-[var(--text-2)]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-4 border-t border-white/[0.06] pt-5 lg:w-[220px] lg:border-t-0 lg:pt-0 lg:text-right">
              <div>
                <div className="text-2xl font-bold tracking-tight">Custom</div>
                <div className="mt-0.5 font-mono text-[11px] text-[var(--text-3)]">
                  Tailored to your deployment
                </div>
              </div>
              <Link href="/contact?intent=deployment&plan=business.enterprise" className="w-full">
                <AccentButton className="!flex !w-full !py-3">
                  {ENTERPRISE_PLAN.cta}
                </AccentButton>
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-4 space-y-2">
          <p className="w-full text-xs leading-relaxed text-[var(--text-3)]">
            <span className="mr-1 font-mono text-[var(--accent-hi)]">*</span>
            {COMMUNITY_EDITION_FOOTNOTE}
          </p>
          <p className="w-full text-xs leading-relaxed text-[var(--text-3)]">
            <span className="mr-1 font-mono text-[var(--accent-hi)]">†</span>
            {ORG_MEMBERS_NOTE}
          </p>
        </div>
      </section>}

      <section className="mx-auto w-full min-w-0 max-w-[1180px] px-4 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <Eyebrow className="mb-4">Compare plans</Eyebrow>
          <h2 className="text-2xl font-bold md:text-3xl">
            Find the right private network tier
          </h2>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pb-4 pr-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  Plan
                </th>
                <th className="pb-4 pr-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  Best for
                </th>
                <th className="pb-4 pr-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  {period === "annual" ? "Yearly (eff. monthly)" : "Monthly"}
                </th>
                <th className="pb-4 pr-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  {period === "annual" ? "Yearly price" : "Monthly price"}
                </th>
                <th className="pb-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  Includes
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => {
                const planId = row.planId;
                const isEnterprise = planId === "business.enterprise";

                return (
                  <tr key={row.plan} className="border-b border-white/[0.05]">
                    <td className="py-4 pr-4 align-top">
                      <div className="font-semibold">{row.plan}</div>
                      <div className="font-mono text-[10px] text-[var(--accent-hi)] uppercase">
                        {row.subtitle}
                      </div>
                    </td>
                    <td className="py-4 pr-4 align-top text-[var(--text-2)]">
                      {row.bestFor}
                    </td>
                    <td className="py-4 pr-4 align-top font-mono text-[var(--text)]">
                      {isEnterprise
                        ? "Custom"
                        : liveComparisonMonthly(planId, period)}
                    </td>
                    <td className="py-4 pr-4 align-top font-mono text-[var(--text)]">
                      {liveComparisonPrice(planId, period)}
                    </td>
                    <td className="py-4 align-top text-[var(--text-2)]">
                      {row.keyIncludes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
