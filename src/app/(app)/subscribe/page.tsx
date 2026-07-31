"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOrgs } from "@/lib/gateway/client";
import type { GatewayOrg } from "@/lib/gateway/types";
import {
  resolveEffectiveEntitlement,
  tierLabel,
  deviceLimitForTier,
} from "@/lib/entitlements";
import { orgPlanLabel } from "@/lib/org-plans";
import { AccentButton, Card, Eyebrow } from "@/components/v3/ui";

const benefits = [
  "Full network access across eligible public nodes",
  "WireGuard + stealth protocol bundles",
  "Multiple device configs",
  "Workspace operator tools",
  "Local Drop transfer + optional storage",
  "XP rewards and rank perks",
];

export default function SubscribePage() {
  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgs()
      .then(setOrgs)
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  const entitlement = resolveEffectiveEntitlement(orgs);
  const isFree = entitlement.tier === "free";

  if (loading) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading…</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        className="p-8 text-center"
        style={{
          borderColor: "rgba(255,107,53,0.25)",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255,107,53,0.18), transparent 60%), linear-gradient(180deg, #16110D, #0B0B0E)",
        }}
      >
        <div
          className="mx-auto mb-6 flex h-[150px] w-[150px] items-center justify-center rounded-[28px] shadow-[0_24px_60px_rgba(255,107,53,0.4)]"
          style={{ background: "linear-gradient(150deg, #FF7E44, #E0531F)" }}
        >
          <div className="h-14 w-14 rotate-[-45deg] rounded-2xl border-[6px] border-[var(--on-accent)] border-r-transparent" />
        </div>
        <Eyebrow>Organization plans</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Access follows your workspace</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-2)]">
          Your tier is set by the organizations you belong to and the seats you hold. Upgrade a
          workspace plan or add a paid seat to unlock more.
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
            <span className="text-lg font-semibold">{tierLabel(entitlement.tier)}</span>
            <span className="font-mono text-xs text-[var(--text-3)]">
              {deviceLimitForTier(entitlement.tier)} devices
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-3)]">
            {entitlement.org?.name
              ? `From your seat in ${entitlement.org.name}.`
              : "Every account gets the Free tier from its personal organization."}
          </p>
        </Card>

        <Card className="p-5">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-3 py-2">
              <span className="text-[var(--success)]">✓</span>
              <span className="text-sm text-[var(--text-2)]">{b}</span>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <div className="mb-3 font-semibold">Your workspaces</div>
          {orgs.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">
              No workspaces yet.{" "}
              <Link href="/workspace" className="text-[var(--accent-hi)]">
                Create one
              </Link>{" "}
              to manage plans and seats.
            </p>
          ) : (
            orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{org.name}</span>
                <span className="font-mono text-[var(--text-3)]">
                  {orgPlanLabel(org.plan ?? org.kind)}
                  {org.has_paid_seat ? " · seat" : ""}
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
