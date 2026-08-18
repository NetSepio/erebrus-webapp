"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Server, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, ActionButton, Card, Eyebrow, MonoLabel, StatCard } from "@/components/v3/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWalletAuth } from "@/context/appkit";
import {
  createRewardWithdrawal,
  fetchCurrentGenesisSeason,
  fetchGenesisLeaderboard,
  fetchOperatorRewardSummary,
  fetchRewardCapacity,
  fetchRewardWithdrawals,
  GatewayApiError,
  previewRewardClaim,
  reserveRewardCapacity,
} from "@/lib/gateway/client";
import type {
  ClaimPreview,
  GenesisLeaderboardEntry,
  GenesisSeason,
  OperatorRewardSummary,
  RewardCapacitySlot,
  RewardWithdrawal,
} from "@/lib/gateway/types";
import { ACTIVE_WITHDRAWAL_STATUSES, canCreateClaim, createIdempotencyKey, withdrawalStatusLabel } from "@/lib/rewards";
import { cn } from "@/lib/utils";

const FILTERS = ["overall", "vpn", "ai"] as const;

function shortAddress(value: string): string {
  return value.length < 14 ? value : `${value.slice(0, 6)}…${value.slice(-5)}`;
}

function StateBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  const positive = ["open", "active", "paid", "excellent"].includes(key);
  const warning = ["reserved", "pending", "approved", "processing", "priority", "wanted"].includes(key);
  return (
    <span className={cn(
      "rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase",
      positive && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      warning && "border-amber-400/30 bg-amber-400/10 text-amber-200",
      !positive && !warning && "border-white/10 bg-white/[0.04] text-[var(--text-2)]"
    )}>{value}</span>
  );
}

function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
      <Link href="/" className="text-lg font-bold tracking-tight">Erebrus</Link>
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-sm text-[var(--text-2)] hover:text-[var(--text)]">Dashboard</Link>
        <AuthModalTrigger><AccentButton className="!px-4 !py-2">Connect</AccentButton></AuthModalTrigger>
      </div>
    </header>
  );
}

function BudgetPanel({ season }: { season: GenesisSeason }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Spent" value={`${season.spent_usdc} USDC`} />
      <StatCard label="Reserved" value={`${season.reserved_usdc} USDC`} />
      <StatCard label="Remaining" value={`${season.remaining_usdc} USDC`} valueColor="var(--success)" />
      {season.buckets.map((bucket) => (
        <Card key={bucket.key} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{bucket.label}</span>
            <span className="font-mono text-sm text-[var(--accent-hi)]">{bucket.allocation_usdc} USDC</span>
          </div>
          {bucket.allocation_percent && <p className="mt-1 text-xs text-[var(--text-3)]">{bucket.allocation_percent}% of the Season pool</p>}
        </Card>
      ))}
    </div>
  );
}

function CapacityCard({ slot, authenticated, onReserve }: {
  slot: RewardCapacitySlot;
  authenticated: boolean;
  onReserve: (slot: RewardCapacitySlot) => void;
}) {
  const title = slot.kind === "vpn"
    ? [slot.city, slot.country].filter(Boolean).join(", ") || "VPN capacity"
    : slot.checkpoint || slot.model_family || "AI capacity";
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <MonoLabel>{slot.kind === "vpn" ? "VPN reward slot" : "AI capacity request"}</MonoLabel>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
          {slot.kind === "ai" && slot.quantization && <p className="text-xs text-[var(--text-3)]">{slot.quantization}</p>}
        </div>
        <StateBadge value={slot.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StateBadge value={slot.demand_label} />
        {slot.mode && <StateBadge value={slot.mode} />}
      </div>
      <p className="mt-3 text-sm text-[var(--text-2)]">
        {slot.kind === "vpn"
          ? `${slot.slots_available ?? 0} slot${slot.slots_available === 1 ? "" : "s"} open`
          : `${slot.slots_requested ?? 0} requested · ${slot.current_capacity ?? 0} active`}
      </p>
      {slot.kind === "ai" && <p className="mt-2 text-xs text-[var(--text-3)]">{slot.mode === "persistent" ? "Expected to remain available; qualifies through verified availability and usage." : "Contributes while online; earns primarily from verified capacity and usage."}</p>}
      {slot.kind === "vpn" && <p className="mt-2 text-xs text-[var(--text-3)]">2 vCPU · 2–4 GB RAM · unique static public IPv4 · public permissionless VPN · no firewall configuration</p>}
      {slot.reservation_expires_at && <p className="mt-3 font-mono text-[11px] text-amber-200">Reserved until {new Date(slot.reservation_expires_at).toLocaleString()}</p>}
      {slot.reservable && slot.status.toLowerCase() === "open" && (
        <div className="mt-auto pt-5">
          {authenticated ? <ActionButton onClick={() => onReserve(slot)}>Reserve slot</ActionButton> : <AuthModalTrigger><ActionButton>Sign in to reserve</ActionButton></AuthModalTrigger>}
        </div>
      )}
    </Card>
  );
}

function WithdrawalHistory({ rows }: { rows: RewardWithdrawal[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4 font-semibold">Withdrawal history</div>
      {rows.length === 0 ? <p className="px-5 py-8 text-sm text-[var(--text-2)]">No USDC claims yet.</p> : rows.map((row) => (
        <div key={row.id} className="grid gap-2 border-b border-white/[0.04] px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-medium">{row.amount_usdc} USDC · {row.xp_amount.toLocaleString()} XP {row.status === "paid" ? "deducted" : "reserved"}</p>
            <p className="mt-1 text-xs text-[var(--text-3)]">{new Date(row.created_at).toLocaleString()} · {shortAddress(row.payout_wallet)}</p>
            {row.rejection_reason && <p className="mt-1 text-xs text-[var(--danger)]">Reason: {row.rejection_reason}</p>}
          </div>
          <StateBadge value={withdrawalStatusLabel(row.status)} />
          {row.transaction_signature && <a className="inline-flex items-center gap-1 text-xs text-[var(--accent-hi)]" href={`https://solscan.io/tx/${encodeURIComponent(row.transaction_signature)}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={12} /></a>}
        </div>
      ))}
    </Card>
  );
}

function ClaimDialog({ open, onOpenChange, summary, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: OperatorRewardSummary;
  onCreated: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(summary.claimable_usdc);
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [key, setKey] = useState(createIdempotencyKey);

  useEffect(() => {
    if (!open || !amount) return;
    setPreviewing(true);
    const timer = window.setTimeout(() => {
      previewRewardClaim(amount)
        .then(setPreview)
        .catch((error) => {
          setPreview(null);
          if (error instanceof GatewayApiError) toast.error(error.message);
        })
        .finally(() => setPreviewing(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [amount, open]);

  const submit = async () => {
    if (!preview || !confirmed || submitting) return;
    setSubmitting(true);
    try {
      await createRewardWithdrawal(preview.amount_usdc, key);
      toast.success("Withdrawal request submitted for review");
      await onCreated();
      onOpenChange(false);
      setKey(createIdempotencyKey());
    } catch (error) {
      // A browser timeout is ambiguous. Reconcile authoritative history before
      // another submission can be made with a new idempotency key.
      try {
        const latest = await fetchRewardWithdrawals();
        const active = latest.withdrawals.some((row) => ACTIVE_WITHDRAWAL_STATUSES.includes(row.status.toLowerCase()));
        if (active) {
          toast.info("Your request exists and is being processed.");
          await onCreated();
          onOpenChange(false);
          return;
        }
      } catch { /* Preserve the original Gateway error below. */ }
      toast.error(error instanceof GatewayApiError ? error.message : "Could not confirm the request. Refresh before retrying.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[var(--elevated)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle>Claim Genesis USDC</DialogTitle>
          <DialogDescription className="text-[var(--text-2)]">The Gateway calculates the final XP impact. Network: Solana · Token: USDC.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><MonoLabel>Available to claim</MonoLabel><p className="mt-1 text-2xl font-bold">{summary.claimable_usdc} USDC</p></div>
          <div><label htmlFor="claim-amount" className="text-sm font-medium">Amount (minimum {summary.minimum_claim_usdc} USDC)</label><Input id="claim-amount" type="number" min={summary.minimum_claim_usdc} max={summary.claimable_usdc} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" /></div>
          {previewing && <p className="flex items-center gap-2 text-sm text-[var(--text-2)]"><Loader2 size={14} className="animate-spin" /> Getting authoritative preview…</p>}
          {preview && !previewing && <Card className="space-y-3 p-4">
            <div className="flex justify-between"><span className="text-[var(--text-2)]">You are claiming</span><strong>{preview.amount_usdc} USDC</strong></div>
            <div className="flex justify-between"><span className="text-[var(--text-2)]">XP reserved for claim</span><strong>{preview.xp_to_reserve.toLocaleString()} XP</strong></div>
            <div className="flex justify-between"><span className="text-[var(--text-2)]">Retained XP if paid</span><strong>{preview.projected_retained_xp.toLocaleString()} XP</strong></div>
            <div className="flex justify-between"><span className="text-[var(--text-2)]">Verified wallet</span><button onClick={() => navigator.clipboard.writeText(preview.payout_wallet)} className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent-hi)]">{shortAddress(preview.payout_wallet)} <Copy size={12} /></button></div>
            <p className="text-xs text-[var(--text-3)]">The XP is only deducted after the USDC payment succeeds. It remains reserved while payment is pending or processing.</p>
          </Card>}
          <label className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-sm"><Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} className="mt-0.5" /><span>Claiming USDC converts part of my Genesis reward into cash now. Corresponding XP is deducted only after payout succeeds. Unclaimed XP may qualify for future rewards, but no token value or conversion is guaranteed.</span></label>
          <AccentButton className="w-full" disabled={!preview || !confirmed || submitting || previewing} onClick={submit}>{submitting ? "Submitting…" : "Confirm claim request"}</AccentButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OperatorDashboard({ summary, withdrawals, onRefresh }: { summary: OperatorRewardSummary; withdrawals: RewardWithdrawal[]; onRefresh: () => Promise<void> }) {
  const [claimOpen, setClaimOpen] = useState(false);
  const disabledReason = summary.payouts_paused ? "Payouts are temporarily paused." : summary.conflicting_withdrawal ? "A withdrawal is already pending or processing." : `Claims open once at least ${summary.minimum_claim_usdc} USDC is available.`;
  return (
    <section className="space-y-5" aria-labelledby="operator-rewards">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><Eyebrow>Operator dashboard</Eyebrow><h2 id="operator-rewards" className="mt-1 text-2xl font-bold">Your Genesis rewards</h2></div><ActionButton onClick={onRefresh}><RefreshCw size={13} /> Refresh</ActionButton></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Contribution XP" value={summary.contribution_xp.toLocaleString()} sub="Your public leaderboard score" />
        <StatCard label="Retained XP" value={summary.retained_xp.toLocaleString()} sub="XP held after finalized conversions" />
        <StatCard label="Reserved XP" value={summary.reserved_xp.toLocaleString()} sub="Not deducted unless payment succeeds" />
        <StatCard label="Claimable USDC" value={`${summary.claimable_usdc}`} />
        <StatCard label="USDC claimed" value={`${summary.claimed_usdc}`} />
      </div>
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Choose cash now or preserve XP</p><p className="mt-1 text-sm text-[var(--text-2)]">Claiming eligible USDC deducts only the Gateway-previewed XP after successful payment.</p>{!canCreateClaim(summary) && <p className="mt-2 text-xs text-amber-200">{disabledReason}</p>}</div><AccentButton disabled={!canCreateClaim(summary)} onClick={() => setClaimOpen(true)}>Claim USDC</AccentButton></Card>
      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Active nodes" value={summary.active_nodes} /><StatCard label="Standby nodes" value={summary.standby_nodes} /><StatCard label="Probation nodes" value={summary.probation_nodes} /></div>
      <div className="grid gap-4 md:grid-cols-2">{summary.nodes.map((node) => <Card key={node.id} className="p-5"><div className="flex justify-between gap-3"><div><MonoLabel>{node.kind} node</MonoLabel><h3 className="mt-1 font-semibold">{node.name}</h3></div><StateBadge value={node.slot_status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--text-3)]">Node quality</dt><dd>{node.quality_band ?? "—"}</dd></div><div><dt className="text-[var(--text-3)]">Uptime</dt><dd>{node.uptime_percent ? `${node.uptime_percent}%` : "—"}</dd></div><div><dt className="text-[var(--text-3)]">Region/model demand</dt><dd>{node.demand_label ?? "—"}</dd></div><div><dt className="text-[var(--text-3)]">Contribution XP</dt><dd>{node.contribution_xp.toLocaleString()}</dd></div></dl>{node.suggestions?.map((suggestion) => <p key={suggestion} className="mt-3 flex gap-2 text-xs text-[var(--accent-hi)]"><Sparkles size={13} /> {suggestion}</p>)}</Card>)}</div>
      {summary.nodes.length === 0 && <Card className="p-6 text-sm text-[var(--text-2)]">No operator nodes yet. Reserve an open capacity slot to get started.</Card>}
      <WithdrawalHistory rows={withdrawals} />
      <ClaimDialog open={claimOpen} onOpenChange={setClaimOpen} summary={summary} onCreated={onRefresh} />
    </section>
  );
}

export function GenesisRewardsPage() {
  const { isAuthenticated } = useWalletAuth();
  const [season, setSeason] = useState<GenesisSeason | null>(null);
  const [leaderboard, setLeaderboard] = useState<GenesisLeaderboardEntry[]>([]);
  const [capacity, setCapacity] = useState<RewardCapacitySlot[]>([]);
  const [summary, setSummary] = useState<OperatorRewardSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<RewardWithdrawal[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPublic = useCallback(async (kind: (typeof FILTERS)[number] = "overall") => {
    setError(null);
    try {
      const [nextSeason, board, slots] = await Promise.all([fetchCurrentGenesisSeason(), fetchGenesisLeaderboard({ kind, limit: 50 }), fetchRewardCapacity()]);
      setSeason(nextSeason); setLeaderboard(board.entries); setCapacity(slots.slots);
    } catch (err) { setError(err instanceof GatewayApiError ? err.message : "Genesis data is temporarily unavailable."); }
    finally { setLoading(false); }
  }, []);

  const loadOperator = useCallback(async () => {
    if (!isAuthenticated) { setSummary(null); setWithdrawals([]); return; }
    try { const [nextSummary, history] = await Promise.all([fetchOperatorRewardSummary(), fetchRewardWithdrawals()]); setSummary(nextSummary); setWithdrawals(history.withdrawals); }
    catch (err) { toast.error(err instanceof GatewayApiError ? err.message : "Could not load operator rewards"); }
  }, [isAuthenticated]);

  useEffect(() => { loadPublic(); }, [loadPublic]);
  useEffect(() => { loadOperator(); }, [loadOperator]);
  const slotsByKind = useMemo(() => ({ vpn: capacity.filter((slot) => slot.kind === "vpn"), ai: capacity.filter((slot) => slot.kind === "ai") }), [capacity]);

  const reserve = async (slot: RewardCapacitySlot) => { try { await reserveRewardCapacity(slot.id); toast.success("Capacity reserved. Complete verification before the reservation expires."); await loadPublic(); } catch (err) { toast.error(err instanceof GatewayApiError ? err.message : "Could not reserve this slot"); } };

  return <><PublicHeader /><main className="mx-auto w-full max-w-7xl space-y-16 px-4 pb-20 pt-8 md:px-8">
    <section className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/20 bg-[radial-gradient(circle_at_90%_10%,rgba(255,107,53,.18),transparent_35%),linear-gradient(180deg,#131318,#0d0d11)] p-7 md:p-12">
      <Eyebrow>Erebrus Genesis Season</Eyebrow><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Run what the network needs. Earn for what you contribute.</h1>
      <p className="mt-5 max-w-2xl text-[var(--text-2)]">A demand-gated six-week Season rewarding useful VPN and AI capacity. Cash subsidies depend on network demand and verified contribution—never passive mining or guaranteed reimbursement.</p>
      <div className="mt-7 flex flex-wrap gap-3">{season ? <><StateBadge value={season.status} /><StateBadge value={`${season.duration_weeks ?? 6} weeks`} /><StateBadge value={`${season.total_budget_usdc} USDC pool`} />{season.xp_multiplier && <StateBadge value={`${season.xp_multiplier}x Genesis XP`} />}</> : !loading && <StateBadge value="No active Season" />}</div>
    </section>
    {loading && <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[var(--accent)]" /></div>}
    {error && <Card className="p-6 text-center"><p className="text-[var(--danger)]">{error}</p><ActionButton className="mt-4" onClick={() => loadPublic()}>Try again</ActionButton></Card>}
    {!loading && !error && !season && <Card className="p-8 text-center"><h2 className="text-xl font-semibold">No active Genesis Season</h2><p className="mt-2 text-sm text-[var(--text-2)]">Check back when Gateway announces the next Season window.</p></Card>}
    {season && <section className="space-y-5"><div><Eyebrow>Gateway budget state</Eyebrow><h2 className="mt-1 text-2xl font-bold">Season pool</h2></div><BudgetPanel season={season} /></section>}
    <section className="space-y-5"><div><Eyebrow>How it works</Eyebrow><h2 className="mt-1 text-2xl font-bold">Useful work earns upside</h2></div><div className="grid gap-4 md:grid-cols-4">{[["01","Find demand","See the VPN regions and AI capacity Erebrus currently needs."],["02","Run & verify","Reserve a slot and pass node or model verification."],["03","Earn XP","Useful uptime, users, traffic and AI capacity grow Contribution XP."],["04","Choose your upside","Claim eligible USDC now and give up corresponding XP, or preserve more XP."]].map(([n,t,d]) => <Card key={n} className="p-5"><MonoLabel>{n}</MonoLabel><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm text-[var(--text-2)]">{d}</p></Card>)}</div><p className="text-xs text-[var(--text-3)]">XP is wallet-bound and non-transferable. It may qualify operators for future pro-rata network rewards, but has no guaranteed token value or fixed conversion. No staking is required for Season 1.</p></section>
    <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><Eyebrow>Public ranking</Eyebrow><h2 className="mt-1 text-2xl font-bold">Contribution leaderboard</h2></div><div className="flex gap-1">{FILTERS.map((item) => <button key={item} onClick={() => { setFilter(item); loadPublic(item); }} className={cn("rounded-lg border px-3 py-1.5 text-xs capitalize", filter === item ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-hi)]" : "border-white/10 text-[var(--text-2)]")}>{item}</button>)}</div></div><Card className="overflow-hidden">{leaderboard.length === 0 ? <p className="p-8 text-sm text-[var(--text-2)]">No leaderboard entries yet.</p> : leaderboard.map((entry) => <div key={`${entry.rank}-${entry.display_name}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/[0.04] px-5 py-4"><span className="font-mono text-[var(--text-3)]">#{entry.rank}</span><div><p className="font-medium">{entry.display_name}</p><p className="text-xs text-[var(--text-3)]">{entry.active_eligible_nodes} eligible nodes · {entry.contribution_types.map((kind) => kind.toUpperCase()).join(" / ") || "—"}</p></div><strong className="font-mono text-[var(--accent-hi)]">{entry.contribution_xp.toLocaleString()} XP</strong></div>)}</Card></section>
    <section className="space-y-5"><div><Eyebrow>Demand marketplace</Eyebrow><h2 className="mt-1 text-2xl font-bold">Open capacity</h2><p className="mt-2 text-sm text-[var(--text-2)]">Slots are reserved first-come and retained through performance. Standby nodes may still earn XP.</p></div>{capacity.length === 0 ? <Card className="p-8 text-sm text-[var(--text-2)]">No capacity requests are open right now.</Card> : <><div className="flex items-center gap-2"><Server size={16} /><h3 className="font-semibold">VPN</h3></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{slotsByKind.vpn.map((slot) => <CapacityCard key={slot.id} slot={slot} authenticated={isAuthenticated} onReserve={reserve} />)}</div><div className="flex items-center gap-2"><Sparkles size={16} /><h3 className="font-semibold">AI</h3></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{slotsByKind.ai.map((slot) => <CapacityCard key={slot.id} slot={slot} authenticated={isAuthenticated} onReserve={reserve} />)}</div></>}</section>
    {isAuthenticated && summary ? <OperatorDashboard summary={summary} withdrawals={withdrawals} onRefresh={loadOperator} /> : <Card className="p-7 text-center"><Check className="mx-auto text-[var(--accent-hi)]" /><h2 className="mt-3 text-xl font-semibold">Operator rewards</h2><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-2)]">Sign in to see Contribution, Retained and Reserved XP, claimable USDC, rewarded nodes and withdrawal history.</p><AuthModalTrigger><AccentButton className="mt-5">Sign in to view rewards</AccentButton></AuthModalTrigger></Card>}
  </main></>;
}
