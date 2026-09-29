"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/context/workspace";
import { formatStorageBytes } from "@/lib/gateway-errors";
import { orgPlanLabel } from "@/lib/org-plans";
import { planEndingNotice, usagePercent } from "@/lib/plan-usage";
import { formatDateTime } from "@/lib/format";
import { AccentButton, ActionButton, Card, MonoLabel } from "@/components/v3/ui";
import { cn } from "@/lib/utils";

function Meter({ label, used, limit, text }: { label: string; used: number; limit: number; text: string }) {
  const pct = usagePercent(used, limit);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-2)]">{label}</span>
        <span className="font-mono text-[var(--text)]">{text}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full", pct >= 100 ? "bg-[var(--warn)]" : "bg-[var(--accent)]")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Plan & usage summary from the gateway. Values are display-only; the gateway
 * enforces every limit. `compact` renders the sidebar variant.
 */
export function PlanUsageCard({ compact = false }: { compact?: boolean }) {
  const { usage, entitlement, loading, error, refresh } = useWorkspace();
  const org = usage?.entitlement_org;
  const plan = org?.plan ?? entitlement.org?.plan ?? "personal.basic";
  const isFree = plan === "personal.basic";

  if (error && !usage) {
    return (
      <Card className={cn("p-4 text-sm", compact && "mt-auto p-3.5")}>
        <p role="alert" className="text-[var(--text-2)]">
          {error} Your limits still apply.
        </p>
        <ActionButton variant="neutral" className="mt-3" onClick={() => void refresh()}>
          <RefreshCw size={13} /> Retry
        </ActionButton>
      </Card>
    );
  }

  const notice = planEndingNotice(usage);
  const manageHref = org?.id ? `/workspace/${org.id}?tab=billing` : "/workspace";
  return (
    <Card className={cn("space-y-3 p-5", compact && "mt-auto space-y-2.5 p-3.5")}>
      <div className="flex items-center justify-between gap-2">
        <MonoLabel>Plan</MonoLabel>
        <span className="truncate font-mono text-[11px] text-[var(--accent-hi)]">{orgPlanLabel(plan)}</span>
      </div>
      {(org?.name ?? entitlement.org?.name) && (
        <p className="truncate text-[11px] text-[var(--text-3)]">from {org?.name ?? entitlement.org?.name}</p>
      )}
      {loading && !usage ? (
        <p className="text-xs text-[var(--text-3)]">Loading usage…</p>
      ) : usage ? (
        <div className="space-y-2.5">
          <Meter
            label="VPN devices"
            used={usage.vpn.public_clients}
            limit={usage.vpn.client_limit}
            text={`${usage.vpn.public_clients} / ${usage.vpn.client_limit}`}
          />
          <Meter
            label="Drop storage"
            used={usage.drop.used_bytes + usage.drop.reserved_bytes}
            limit={usage.drop.quota_bytes}
            text={`${formatStorageBytes(usage.drop.used_bytes)} / ${formatStorageBytes(usage.drop.quota_bytes)}`}
          />
          {!compact && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-lg border border-white/[0.06] p-2">
                <div className="text-[var(--text-3)]">API keys</div>
                <div className="mt-0.5">{usage.api_keys_available ? "Available" : isFree ? "Starter and up" : "Owner only"}</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] p-2">
                <div className="text-[var(--text-3)]">Seats</div>
                <div className="mt-0.5">
                  {org?.seats_included != null ? `${org.seats_used ?? 0} / ${org.seats_included}` : "—"}
                </div>
              </div>
            </div>
          )}
          {usage.vpn.paused_clients > 0 && (
            <p className="flex items-start gap-1.5 text-[11px] text-[var(--warn)]">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {usage.vpn.paused_clients} device{usage.vpn.paused_clients === 1 ? "" : "s"} paused — over plan limit
            </p>
          )}
          {!compact && org?.cancel_at_period_end && org.paid_access_until && !notice && (
            <p className="text-[11px] text-[var(--text-3)]">
              Cancels on {formatDateTime(org.paid_access_until, undefined, { hour: undefined, minute: undefined })}, then Basic.
            </p>
          )}
        </div>
      ) : null}
      <Link href={isFree ? "/pricing" : manageHref}>
        <AccentButton className={cn("w-full", compact && "!py-2 !text-[13px]")}>
          {isFree ? "Upgrade plan" : "Manage plan"}
        </AccentButton>
      </Link>
    </Card>
  );
}

/** Banner shown before paid access ends when devices will be paused. */
export function PlanEndingBanner() {
  const { usage } = useWorkspace();
  const notice = planEndingNotice(usage);
  if (!notice) return null;
  const date = formatDateTime(notice.until, undefined, { hour: undefined, minute: undefined });
  const orgId = usage?.entitlement_org?.id;
  const renewHref = orgId ? `/workspace/${orgId}?tab=billing` : "/workspace";
  return (
    <Card role="status" className="flex flex-col gap-3 border-[var(--warn)]/30 bg-[var(--warn)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warn)]" />
        <span>
          Your {notice.planName} plan ends on {date}. {notice.pauseCount} device{notice.pauseCount === 1 ? "" : "s"} will be
          paused (newest first) because Basic allows {notice.limitAfter}. Remove devices you don&apos;t need, or renew.
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Link href="/connect">
          <ActionButton variant="neutral">Manage devices</ActionButton>
        </Link>
        <Link href={renewHref}>
          <ActionButton>Renew</ActionButton>
        </Link>
      </div>
    </Card>
  );
}
