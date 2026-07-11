"use client";

import { Card, MonoLabel } from "@/components/v3/ui";
import { formatBytes } from "@/lib/format";
import { tierLabel } from "@/lib/entitlements";
import type { DropUsage } from "@/lib/drop/types";

export function DropUsageCard({
  usage,
  orgName,
}: {
  usage: DropUsage | null;
  orgName?: string;
}) {
  const used = usage?.used_bytes ?? 0;
  const reserved = usage?.reserved_bytes ?? 0;
  const limit = usage?.limit_bytes ?? null;
  const pct = limit && limit > 0 ? Math.min(100, ((used + reserved) / limit) * 100) : 0;
  const full = limit != null && used + reserved >= limit;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <MonoLabel>Storage usage</MonoLabel>
        {usage && (
          <span className="font-mono text-[11px] text-[var(--accent-hi)]">
            {tierLabel(usage.tier)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[26px] font-bold tracking-tight">{formatBytes(used)}</div>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">
            of {limit != null ? formatBytes(limit) : "unlimited"} used
            {reserved > 0 ? ` · ${formatBytes(reserved)} reserved` : ""}
          </p>
        </div>
        <span
          className="font-mono text-[11px]"
          style={{ color: full ? "var(--danger)" : "var(--text-3)" }}
        >
          {full ? "Quota full" : usage?.scope === "public" ? "Public network" : "Organization"}
        </span>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage used"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: full
              ? "var(--danger)"
              : "linear-gradient(90deg, #FF7E44, #E0531F)",
          }}
        />
      </div>

      <p className="mt-3 text-[11px] text-[var(--text-3)]">
        {orgName
          ? `Entitlement via ${orgName}`
          : "Free tier from your personal organization"}
      </p>
    </Card>
  );
}
