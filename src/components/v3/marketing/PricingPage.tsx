"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Card, Eyebrow, MonoLabel } from "@/components/v3/ui";
import { cn } from "@/lib/utils";
import {
  type BillingPeriod,
  PRICING_PLANS,
  ENTERPRISE_PLAN,
  COMPARISON_ROWS,
  getInheritsLabel,
  getDisplayPrice,
  getAdditionalSeatPrice,
  getComparisonPrice,
  getComparisonMonthlyEquivalent,
  COMMUNITY_EDITION_FOOTNOTE,
} from "@/lib/pricing-plans";

const COMMUNITY_EDITION_FEATURE = "Community Edition Firewall";

function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (p: BillingPeriod) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            period === "annual"
              ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_4px_20px_rgba(255,107,53,0.3)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]",
          )}
        >
          Annual
        </button>
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            period === "monthly"
              ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_4px_20px_rgba(255,107,53,0.3)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]",
          )}
        >
          Monthly
        </button>
      </div>
      <span
        className={cn(
          "font-mono text-[13px] tracking-wide",
          period === "annual"
            ? "font-semibold text-[var(--success)]"
            : "text-[var(--text-3)]",
        )}
      >
        {period === "annual"
          ? "Saving ~20% with annual billing"
          : "Save ~20% with annual billing"}
      </span>
      <span className="font-mono text-[13px] text-[var(--text-3)]">
        All prices in USD
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  period,
}: {
  plan: (typeof PRICING_PLANS)[number];
  period: BillingPeriod;
}) {
  const price = getDisplayPrice(plan, period);
  const inheritsLabel = getInheritsLabel(plan);

  const ctaButton = (
    <AccentButton className="!flex !w-full !py-3.5" disabled={!plan.ctaEnabled}>
      {plan.ctaEnabled ? plan.cta : "Coming soon"}
    </AccentButton>
  );

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
        <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
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
        <div className="text-3xl font-bold tracking-tight">{price.main}</div>
        <div className="mt-1 font-mono text-xs text-[var(--text-3)]">
          {price.sub}
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
                {feature === COMMUNITY_EDITION_FEATURE ? (
                  <>
                    {COMMUNITY_EDITION_FEATURE}
                    <sup className="ml-0.5 font-mono text-[10px] text-[var(--accent-hi)]">
                      *
                    </sup>
                  </>
                ) : (
                  feature
                )}
              </span>
            </li>
          ))}
        </ul>

        {plan.additionalSeats && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="text-xs font-medium text-[var(--text-2)]">
              {plan.additionalSeats.label}
            </div>
            <div className="mt-1 font-mono text-xs text-[var(--text-3)]">
              {getAdditionalSeatPrice(plan.additionalSeats, period)}
            </div>
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
          {plan.ctaEnabled ? (
            <AuthModalTrigger className="flex w-full">
              {ctaButton}
            </AuthModalTrigger>
          ) : (
            <>
              {ctaButton}
              <p className="mt-2 text-center font-mono text-[10px] text-[var(--text-3)]">
                Plan launching soon
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PricingPageContent() {
  const [period, setPeriod] = useState<BillingPeriod>("annual");

  return (
    <>
      <section className="mx-auto max-w-[1180px] px-4 pt-16 pb-6 text-center md:px-8 md:pt-20 md:pb-6">
        <Eyebrow className="mb-4">Agentic internet infrastructure</Eyebrow>
        <h1 className="mx-auto max-w-[900px] text-4xl font-bold leading-[1.05] tracking-[-0.04em] md:text-[56px]">
          Private internet access for{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)",
            }}
          >
            individuals, teams, and businesses.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[900px] text-base leading-relaxed text-[var(--text-2)] md:text-[19px] md:leading-[1.55]">
          Start on the{" "}
          <span className="font-medium text-[var(--text)]">
            Agentic Internet
          </span>{" "}
          with free VPN access and faster public nodes.
          <br />
          Go from VPN access to a full private network workspace with dedicated
          nodes, firewall, APIs, Drop, AI with BYOC support.
        </p>

        <div className="mt-8">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-2 pb-12 md:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:grid-rows-[auto_auto_auto_1fr_auto]">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-20 md:px-6">
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
              <Link href="/contact?category=enterprise" className="w-full">
                <AccentButton className="!flex !w-full !py-3">
                  {ENTERPRISE_PLAN.cta}
                </AccentButton>
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-4 w-full text-xs leading-relaxed text-[var(--text-3)]">
          <span className="mr-1 font-mono text-[var(--accent-hi)]">*</span>
          {COMMUNITY_EDITION_FOOTNOTE}
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <Eyebrow className="mb-4">Compare plans</Eyebrow>
          <h2 className="text-2xl font-bold md:text-3xl">
            Find the right private network tier
          </h2>
        </div>

        <div className="overflow-x-auto">
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
                  {period === "annual" ? "Annual (eff. monthly)" : "Monthly"}
                </th>
                <th className="pb-4 pr-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  {period === "annual" ? "Annual price" : "Monthly price"}
                </th>
                <th className="pb-4 font-mono text-[10px] tracking-wide text-[var(--text-3)] uppercase">
                  Includes
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => {
                const planId = row.plan.toLowerCase() as
                  | "basic"
                  | "starter"
                  | "pro"
                  | "business"
                  | "enterprise";
                const isEnterprise = planId === "enterprise";

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
                        : getComparisonMonthlyEquivalent(planId, period)}
                    </td>
                    <td className="py-4 pr-4 align-top font-mono text-[var(--text)]">
                      {getComparisonPrice(planId, period)}
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
