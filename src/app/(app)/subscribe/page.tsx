"use client";

import Link from "next/link";
import { useWorkspace } from "@/context/workspace";
import { deviceLimitForTier } from "@/lib/entitlements";
import { formatStorageBytes } from "@/lib/gateway-errors";
import { orgPlanLabel } from "@/lib/org-plans";
import { AccentButton, ActionButton, Card, Eyebrow, MonoLabel } from "@/components/v3/ui";

// Only what the gateway actually provides today (Starter launch scope).
const benefits = [
  "VPN devices on public nodes (Basic 1, Starter 3)",
  "WireGuard configs you can import on any device",
  "Private workspace nodes for your members",
  "Drop storage on public nodes (Basic 500 MB, Starter 1 GB)",
  "Gateway API keys on Starter",
];

export default function SubscribePage() {
  const { orgs, entitlement, usage, loading, error, refresh } = useWorkspace();
  const isFree = entitlement.tier === "free";
  const deviceLimit = usage?.vpn.client_limit ?? deviceLimitForTier(entitlement.tier);

  if (loading && orgs.length === 0) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading…</div>;
  }
  if (error && orgs.length === 0) {
    return (
      <Card className="p-6 text-sm">
        <p role="alert" className="text-[var(--danger)]">{error}</p>
        <ActionButton variant="neutral" className="mt-3" onClick={() => void refresh()}>Retry</ActionButton>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <Card
        className="flex flex-col items-center justify-center p-6 text-center md:p-7"
        style={{
          borderColor: "rgba(255,107,53,0.25)",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255,107,53,0.18), transparent 60%), linear-gradient(180deg, #16110D, #0B0B0E)",
        }}
      >
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] shadow-[0_18px_44px_rgba(255,107,53,0.4)]"
          style={{ background: "linear-gradient(150deg, #FF7E44, #E0531F)" }}
        >
          <div className="h-8 w-8 rotate-[-45deg] rounded-[10px] border-4 border-[var(--on-accent)] border-r-transparent" />
        </div>
        <Eyebrow>Organization plans</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Access follows your workspace</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-2)]">
          Your tier is set by the organizations you belong to. Upgrade a workspace plan to unlock
          more.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/pricing">
            <AccentButton>View plans</AccentButton>
          </Link>
          <Link href="/workspace">
            <AccentButton variant="ghost">Manage workspaces</AccentButton>
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">
            Current entitlement
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-semibold">{entitlement.planLabel}</span>
            <span className="font-mono text-xs text-[var(--text-3)]">
              {deviceLimit} VPN device{deviceLimit === 1 ? "" : "s"}
              {usage ? ` · ${formatStorageBytes(usage.drop.quota_bytes)} Drop` : ""}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-3)]">
            {entitlement.org?.name
              ? `From your seat in ${entitlement.org.name}.`
              : "Every account gets the Free tier from its personal organization."}
          </p>
        </Card>

        <Card className="p-5">
          <MonoLabel>What&apos;s included</MonoLabel>
          <div className="mt-1">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 py-2">
                <span className="text-[var(--success)]">✓</span>
                <span className="text-sm text-[var(--text-2)]">{b}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 font-semibold">Your workspaces</div>
          {orgs.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">
              No workspaces yet.{" "}
              <Link href="/workspace" className="text-[var(--accent-hi)]">
                Create one
              </Link>{" "}
              to manage plans.
            </p>
          ) : (
            orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{org.name}</span>
                <span className="font-mono text-[var(--text-3)]">
                  {orgPlanLabel(org.plan ?? org.kind)}
                  {org.has_paid_seat ? " · paid seat" : ""}
                </span>
              </div>
            ))
          )}
          {isFree && (
            <p className="mt-2 text-xs text-[var(--text-3)]">
              Upgrade a workspace plan to raise your tier.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
