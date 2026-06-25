"use client";

import { useEffect, useState } from "react";
import {
  fetchRank,
  fetchLeaderboard,
  fetchPerks,
  fetchMyPerks,
  claimRankReward,
} from "@/lib/gateway/client";
import type { GatewayLeaderboardEntry, GatewayPerk, GatewayRank } from "@/lib/gateway/types";
import { AccentButton, Card, Eyebrow, MonoLabel } from "@/components/v3/ui";
import { toast } from "sonner";

export default function RewardsPage() {
  const [rank, setRank] = useState<GatewayRank | null>(null);
  const [leaderboard, setLeaderboard] = useState<GatewayLeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | undefined>();
  const [perks, setPerks] = useState<GatewayPerk[]>([]);
  const [myPerks, setMyPerks] = useState<GatewayPerk[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [metric, setMetric] = useState<"xp" | "referrals">("xp");

  const load = (leaderboardMetric: "xp" | "referrals" = metric) => {
    Promise.all([
      fetchRank(),
      fetchLeaderboard({
        metric: leaderboardMetric,
        period: leaderboardMetric === "referrals" ? "30d" : undefined,
        limit: 15,
      }),
      fetchPerks(),
      fetchMyPerks().catch(() => []),
    ]).then(([r, lb, p, mp]) => {
      setRank(r);
      setLeaderboard(lb.entries);
      setMyRank(lb.my_rank);
      setPerks(p);
      setMyPerks(mp);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async () => {
    setClaiming(true);
    try {
      await claimRankReward();
      toast.success("Claimed 7 days of access (500 XP)");
      load();
    } catch {
      toast.error("Not enough XP or already claimed");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card
        className="p-6 md:p-8"
        style={{
          borderColor: "rgba(255,107,53,0.2)",
          background:
            "radial-gradient(ellipse 80% 130% at 90% 0%, rgba(255,107,53,0.12), transparent 55%), linear-gradient(180deg, #131318, #0D0D11)",
        }}
      >
        <Eyebrow>Your rank</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-4xl font-bold tracking-tight md:text-5xl">
              {rank?.xp_earned ?? 0}{" "}
              <span className="text-lg font-medium text-[var(--text-2)]">XP earned</span>
            </div>
            <div className="mt-2 text-[var(--text-2)]">
              Tier {rank?.tier ?? 0} · {rank?.tier_name ?? "Newcomer"}
              {myRank ? ` · Leaderboard #${myRank}` : ""}
            </div>
            {rank?.next_tier_at && (
              <p className="mt-1 text-xs text-[var(--text-3)]">
                {rank.next_tier_at - (rank.xp_earned ?? 0)} XP to next tier
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-[var(--accent-hi)]">
              {rank?.xp_claimable ?? 0} claimable
            </div>
            <AccentButton
              className="mt-3"
              onClick={claim}
              disabled={claiming || (rank?.xp_claimable ?? 0) < 500}
            >
              {claiming ? "Claiming…" : "Claim 7 days (500 XP)"}
            </AccentButton>
          </div>
        </div>

        {rank?.breakdown_by_kind && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(rank.breakdown_by_kind).map(([kind, xp]) => (
              <div key={kind} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <MonoLabel>{kind.replace(/_/g, " ")}</MonoLabel>
                <div className="mt-1 font-mono text-sm text-[var(--accent-hi)]">+{xp}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="font-semibold">Leaderboard</span>
            <div className="flex gap-1">
              {(["xp", "referrals"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMetric(m);
                    load(m);
                  }}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] uppercase ${
                    metric === m
                      ? "bg-[var(--accent)]/20 text-[var(--accent-hi)]"
                      : "text-[var(--text-3)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--text-2)]">No entries yet.</p>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[var(--text-3)]">#{entry.rank}</span>
                  <span className="font-mono text-sm">{entry.wallet.slice(0, 10)}…</span>
                </div>
                <span className="font-mono text-sm text-[var(--accent-hi)]">
                  {entry.value} {metric === "referrals" ? "refs" : "XP"}
                </span>
              </div>
            ))
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-4 font-semibold">Perks catalog</div>
          {perks.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--text-2)]">No perks available yet.</p>
          ) : (
            perks.map((perk) => (
              <div
                key={perk.id}
                className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
              >
                <div>
                  <div className="font-medium">{perk.name}</div>
                  <MonoLabel>Tier {perk.tier_required}+</MonoLabel>
                </div>
                <span
                  className={`font-mono text-xs ${perk.unlocked ? "text-[var(--success)]" : "text-[var(--text-3)]"}`}
                >
                  {perk.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            ))
          )}
          {myPerks.length > 0 && (
            <div className="border-t border-white/[0.06] px-5 py-3">
              <MonoLabel className="text-[var(--success)]">Your granted perks</MonoLabel>
              <p className="mt-1 text-sm">{myPerks.map((p) => p.name).join(", ")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}