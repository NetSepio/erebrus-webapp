"use client";

import { useEffect, useState } from "react";
import {
  fetchSubscription,
  fetchPlans,
  startTrial,
  refreshNftEntitlement,
} from "@/lib/gateway/client";
import type { GatewayPlan, GatewaySubscription } from "@/lib/gateway/types";
import { daysRemaining, planProgress } from "@/lib/design";
import { AccentButton, Card, Eyebrow } from "@/components/v3/ui";
import { toast } from "sonner";

const benefits = [
  "Full network access across all public nodes",
  "WireGuard + stealth protocol bundles",
  "Multiple device configs",
  "Workspace operator tools",
  "XP rewards and rank perks",
];

export default function SubscribePage() {
  const [sub, setSub] = useState<GatewaySubscription | null>(null);
  const [plans, setPlans] = useState<GatewayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    Promise.all([fetchSubscription(), fetchPlans()])
      .then(([s, p]) => {
        setSub(s);
        setPlans(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const days = daysRemaining(sub?.expires_at);
  const pct = planProgress(sub?.expires_at, sub?.source === "nft" ? 30 : 7);

  const startFreeTrial = async () => {
    try {
      await startTrial();
      toast.success("7-day trial activated");
      refresh();
    } catch (err: unknown) {
      toast.error("Trial unavailable — may already be used");
    }
  };

  const refreshNft = async () => {
    try {
      await refreshNftEntitlement();
      toast.success("NFT entitlement refreshed");
      refresh();
    } catch {
      toast.error("No qualifying NFT found");
    }
  };

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
        <Eyebrow>Erebrus Access Pass</Eyebrow>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">30 days of full access</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-2)]">
          An on-chain pass that unlocks the whole network. Ownable, portable, and renewable
          whenever you choose.
        </p>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">
            Current entitlement
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-semibold capitalize">
              {sub?.entitled ? (sub.source ?? sub.plan ?? "Active") : "None"}
            </span>
            {days !== null && (
              <span className="font-mono text-xs text-[var(--accent-hi)]">{days} days left</span>
            )}
          </div>
          {sub?.entitled && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${100 - pct}%`,
                  background: "linear-gradient(90deg, #FF7E44, #E0531F)",
                }}
              />
            </div>
          )}
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
          {!sub?.entitled && !sub?.trial_consumed && (
            <AccentButton className="mb-3 w-full" onClick={startFreeTrial}>
              Start 7-day free trial
            </AccentButton>
          )}
          <AccentButton className="mb-3 w-full" variant="ghost" onClick={refreshNft}>
            Refresh NFT entitlement
          </AccentButton>
          <AccentButton className="w-full" disabled>
            Subscribe with SOL (coming soon)
          </AccentButton>
          <p className="mt-3 text-center font-mono text-[11px] text-[var(--text-3)]">
            Already holding an IslandDAO NFT? Access is automatic.
          </p>
        </Card>

        {plans.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 font-semibold">Available plans</div>
            {plans.map((plan) => (
              <div key={plan.id} className="flex justify-between py-2 text-sm">
                <span className="capitalize">{plan.name}</span>
                <span className="font-mono text-[var(--text-3)]">
                  {plan.device_limit} devices
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}