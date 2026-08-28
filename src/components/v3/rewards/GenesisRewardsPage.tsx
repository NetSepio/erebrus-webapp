"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Copy, ExternalLink, Loader2, RefreshCw, Server, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, ActionButton, Card, Eyebrow, MonoLabel, StatCard } from "@/components/v3/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWalletAuth } from "@/context/appkit";
import {
  createRewardWithdrawal,
  fetchCurrentGenesisSeason,
  fetchGenesisLeaderboard,
  fetchOperatorNodes,
  fetchOperatorRewardSummary,
  fetchRewardAccess,
  fetchRewardCapacity,
  fetchRewardWithdrawals,
  fetchXpLedger,
  GatewayApiError,
  previewRewardClaim,
  reserveRewardCapacity,
  submitRewardApplication,
} from "@/lib/gateway/client";
import type {
  ClaimPreview,
  GenesisLeaderboardEntry,
  GenesisSeason,
  GenesisSeasonPreview,
  GatewayOperatorNode,
  OperatorRewardSummary,
  RewardCapacitySlot,
  RewardAccess,
  RewardApplicationInput,
  RewardWithdrawal,
  XpLedgerEntry,
} from "@/lib/gateway/types";
import { ACTIVE_WITHDRAWAL_STATUSES, canCreateClaim, capacityModeDescription, createIdempotencyKey, withdrawalStatusLabel, withdrawalXpLabel } from "@/lib/rewards";
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
      {slot.kind === "ai" && <p className="mt-2 text-xs text-[var(--text-3)]">{capacityModeDescription(slot.mode)}</p>}
      {slot.kind === "vpn" && <p className="mt-2 text-xs text-[var(--text-3)]">2 vCPU · 2–4 GB RAM · unique static public IPv4 · public permissionless VPN · no firewall configuration</p>}
      {slot.reservation_expires_at && <p className="mt-3 font-mono text-[11px] text-amber-200">Reserved until {new Date(slot.reservation_expires_at).toLocaleString()}</p>}
      {slot.reservable && slot.status.toLowerCase() === "open" && (
        <div className="mt-auto pt-5">
          {authenticated ? <ActionButton onClick={() => onReserve(slot)}>Reserve capacity</ActionButton> : <AuthModalTrigger><ActionButton>Sign in to reserve capacity</ActionButton></AuthModalTrigger>}
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
            <p className="font-medium">{row.amount_usdc} USDC · {row.xp_amount.toLocaleString()} XP {withdrawalXpLabel(row)}</p>
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
      await createRewardWithdrawal(preview.amount_usdc, key, preview.payout_wallet);
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

function OperatorDashboard({ summary, withdrawals, ledger, onRefresh }: { summary: OperatorRewardSummary; withdrawals: RewardWithdrawal[]; ledger: XpLedgerEntry[]; onRefresh: () => Promise<void> }) {
  const [claimOpen, setClaimOpen] = useState(false);
  const disabledReason = !summary.verified_solana_wallet ? "Link and verify a Solana payout wallet in your profile before claiming." : summary.payouts_paused ? "Payouts are temporarily paused." : summary.conflicting_withdrawal ? "A withdrawal is already pending or processing." : `Claims open once at least ${summary.minimum_claim_usdc} USDC is available.`;
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
      <Card className="overflow-hidden"><div className="border-b border-white/[0.06] px-5 py-4 font-semibold">XP ledger</div>{ledger.length === 0 ? <p className="px-5 py-8 text-sm text-[var(--text-2)]">No Genesis XP activity yet.</p> : ledger.map((entry) => <div key={entry.id} className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{entry.label}</p><p className="mt-1 text-xs text-[var(--text-3)]">{new Date(entry.created_at).toLocaleString()} · {entry.kind}</p></div><div className="text-right font-mono text-xs"><p>Contribution {entry.contribution_xp_delta >= 0 ? "+" : ""}{entry.contribution_xp_delta} XP</p><p className="mt-1 text-[var(--text-3)]">Retained {entry.retained_xp_delta >= 0 ? "+" : ""}{entry.retained_xp_delta} XP</p></div></div>)}</Card>
      <WithdrawalHistory rows={withdrawals} />
      <ClaimDialog open={claimOpen} onOpenChange={setClaimOpen} summary={summary} onCreated={onRefresh} />
    </section>
  );
}

function OperatorApplicationForm({ nodes, onSubmitted }: { nodes: GatewayOperatorNode[]; onSubmitted: () => Promise<void> }) {
  const [services, setServices] = useState<Array<"vpn" | "ai">>([]);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [infrastructure, setInfrastructure] = useState("");
  const [experience, setExperience] = useState("");
  const [hours, setHours] = useState("168");
  const [vpnConsent, setVpnConsent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toggleService = (service: "vpn" | "ai") => setServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service]);
  const toggleNode = (id: string) => setNodeIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const valid = services.length > 0 && nodeIds.length > 0 && Boolean(country.trim()) && infrastructure.trim().length >= 20 && experience.trim().length >= 20 && Number(hours) >= 1 && Number(hours) <= 168 && terms && (!services.includes("vpn") || vpnConsent);
  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const body: RewardApplicationInput = { service_types: services, node_ids: nodeIds, country: country.trim(), city: city.trim() || undefined, infrastructure: infrastructure.trim(), experience: experience.trim(), availability_hours: Number(hours), public_vpn_consent: vpnConsent, terms_accepted: terms };
      await submitRewardApplication(body);
      toast.success("Application submitted for review");
      await onSubmitted();
    } catch (error) {
      toast.error(error instanceof GatewayApiError ? error.message : "Could not submit the application");
    } finally { setSubmitting(false); }
  };
  if (nodes.length === 0) return <Card className="p-7 text-center"><Server className="mx-auto text-[var(--accent-hi)]" /><h2 className="mt-3 text-xl font-semibold">Add a node before applying</h2><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-2)]">Applications must reference at least one node attached to an organization you operate. Register and bring a node online, then return here.</p><Link href="/dashboard" className="mt-5 inline-flex text-sm text-[var(--accent-hi)]">Open node operator dashboard →</Link></Card>;
  return <Card className="p-6 md:p-8">
    <div className="max-w-3xl"><Eyebrow>Operator application</Eyebrow><h2 className="mt-2 text-2xl font-bold">Apply for Season participation</h2><p className="mt-2 text-sm text-[var(--text-2)]">Approval grants access to capacity requests and the Season dashboard. It does not credit 500 USDC to your account or guarantee a payout. Only verified, finalized contribution can become claimable.</p></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-2">
      <div><label className="text-sm font-medium">Services you can operate</label><div className="mt-2 flex gap-3">{(["vpn","ai"] as const).map((service) => <label key={service} className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 p-4"><Checkbox checked={services.includes(service)} onCheckedChange={() => toggleService(service)} /><span className="uppercase">{service}</span></label>)}</div></div>
      <div><label htmlFor="availability" className="text-sm font-medium">Expected weekly availability (hours)</label><Input id="availability" type="number" min={1} max={168} value={hours} onChange={(event) => setHours(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" /></div>
      <div className="lg:col-span-2"><label className="text-sm font-medium">Nodes included in this application</label><div className="mt-2 grid gap-2 sm:grid-cols-2">{nodes.map((node) => <label key={node.id} className="flex items-start gap-3 rounded-xl border border-white/10 p-3"><Checkbox className="mt-0.5" checked={nodeIds.includes(node.id)} onCheckedChange={() => toggleNode(node.id)} /><span><span className="block text-sm font-medium">{node.name || node.id}</span><span className="font-mono text-[10px] text-[var(--text-3)]">{node.region || "Unknown region"} · {node.status}</span></span></label>)}</div></div>
      <div><label htmlFor="country" className="text-sm font-medium">Operating country</label><Input id="country" value={country} onChange={(event) => setCountry(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" placeholder="Country" /></div>
      <div><label htmlFor="city" className="text-sm font-medium">City or region (optional)</label><Input id="city" value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" placeholder="City / region" /></div>
      <div><label htmlFor="infrastructure" className="text-sm font-medium">Infrastructure and connectivity</label><Textarea id="infrastructure" value={infrastructure} onChange={(event) => setInfrastructure(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" placeholder="CPU/GPU, memory, bandwidth, static IP, hosting provider…" /></div>
      <div><label htmlFor="experience" className="text-sm font-medium">Operating experience and reliability plan</label><Textarea id="experience" value={experience} onChange={(event) => setExperience(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" placeholder="Relevant operations experience, monitoring and incident response…" /></div>
    </div>
    <div className="mt-6 space-y-3">
      {services.includes("vpn") && <label className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm"><Checkbox className="mt-0.5" checked={vpnConsent} onCheckedChange={(value) => setVpnConsent(value === true)} /><span>I can operate a public permissionless VPN node with a unique static public IPv4 and understand that firewall-enabled public nodes are ineligible.</span></label>}
      <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4 text-sm"><Checkbox className="mt-0.5" checked={terms} onCheckedChange={(value) => setTerms(value === true)} /><span>I confirm these details are accurate, consent to eligibility and anti-abuse verification, and understand approval and displayed pool capacity do not guarantee personal earnings.</span></label>
    </div>
    <AccentButton className="mt-6" disabled={!valid || submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit application"}</AccentButton>
  </Card>;
}

function ApplicationState({ access, nodes, onRefresh }: { access: RewardAccess; nodes: GatewayOperatorNode[]; onRefresh: () => Promise<void> }) {
  const application = access.application;
  if (!application) return access.applications_open ? <OperatorApplicationForm nodes={nodes} onSubmitted={onRefresh} /> : <Card className="p-7 text-center"><Clock3 className="mx-auto text-amber-200" /><h2 className="mt-3 text-xl font-semibold">Applications are closed</h2><p className="mt-2 text-sm text-[var(--text-2)]">This Season is not currently accepting new operators.</p></Card>;
  if (application.status === "pending") return <Card className="p-7"><div className="flex items-start gap-4"><Clock3 className="mt-1 text-amber-200" /><div><StateBadge value="pending review" /><h2 className="mt-3 text-xl font-semibold">Your operator application is under review</h2><p className="mt-2 text-sm text-[var(--text-2)]">Submitted {new Date(application.submitted_at).toLocaleString()}. Capacity reservation, balances and claims stay locked until an administrator approves the application.</p><p className="mt-3 text-xs text-[var(--text-3)]">Services: {application.service_types.map((item) => item.toUpperCase()).join(" / ")} · {application.node_ids.length} node{application.node_ids.length === 1 ? "" : "s"}</p></div></div></Card>;
  if (application.status === "rejected") return <div className="space-y-5"><Card className="border-[var(--danger)]/30 p-7"><StateBadge value="not accepted" /><h2 className="mt-3 text-xl font-semibold">This application was not accepted</h2><p className="mt-2 text-sm text-[var(--text-2)]">{application.review_note || "The review team could not verify eligibility from the submitted details."}</p>{access.applications_open && <p className="mt-3 text-xs text-[var(--text-3)]">You may correct the details and submit a new application below.</p>}</Card>{access.applications_open && <OperatorApplicationForm nodes={nodes} onSubmitted={onRefresh} />}</div>;
  if (application.status === "approved" && !access.season_started) return <Card className="p-7"><ShieldCheck className="text-emerald-300" /><StateBadge value="accepted" /><h2 className="mt-3 text-xl font-semibold">You are accepted for this Season</h2><p className="mt-2 text-sm text-[var(--text-2)]">The Season dashboard and capacity requests unlock when the Season starts{access.season?.starts_at ? ` on ${new Date(access.season.starts_at).toLocaleString()}` : ""}. Approval itself does not create a cash balance.</p></Card>;
  return null;
}

export function GenesisRewardsPage() {
  const { isAuthenticated } = useWalletAuth();
  const [preview, setPreview] = useState<GenesisSeasonPreview | null>(null);
  const [access, setAccess] = useState<RewardAccess | null>(null);
  const [operatorNodes, setOperatorNodes] = useState<GatewayOperatorNode[]>([]);
  const [leaderboard, setLeaderboard] = useState<GenesisLeaderboardEntry[]>([]);
  const [capacity, setCapacity] = useState<RewardCapacitySlot[]>([]);
  const [summary, setSummary] = useState<OperatorRewardSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<RewardWithdrawal[]>([]);
  const [ledger, setLedger] = useState<XpLedgerEntry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("overall");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPublic = useCallback(async () => {
    setError(null);
    try {
      setPreview(await fetchCurrentGenesisSeason());
    } catch (err) { setError(err instanceof GatewayApiError ? err.message : "Genesis data is temporarily unavailable."); }
    finally { setLoading(false); }
  }, []);

  const loadAccess = useCallback(async (kind: (typeof FILTERS)[number] = "overall") => {
    if (!isAuthenticated) { setAccess(null); setOperatorNodes([]); setSummary(null); setCapacity([]); setLeaderboard([]); return; }
    try {
      const nextAccess = await fetchRewardAccess();
      setAccess(nextAccess);
      if (!nextAccess.can_view_rewards) {
        const nodes = nextAccess.applications_open ? await fetchOperatorNodes().catch(() => []) : [];
        setOperatorNodes(nodes); setSummary(null); setCapacity([]); setLeaderboard([]); setWithdrawals([]); setLedger([]);
        return;
      }
      const [board, slots, nextSummary, history, xp] = await Promise.all([fetchGenesisLeaderboard({ kind, limit: 50 }), fetchRewardCapacity(), fetchOperatorRewardSummary(), fetchRewardWithdrawals(), fetchXpLedger()]);
      const approvedServices = new Set(nextAccess.application?.service_types ?? []);
      setLeaderboard(board.entries); setCapacity(slots.slots.filter((slot) => approvedServices.has(slot.kind))); setSummary(nextSummary); setWithdrawals(history.withdrawals); setLedger(xp.entries);
    } catch (err) { toast.error(err instanceof GatewayApiError ? err.message : "Could not load operator rewards"); }
  }, [isAuthenticated]);

  useEffect(() => { loadPublic(); }, [loadPublic]);
  useEffect(() => { loadAccess(); }, [loadAccess]);
  const slotsByKind = useMemo(() => ({ vpn: capacity.filter((slot) => slot.kind === "vpn"), ai: capacity.filter((slot) => slot.kind === "ai") }), [capacity]);
  const season = access?.can_view_rewards && access.season && "buckets" in access.season ? access.season as GenesisSeason : null;

  const reserve = async (slot: RewardCapacitySlot) => { try { await reserveRewardCapacity(slot.id); toast.success("Capacity request reserved for 48 hours. This is not a cash reservation; complete node verification before it expires."); await loadAccess(filter); } catch (err) { toast.error(err instanceof GatewayApiError ? err.message : "Could not reserve this slot"); } };

  return <><PublicHeader /><main className="mx-auto w-full max-w-7xl space-y-16 px-4 pb-20 pt-8 md:px-8">
    <section className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/20 bg-[radial-gradient(circle_at_90%_10%,rgba(255,107,53,.18),transparent_35%),linear-gradient(180deg,#131318,#0d0d11)] p-7 md:p-12">
      <Eyebrow>Erebrus Genesis Season</Eyebrow><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Run what the network needs. Earn for what you contribute.</h1>
      <p className="mt-5 max-w-2xl text-[var(--text-2)]">A demand-gated six-week Season rewarding useful VPN and AI capacity. Cash subsidies depend on network demand and verified contribution—never passive mining or guaranteed reimbursement.</p>
      <div className="mt-7 flex flex-wrap gap-3">{preview ? <><StateBadge value={preview.status} /><StateBadge value={`${preview.duration_weeks ?? 6} weeks`} />{preview.xp_multiplier && <StateBadge value={`${preview.xp_multiplier}x Genesis XP`} />}</> : !loading && <StateBadge value="No scheduled Season" />}</div>
    </section>
    {loading && <div className="flex justify-center py-14"><Loader2 className="animate-spin text-[var(--accent)]" /></div>}
    {error && <Card className="p-6 text-center"><p className="text-[var(--danger)]">{error}</p><ActionButton className="mt-4" onClick={() => loadPublic()}>Try again</ActionButton></Card>}
    {!loading && !error && !preview && <Card className="p-8 text-center"><h2 className="text-xl font-semibold">No Genesis Season is scheduled</h2><p className="mt-2 text-sm text-[var(--text-2)]">Check back when Gateway announces the next application window.</p></Card>}
    <section className="space-y-5"><div><Eyebrow>How participation works</Eyebrow><h2 className="mt-1 text-2xl font-bold">Apply, qualify, contribute, then claim</h2></div><div className="grid gap-4 md:grid-cols-4">{[["01","Apply","Submit your nodes, infrastructure and operating plan."],["02","Get accepted","The review team verifies ownership, capacity and eligibility."],["03","Run verified work","Approved operators reserve capacity and build finalized Contribution XP."],["04","Claim if eligible","Only your finalized claimable balance can be withdrawn—never the global pool."]].map(([n,t,d]) => <Card key={n} className="p-5"><MonoLabel>{n}</MonoLabel><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm text-[var(--text-2)]">{d}</p></Card>)}</div><p className="text-xs text-[var(--text-3)]">The Season treasury is a shared network budget, not 500 USDC deposited into each account. Approval enables participation but does not guarantee earnings. XP is wallet-bound, non-transferable and has no guaranteed token value.</p></section>
    {!isAuthenticated && preview && <Card className="p-8 text-center"><ShieldCheck className="mx-auto text-[var(--accent-hi)]" /><h2 className="mt-3 text-xl font-semibold">Operator access is application-based</h2><p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-2)]">Sign in to apply or check your review status. Season budgets, capacity reservation, balances and claims are shown only to accepted operators after the Season starts.</p><AuthModalTrigger><AccentButton className="mt-5">Sign in to apply</AccentButton></AuthModalTrigger></Card>}
    {isAuthenticated && access && !access.can_view_rewards && <ApplicationState access={access} nodes={operatorNodes} onRefresh={() => loadAccess(filter)} />}
    {season && <><section className="space-y-5"><div><Eyebrow>Shared network treasury</Eyebrow><h2 className="mt-1 text-2xl font-bold">Season pool—not your account balance</h2><p className="mt-2 text-sm text-[var(--text-2)]">These values describe the total program budget across every accepted operator. Your withdrawable amount appears only as “Claimable USDC” in your dashboard below.</p></div><BudgetPanel season={season} /></section>
    <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><Eyebrow>Accepted operators</Eyebrow><h2 className="mt-1 text-2xl font-bold">Contribution leaderboard</h2></div><div className="flex gap-1">{FILTERS.map((item) => <button key={item} onClick={() => { setFilter(item); loadAccess(item); }} className={cn("rounded-lg border px-3 py-1.5 text-xs capitalize", filter === item ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-hi)]" : "border-white/10 text-[var(--text-2)]")}>{item}</button>)}</div></div><Card className="overflow-hidden">{leaderboard.length === 0 ? <p className="p-8 text-sm text-[var(--text-2)]">No finalized contribution yet.</p> : leaderboard.map((entry) => <div key={`${entry.rank}-${entry.display_name}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/[0.04] px-5 py-4"><span className="font-mono text-[var(--text-3)]">#{entry.rank}</span><div><p className="font-medium">{entry.display_name}</p><p className="text-xs text-[var(--text-3)]">{entry.contribution_types.map((kind) => kind.toUpperCase()).join(" / ") || "Verified contribution"}</p></div><strong className="font-mono text-[var(--accent-hi)]">{entry.contribution_xp.toLocaleString()} XP</strong></div>)}</Card></section>
    <section className="space-y-5"><div><Eyebrow>Capacity requests</Eyebrow><h2 className="mt-1 text-2xl font-bold">Reserve infrastructure capacity</h2><p className="mt-2 text-sm text-[var(--text-2)]">“Reserve” holds an infrastructure slot for verification for 48 hours. It does not reserve or credit USDC.</p></div>{capacity.length === 0 ? <Card className="p-8 text-sm text-[var(--text-2)]">No capacity requests are open right now.</Card> : <><div className="flex items-center gap-2"><Server size={16} /><h3 className="font-semibold">VPN</h3></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{slotsByKind.vpn.map((slot) => <CapacityCard key={slot.id} slot={slot} authenticated onReserve={reserve} />)}</div><div className="flex items-center gap-2"><Sparkles size={16} /><h3 className="font-semibold">AI</h3></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{slotsByKind.ai.map((slot) => <CapacityCard key={slot.id} slot={slot} authenticated onReserve={reserve} />)}</div></>}</section>
    {summary && <OperatorDashboard summary={summary} withdrawals={withdrawals} ledger={ledger} onRefresh={() => loadAccess(filter)} />}</>}
  </main></>;
}
