"use client";

import { useState } from "react";
import type { GatewayNode } from "@/lib/gateway/types";
import { AccentButton } from "@/components/v3/ui";
import { formatRelativeTime, nodeActivityDisplay } from "@/lib/format";
import { useRelativeTimeTick } from "@/hooks/use-relative-time-tick";
import { nodeGeoLabel, regionFlag } from "@/lib/regions";
import { ShieldCredentialsCard } from "@/components/v3/workspace/ShieldCredentialsCard";
import { profileLabel } from "@/lib/gateway/profiles";
import {
  X,
  Download,
  Loader2,
  Check,
  Copy,
  Globe,
  BadgeCheck,
  Building2,
  House,
  User,
  Users,
} from "lucide-react";

function OrgKindIcon({ kind, className }: { kind?: string; className?: string }) {
  const k = (kind ?? "").toLowerCase();
  const Icon = k === "individual" ? User : k === "company" ? Building2 : k === "family" ? House : Users;
  return <Icon className={className} aria-hidden />;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
      <div className="font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-3)]">{label}</div>
      <div className="mt-0.5 font-mono text-[13px]" style={{ color: color ?? "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

/** Clipped identifier with copy-to-clipboard. */
function CopyRow({ label, value, display }: { label: string; value: string; display: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label}: ${value}`}
      className="group flex w-full items-center justify-between gap-2 text-[10.5px]"
    >
      <span className="font-mono text-[var(--text-3)]">{label}</span>
      <span className="flex min-w-0 items-center gap-1 font-mono text-[var(--text-2)] group-hover:text-[var(--text)]">
        <span className="truncate">{display}</span>
        {copied ? (
          <Check size={11} className="shrink-0 text-[var(--success)]" />
        ) : (
          <Copy size={11} className="shrink-0 opacity-50 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
}

/** Compact detail card for a node selected on the globe. Floats over the canvas. */
export function NodeDetailPanel({
  node,
  orgId,
  canRevealShield = false,
  isSelectedEgress = false,
  provisioning = false,
  canProvision = false,
  onUse,
  onClose,
  showAction = true,
}: {
  node: GatewayNode;
  /** Workspace org id — required to reveal Shield / AdGuard credentials. */
  orgId?: string;
  canRevealShield?: boolean;
  isSelectedEgress?: boolean;
  provisioning?: boolean;
  canProvision?: boolean;
  onUse?: () => void;
  onClose: () => void;
  /** Hide the provision/download action (e.g. on the public landing map). */
  showAction?: boolean;
}) {
  useRelativeTimeTick();
  const online = node.status === "online" || node.status === "active";
  const mbps = (v?: number) => (v != null ? `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} Mbps` : "—");
  const flag = regionFlag(node.region);
  const activity = nodeActivityDisplay(node);
  const activityLabel = activity.label;
  const activityAt = activity.at;
  const org = node.org;
  const kindLabel = org?.kind
    ? org.kind.charAt(0).toUpperCase() + org.kind.slice(1)
    : null;
  const wallet = node.wallet_address;
  const since = node.created_at
    ? new Date(node.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;
  const version = node.version ? `v${node.version.replace(/^v/, "")}` : null;
  const isShield = node.deployment_profile === "shield";
  const nodePeerId = node.node_id ?? node.id;

  return (
    <div
      className={`pointer-events-auto absolute right-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] ${
        isShield && orgId ? "w-[min(100%-1.5rem,300px)]" : "w-[244px]"
      } max-w-[calc(100%-1.5rem)] flex-col overflow-y-auto overscroll-contain rounded-xl border border-white/[0.1] bg-[var(--elevated)]/95 p-3 shadow-2xl backdrop-blur-xl md:right-[16px] md:top-[16px]`}
    >
      {/* Header: node name + close */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              background: online ? "var(--success)" : "var(--text-3)",
              boxShadow: online ? "0 0 8px var(--success)" : "none",
            }}
          />
          <span className="truncate text-[14px] font-semibold">{node.name || node.region}</span>
          {node.deployment_profile && node.deployment_profile !== "erebrus" && (
            <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase text-[var(--text-3)]">
              {profileLabel(node.deployment_profile)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          className="-mr-1 shrink-0 rounded-md p-1 text-[var(--text-3)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Location with flag + de-emphasised access mode */}
      <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
        {flag ? (
          <span className="text-[13px] leading-none">{flag}</span>
        ) : (
          <Globe className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">
          {nodeGeoLabel(node)}
          <span className="text-[var(--text-3)]/70"> · {node.access_mode}</span>
        </span>
      </div>

      {/* Operating org: kind icon + name + verified */}
      {org?.name && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
          <OrgKindIcon kind={org.kind} className="h-3.5 w-3.5 shrink-0 text-[var(--text-2)]" />
          {org.website ? (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[12.5px] font-medium hover:text-[var(--accent-hi)]"
            >
              {org.name}
            </a>
          ) : (
            <span className="truncate text-[12.5px] font-medium">{org.name}</span>
          )}
          {org.verified ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" aria-label="Verified" />
          ) : (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 text-[var(--text-3)] opacity-40"
              aria-label="Unverified"
            />
          )}
          {kindLabel && (
            <span className="ml-auto shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-[var(--text-3)]">
              {kindLabel}
            </span>
          )}
        </div>
      )}

      {/* Key metrics */}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Stat label="Latency" value={node.latency_ms != null ? `${node.latency_ms} ms` : "—"} />
        <Stat
          label="Load"
          value={node.load_pct != null ? `${node.load_pct.toFixed(0)}%` : "—"}
          color={(node.load_pct ?? 0) > 80 ? "var(--warn)" : "var(--success)"}
        />
        <Stat label="↓ Down" value={mbps(node.download_mbps)} />
        <Stat label="↑ Up" value={mbps(node.upload_mbps)} />
      </div>

      {/* Protocols */}
      {node.protocols && node.protocols.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.protocols.map((p) => (
            <span
              key={p}
              className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-2)]"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Liveness + copyable identifiers */}
      <div className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
        <div className="flex items-center justify-between text-[10.5px]">
          <span className="font-mono text-[var(--text-3)]">{activityLabel}</span>
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-2)]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: online ? "var(--success)" : "var(--text-3)",
                boxShadow: online ? "0 0 6px var(--success)" : "none",
              }}
            />
            {activityAt != null ? formatRelativeTime(activityAt) : "—"}
          </span>
        </div>
        {node.did && (
          <CopyRow label="DID" value={node.did} display={`…${node.did.slice(-10)}`} />
        )}
        {wallet && (
          <CopyRow
            label="Wallet"
            value={wallet}
            display={`${wallet.slice(0, 6)}…${wallet.slice(-4)}`}
          />
        )}
        {(version || since) && (
          <div className="flex flex-wrap items-center gap-x-1.5 pt-0.5 font-mono text-[9.5px] text-[var(--text-3)]">
            {version && <span>{version}</span>}
            {version && since && <span aria-hidden>·</span>}
            {since && <span>since {since}</span>}
          </div>
        )}
      </div>

      {isShield && orgId && nodePeerId && canRevealShield && (
        <div className="mt-2.5">
          <ShieldCredentialsCard
            orgId={orgId}
            nodeId={nodePeerId}
            nodeName={node.name}
            compact
            canRotate={false}
            canReveal={canRevealShield}
          />
        </div>
      )}

      {showAction && onUse && (
        <AccentButton
          className="mt-2.5 w-full !py-2 !text-[13px]"
          variant={isSelectedEgress ? "ghost" : "primary"}
          onClick={onUse}
          disabled={provisioning || !canProvision || !online}
        >
          {provisioning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
            </>
          ) : isSelectedEgress ? (
            <>
              <Download size={14} /> Download config
            </>
          ) : (
            <>
              <Check size={14} /> Use this node
            </>
          )}
        </AccentButton>
      )}
    </div>
  );
}
