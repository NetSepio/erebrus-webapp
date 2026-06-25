"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchNodes,
  fetchOrgs,
  fetchSubscription,
  fetchVpnClients,
} from "@/lib/gateway/client";
import { daysRemaining, planProgress, subscriptionEndDate, trialTotalDays } from "@/lib/design";
import { AccentButton, Card, StatCard, StatusDot } from "@/components/v3/ui";
import type { GatewayNode, GatewayOrg, GatewaySubscription, GatewayVpnClient } from "@/lib/gateway/types";

export default function DashboardPage() {
  const [sub, setSub] = useState<GatewaySubscription | null>(null);
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSubscription().catch(() => null),
      fetchNodes({ status: "online" }).catch(() => []),
      fetchVpnClients().catch(() => []),
      fetchOrgs().catch(() => []),
    ]).then(([s, n, c, o]) => {
      setSub(s);
      setNodes(n);
      setClients(c);
      setOrgs(o);
      setLoading(false);
    });
  }, []);

  const onlineCount = nodes.filter((n) => n.status === "online").length;
  const end = subscriptionEndDate(sub ?? undefined);
  const days = daysRemaining(end);
  const pct = planProgress(end, trialTotalDays(sub?.source));

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-2)]">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card
        className="flex flex-col items-start justify-between gap-6 p-6 md:flex-row md:items-center md:p-7"
        style={{
          borderColor: "rgba(255,107,53,0.25)",
          background:
            "radial-gradient(ellipse 70% 130% at 85% 0%, rgba(255,107,53,0.16), transparent 55%), linear-gradient(180deg, #15110D, #0C0B0E)",
        }}
      >
        <div className="flex items-center gap-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[15px] shadow-[0_12px_34px_rgba(255,107,53,0.35)]"
            style={{ background: "linear-gradient(150deg, #FF7E44, #E0531F)" }}
          >
            <div className="h-6 w-6 rotate-[-45deg] rounded-[7px] border-[3px] border-[var(--on-accent)] border-r-transparent" />
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--accent-hi)]">
              Current plan · {sub?.plan_id ?? sub?.plan ?? (sub?.entitled ? sub.source : "None")}
            </div>
            <div className="mt-1.5 text-xl font-bold tracking-tight md:text-[22px]">
              {sub?.entitled
                ? days !== null
                  ? `${days} days remaining`
                  : "Active access"
                : "No active entitlement"}
            </div>
            {sub?.entitled && (
              <div className="mt-3 h-1.5 w-full max-w-[260px] overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${100 - pct}%`,
                    background: "linear-gradient(90deg, #FF7E44, #E0531F)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <Link href="/subscribe">
          <AccentButton>
            {sub?.entitled ? "Manage access" : "Get access pass"}
          </AccentButton>
        </Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="VPN status" value={clients.length > 0 ? "Active" : "Idle"} sub={`${clients.length} devices`} valueColor="var(--success)" />
        <StatCard label="Nodes online" value={onlineCount} sub="Public network" />
        <StatCard label="Workspaces" value={orgs.length} sub="Owned + joined" />
        <StatCard label="Your nodes" value={orgs.reduce((a, o) => a + (o.node_count ?? 0), 0)} sub="Across workspaces" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="font-semibold">Your workspaces</span>
            <Link href="/workspace" className="text-[13px] font-semibold text-[var(--accent-hi)]">
              View all →
            </Link>
          </div>
          {orgs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--text-2)]">
              No workspaces yet.{" "}
              <Link href="/workspace" className="text-[var(--accent-hi)]">
                Create one
              </Link>
            </p>
          ) : (
            orgs.slice(0, 3).map((org) => (
              <Link
                key={org.id}
                href={`/workspace/${org.id}`}
                className="flex items-center gap-3.5 border-b border-white/[0.04] px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-[11px]"
                  style={{ background: "linear-gradient(135deg, #9945FF33, #FF6B3533)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{org.name}</div>
                  <div className="text-xs text-[var(--text-3)]">
                    {org.kind} · {org.member_count ?? 0} members
                  </div>
                </div>
                <div className="text-right font-mono text-[13px] text-[var(--success)]">
                  {org.online_nodes ?? 0}/{org.node_count ?? 0}
                </div>
              </Link>
            ))
          )}
          <Link
            href="/workspace"
            className="block px-5 py-3.5 text-center text-sm text-[var(--text-2)] hover:text-[var(--text)]"
          >
            + Create a workspace
          </Link>
        </Card>

        <Card className="p-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-3)]">
            <StatusDot />
            VPN quick status
          </div>
          <div className="relative mx-auto mb-4 h-24 w-24">
            <div
              className="absolute inset-4 flex items-center justify-center rounded-full"
              style={{
                background: clients.length ? "var(--success)" : "rgba(255,255,255,0.08)",
                boxShadow: clients.length ? "0 0 30px rgba(54,211,153,0.4)" : "none",
              }}
            >
              <div className="h-5 w-5 rotate-[-45deg] rounded-[7px] border-[3px] border-[var(--on-accent)] border-r-transparent" />
            </div>
          </div>
          <div className="font-semibold">{clients.length ? "Devices configured" : "Not connected"}</div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {onlineCount} nodes available
          </p>
          <Link href="/connect" className="mt-4 block">
            <AccentButton variant="ghost" className="w-full">
              Open VPN →
            </AccentButton>
          </Link>
        </Card>
      </div>
    </div>
  );
}