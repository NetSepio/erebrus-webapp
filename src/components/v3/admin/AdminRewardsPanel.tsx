"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AccentButton, ActionButton, Card, MonoLabel, StatCard } from "@/components/v3/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  approveRewardWithdrawal,
  fetchAdminRewardsSummary,
  fetchAdminRewardWithdrawals,
  GatewayApiError,
  rejectRewardWithdrawal,
  retryRewardWithdrawal,
} from "@/lib/gateway/client";
import type { AdminRewardsSummary, RewardWithdrawal } from "@/lib/gateway/types";
import { withdrawalStatusLabel } from "@/lib/rewards";

const FILTERS = ["pending", "approved,processing", "paid", "rejected", "failed"] as const;

function short(value?: string): string {
  if (!value) return "—";
  return value.length < 14 ? value : `${value.slice(0, 6)}…${value.slice(-5)}`;
}

export function AdminRewardsPanel() {
  const [summary, setSummary] = useState<AdminRewardsSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<RewardWithdrawal[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RewardWithdrawal | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (status: string = "pending") => {
    setLoading(true);
    try {
      const [nextSummary, queue] = await Promise.all([
        fetchAdminRewardsSummary(),
        fetchAdminRewardWithdrawals({ status }),
      ]);
      setSummary(nextSummary);
      setWithdrawals(queue.withdrawals);
    } catch (error) {
      toast.error(error instanceof GatewayApiError ? error.message : "Failed to load reward administration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async () => {
    if (!selected || !action || (action === "reject" && !reason.trim())) return;
    setSubmitting(true);
    try {
      const updated = action === "approve"
        ? await approveRewardWithdrawal(selected.id)
        : await rejectRewardWithdrawal(selected.id, reason.trim());
      toast.success(action === "approve"
        ? `Payout ${withdrawalStatusLabel(updated.status)}; awaiting Gateway confirmation.`
        : "Withdrawal rejected and XP reservation released.");
      setSelected(null); setAction(null); setReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof GatewayApiError ? error.message : `Could not ${action} withdrawal`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;

  return <div className="space-y-5">
    {summary && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Season" value={summary.season.status} sub={`${summary.season.total_budget_usdc} USDC total budget`} />
        <StatCard label="Spent" value={`${summary.season.spent_usdc} USDC`} />
        <StatCard label="Reserved" value={`${summary.season.reserved_usdc} USDC`} sub="Pending and processing claims" />
        <StatCard label="Remaining" value={`${summary.season.remaining_usdc} USDC`} valueColor="var(--success)" />
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><MonoLabel>Treasury public address</MonoLabel><button onClick={() => summary.treasury_address && navigator.clipboard.writeText(summary.treasury_address)} className="mt-2 flex items-center gap-2 font-mono text-sm text-[var(--accent-hi)]">{short(summary.treasury_address)} <Copy size={13} /></button></div>
          <div><MonoLabel>USDC balance</MonoLabel><p className="mt-2 font-mono">{summary.treasury_usdc_balance}</p></div>
          <div><MonoLabel>SOL fee balance</MonoLabel><p className="mt-2 font-mono">{summary.treasury_sol_balance}</p></div>
          <div><MonoLabel>Payout state</MonoLabel><p className={`mt-2 font-mono text-sm ${summary.rewards_paused ? "text-amber-200" : "text-emerald-300"}`}>{summary.rewards_paused ? "Paused" : "Active"}</p></div>
        </div>
      </Card>
    </>}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1">{FILTERS.map((item) => <button key={item} onClick={() => { setFilter(item); load(item); }} className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${filter === item ? "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-hi)]" : "border-white/10 text-[var(--text-2)]"}`}>{item.replace(",", " / ")}</button>)}</div>
      <ActionButton onClick={() => load()}><RefreshCw size={13} /> Refresh</ActionButton>
    </div>

    <Card className="overflow-hidden">
      {withdrawals.length === 0 ? <p className="p-8 text-sm text-[var(--text-2)]">No withdrawals match this queue.</p> : withdrawals.map((row) => <div key={row.id} className="border-b border-white/[0.04] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><strong>{row.amount_usdc} USDC</strong><span className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase">{withdrawalStatusLabel(row.status)}</span></div>
            <p className="mt-1 text-sm">{row.operator_name ?? "Operator"} · {short(row.payout_wallet)} · {row.xp_amount.toLocaleString()} XP deducted only if paid</p>
            <p className="mt-1 text-xs text-[var(--text-3)]">Requested {new Date(row.created_at).toLocaleString()} · Contribution {row.contribution_xp?.toLocaleString() ?? "—"} XP · Retained {row.retained_xp?.toLocaleString() ?? "—"} XP</p>
            {row.related_nodes?.length ? <p className="mt-1 text-xs text-[var(--text-3)]">Nodes: {row.related_nodes.join(", ")}</p> : null}
            {row.flags?.length ? <p className="mt-2 text-xs text-amber-200">Gateway flags: {row.flags.join(" · ")}</p> : null}
            {row.rejection_reason && <p className="mt-2 text-xs text-[var(--danger)]">Reason: {row.rejection_reason}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {row.status === "pending" && <><ActionButton onClick={() => { setSelected(row); setAction("approve"); }}>Approve & Pay</ActionButton><ActionButton variant="danger" onClick={() => { setSelected(row); setAction("reject"); }}>Reject</ActionButton></>}
            {row.status === "failed" && row.retryable && <ActionButton onClick={async () => { try { const updated = await retryRewardWithdrawal(row.id); toast.success(`Retry ${withdrawalStatusLabel(updated.status)}`); await load(); } catch (error) { toast.error(error instanceof GatewayApiError ? error.message : "Retry failed"); } }}>Retry payout</ActionButton>}
            {row.transaction_signature && <a href={`https://solscan.io/tx/${encodeURIComponent(row.transaction_signature)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--accent-hi)]">Solscan <ExternalLink size={12} /></a>}
          </div>
        </div>
      </div>)}
    </Card>

    <Dialog open={Boolean(selected && action)} onOpenChange={(open) => { if (!open && !submitting) { setSelected(null); setAction(null); setReason(""); } }}>
      <DialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
        <DialogHeader><DialogTitle>{action === "approve" ? `Approve ${selected?.amount_usdc} USDC payout?` : "Reject withdrawal"}</DialogTitle><DialogDescription className="text-[var(--text-2)]">{action === "approve" ? "Gateway will submit the payout and reconcile Solana before marking it Paid." : "Rejection releases reserved XP and requires an operator-visible reason."}</DialogDescription></DialogHeader>
        {selected && <Card className="space-y-2 p-4 text-sm"><div className="flex justify-between"><span className="text-[var(--text-3)]">Recipient</span><span className="font-mono">{short(selected.payout_wallet)}</span></div><div className="flex justify-between"><span className="text-[var(--text-3)]">XP deducted after success</span><strong>{selected.xp_amount.toLocaleString()}</strong></div>{action === "approve" && <div className="flex justify-between"><span className="text-[var(--text-3)]">Season remaining after payment</span><strong>{selected.season_remaining_after_payment ? `${selected.season_remaining_after_payment} USDC` : "Gateway confirms"}</strong></div>}</Card>}
        {action === "reject" && <div><label htmlFor="rejection-reason" className="text-sm font-medium">Rejection reason</label><Input id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04]" placeholder="Explain why this request is ineligible" /></div>}
        <div className="flex justify-end gap-2"><ActionButton variant="neutral" disabled={submitting} onClick={() => { setSelected(null); setAction(null); }}>Cancel</ActionButton><AccentButton variant={action === "reject" ? "danger" : "primary"} disabled={submitting || (action === "reject" && !reason.trim())} onClick={runAction}>{submitting ? "Submitting…" : action === "approve" ? "Approve & Pay" : "Reject request"}</AccentButton></div>
      </DialogContent>
    </Dialog>
  </div>;
}
