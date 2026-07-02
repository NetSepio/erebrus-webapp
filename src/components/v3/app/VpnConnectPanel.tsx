"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { QRCodeSVG } from "qrcode.react";
import {
  generateWgKeyPair,
  injectPrivateKey,
  storeClientPrivateKey,
  getClientPrivateKey,
  removeClientPrivateKey,
} from "@/lib/wireguard";
import {
  fetchSubscription,
  fetchVpnClients,
  fetchPlans,
  fetchOrgs,
  fetchOrgVpnNodes,
  provisionVpnClient,
  deleteVpnClient,
  fetchVpnClientConfig,
  startTrial,
  GatewayApiError,
} from "@/lib/gateway/client";
import { useOnlineNodes } from "@/context/online-nodes";
import { subscriptionDeviceLimit } from "@/lib/gateway/normalize";
import { nodeGeoLabel, regionZoneLabel } from "@/lib/regions";
import type { GatewayNode, GatewayOrg, GatewayPlan, GatewaySubscription, GatewayVpnClient } from "@/lib/gateway/types";
import { AccentButton, ActionButton, Card, MonoLabel } from "@/components/v3/ui";
import { NodeGlobe } from "@/components/v3/NodeGlobe";
import { NodeDetailPanel } from "@/components/v3/app/NodeDetailPanel";
import { formatBytes, formatRelativeTime, clientActivity } from "@/lib/format";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Download, Plus, ArrowDown, ArrowUp, QrCode, BadgeCheck } from "lucide-react";
import Link from "next/link";

function ScopeChip({
  label,
  active,
  onClick,
  verified = false,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  verified?: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition ${
        active
          ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-[var(--accent-hi)]"
          : "border-white/[0.08] text-[var(--text-3)] hover:bg-white/[0.04]"
      }`}
    >
      <span className="normal-case">{label}</span>
      {verified && <BadgeCheck size={13} className="text-[var(--accent-hi)]" />}
      {count != null && (
        <span className="rounded bg-white/[0.06] px-1.5 text-[10px] text-[var(--text-3)]">{count}</span>
      )}
    </button>
  );
}

type VpnState = "disconnected" | "connecting" | "connected";

export function VpnConnectPanel() {
  const { nodes: publicNodes, loading: nodesLoading } = useOnlineNodes();
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [sub, setSub] = useState<GatewaySubscription | null>(null);
  const [plans, setPlans] = useState<GatewayPlan[]>([]);
  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [orgNodes, setOrgNodes] = useState<GatewayNode[]>([]);
  // Active node scope: null = Public network, otherwise an org slug.
  const [scope, setScope] = useState<string | null>(null);
  const [selected, setSelected] = useState<GatewayNode | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [state, setState] = useState<VpnState>("disconnected");
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [nameDialog, setNameDialog] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [configModal, setConfigModal] = useState<{
    name: string;
    config: string;
    hasKey: boolean;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [c, s, p, o, on] = await Promise.all([
      fetchVpnClients().catch(() => []),
      fetchSubscription().catch(() => null),
      fetchPlans().catch(() => []),
      fetchOrgs().catch(() => []),
      fetchOrgVpnNodes().catch(() => []),
    ]);
    setClients(c);
    setSub(s);
    setPlans(p);
    setOrgs(o);
    setOrgNodes(on);
    setState(c.length > 0 ? "connected" : "disconnected");
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Org-scoped nodes grouped by org slug (incl. private nodes).
  const orgNodesBySlug = useMemo(() => {
    const map = new Map<string, GatewayNode[]>();
    for (const n of orgNodes) {
      const slug = n.org?.slug;
      if (!slug) continue;
      const arr = map.get(slug) ?? [];
      arr.push(n);
      map.set(slug, arr);
    }
    return map;
  }, [orgNodes]);

  // Scope options: orgs from /orgs (incl. empty), plus any org that has nodes
  // but wasn't returned by /orgs (synthesized from the node's org block).
  const scopeOrgs = useMemo(() => {
    const bySlug = new Map<string, { slug: string; name: string; verified: boolean }>();
    for (const o of orgs) {
      if (o.slug) bySlug.set(o.slug, { slug: o.slug, name: o.name, verified: o.verified });
    }
    for (const [slug, ns] of orgNodesBySlug) {
      if (!bySlug.has(slug)) {
        const org = ns[0]?.org;
        bySlug.set(slug, { slug, name: org?.name ?? slug, verified: org?.verified ?? false });
      }
    }
    return [...bySlug.values()];
  }, [orgs, orgNodesBySlug]);

  // Drop a stale scope whose org is no longer available.
  useEffect(() => {
    if (scope && !scopeOrgs.some((o) => o.slug === scope)) setScope(null);
  }, [scope, scopeOrgs]);

  // The active, scope-filtered node list (sorted lightest-load first).
  const nodes = useMemo(() => {
    const source = scope ? (orgNodesBySlug.get(scope) ?? []) : publicNodes;
    return [...source].sort((a, b) => (a.load_pct ?? 99) - (b.load_pct ?? 99));
  }, [scope, orgNodesBySlug, publicNodes]);

  const scopeLabel = useMemo(
    () => (scope ? scopeOrgs.find((o) => o.slug === scope)?.name ?? "Organization" : "Public network"),
    [scope, scopeOrgs]
  );

  // Node name lookup spanning public + org nodes (for the VPN-clients list).
  const nodeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of [...publicNodes, ...orgNodes]) {
      if (n.name) m.set(n.id, n.name);
    }
    return m;
  }, [publicNodes, orgNodes]);

  useEffect(() => {
    setSelected((prev) => {
      if (!prev) return nodes[0] ?? null;
      return nodes.find((n) => n.id === prev.id) ?? nodes[0] ?? null;
    });
  }, [nodes]);

  const deviceLimit = subscriptionDeviceLimit(sub, plans);
  const atLimit = clients.length >= deviceLimit;
  const entitled = sub?.entitled ?? false;
  const canProvision = entitled && !atLimit;

  const detailNode = useMemo(
    () => (detailId ? nodes.find((n) => n.id === detailId) ?? null : null),
    [detailId, nodes]
  );

  const totals = useMemo(
    () =>
      clients.reduce(
        (acc, c) => ({ rx: acc.rx + (c.rx_bytes ?? 0), tx: acc.tx + (c.tx_bytes ?? 0) }),
        { rx: 0, tx: 0 }
      ),
    [clients]
  );
  const hasBandwidth = totals.rx > 0 || totals.tx > 0;

  const handleNodeSelect = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (node) setSelected(node);
      setDetailId(id);
    },
    [nodes]
  );

  const statusUi = useMemo(() => {
    if (state === "connecting")
      return { label: "CONNECTING", color: "var(--accent-hi)", border: "rgba(255,107,53,0.3)" };
    if (state === "connected" || clients.length > 0)
      return { label: "PROTECTED", color: "var(--success)", border: "rgba(54,211,153,0.3)" };
    return { label: "DISCONNECTED", color: "var(--text-3)", border: "rgba(255,255,255,0.08)" };
  }, [state, clients.length]);

  const sessionStats = useMemo(() => {
    const active = clients[0];
    return [
      {
        label: "Last handshake",
        value: active?.last_handshake ? formatRelativeTime(active.last_handshake) : "—",
        color: "var(--text-2)",
      },
      {
        label: "Total transfer",
        value: hasBandwidth ? `↓${formatBytes(totals.rx)} · ↑${formatBytes(totals.tx)}` : "—",
        color: "var(--text)",
      },
      {
        label: "Node load",
        value: selected?.load_pct != null ? `${selected.load_pct.toFixed(0)}%` : "—",
        color: (selected?.load_pct ?? 0) > 80 ? "var(--warn)" : "var(--success)",
      },
    ];
  }, [clients, selected, hasBandwidth, totals]);

  const runProvision = async (name: string) => {
    if (!selected) return;
    setProvisioning(true);
    setState("connecting");
    try {
      const { privateKey, publicKey } = generateWgKeyPair();

      const client = await provisionVpnClient({
        name,
        node_id: selected.id,
        wg_public_key: publicKey,
        idempotency_key: `${selected.id}-${Date.now()}`,
      });

      // The node builds the config from our public key only — inject the
      // client-held private key to make it usable, and persist it so this
      // device's config can be re-downloaded or shown as a QR later.
      storeClientPrivateKey(client.id, privateKey);
      const { config: rawConfig } = await fetchVpnClientConfig(client.id);
      const config = injectPrivateKey(rawConfig, privateKey);

      setState("connected");
      setConfigModal({ name: client.name || name, config, hasKey: true });
      toast.success("VPN client provisioned");
      await refresh();
    } catch (err) {
      setState("disconnected");
      if (err instanceof GatewayApiError) {
        if (err.status === 402) toast.error("No entitlement — start trial or refresh NFT");
        else if (err.status === 409) toast.error("Device limit reached");
        else if (err.status === 403) toast.error(err.message);
        else toast.error(err.message);
      } else {
        toast.error("Failed to provision VPN client");
      }
    } finally {
      setProvisioning(false);
      setNameDialog(false);
    }
  };

  const provision = () => {
    if (!selected) return;
    if (!entitled) {
      toast.error("No active entitlement. Start a trial or get an access pass.");
      return;
    }
    if (atLimit) {
      toast.error(`Device limit reached (${deviceLimit}).`);
      return;
    }
    setDeviceName(`Device ${clients.length + 1}`);
    setNameDialog(true);
  };

  const startFreeTrial = async () => {
    try {
      await startTrial();
      toast.success("7-day trial activated");
      await refresh();
    } catch (err) {
      if (err instanceof GatewayApiError && err.status === 409) toast.error("Trial already used");
      else toast.error("Could not start trial");
    }
  };

  if (loading || nodesLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!entitled && (
        <Card className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-[var(--text-2)]">
            {sub?.trial_consumed
              ? "Your 7-day trial has ended. Contact support to upgrade your plan, or hold the access NFT to extend to 30 days."
              : "Start your free 7-day trial to provision WireGuard clients on the network."}
          </p>
          {sub?.trial_consumed ? (
            <Link href="/contact">
              <AccentButton>Contact support</AccentButton>
            </Link>
          ) : (
            <AccentButton onClick={startFreeTrial}>Start trial</AccentButton>
          )}
        </Card>
      )}

      {scopeOrgs.length > 0 && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="mr-1 pl-1 font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">
            VPN source
          </span>
          <ScopeChip label="Public network" active={scope === null} onClick={() => setScope(null)} />
          {scopeOrgs.map((o) => (
            <ScopeChip
              key={o.slug}
              label={o.name}
              verified={o.verified}
              count={orgNodesBySlug.get(o.slug)?.length ?? 0}
              active={scope === o.slug}
              onClick={() => setScope(o.slug)}
            />
          ))}
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_372px]">
        <Card
          className="overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #101014, #0B0B0E)",
          }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 md:px-[22px]">
            <div className="flex items-center gap-2.5">
              <MonoLabel>{scope ? scopeLabel : "Global Network"}</MonoLabel>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                {nodes.length} online
              </span>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-3)]">
              {scope ? "Org nodes" : "Auto-rotating"}
            </span>
          </div>
          <div className="relative h-[360px] md:h-[470px]">
            <NodeGlobe
              nodes={nodes}
              selectedId={selected?.id}
              onSelect={handleNodeSelect}
              className="absolute inset-0 h-full"
            />
            <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 md:left-[22px] md:right-[22px]">
              <div className="font-mono text-[11px] leading-relaxed text-[var(--text-3)]">
                <div>LAT {selected?.latitude?.toFixed(1) ?? "—"}</div>
                <div>LON {selected?.longitude?.toFixed(1) ?? "—"}</div>
              </div>
              {selected && !detailNode && (
                <div className="text-right">
                  <div className="font-mono text-[11px] text-[var(--accent-hi)]">SELECTED</div>
                  <div className="text-lg font-semibold">{selected.name || selected.region}</div>
                </div>
              )}
            </div>
            {!detailNode && (
              <div className="pointer-events-none absolute left-5 top-4 font-mono text-[11px] text-[var(--text-3)] md:left-[22px]">
                Tap a node for details
              </div>
            )}
            {detailNode && (
              <NodeDetailPanel
                node={detailNode}
                isSelectedEgress={selected?.id === detailNode.id}
                provisioning={provisioning}
                canProvision={canProvision}
                onUse={() => {
                  if (selected?.id !== detailNode.id) setSelected(detailNode);
                  provision();
                }}
                onClose={() => setDetailId(null)}
              />
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-6 text-center" style={{ borderColor: statusUi.border }}>
            <div className="relative mx-auto mb-5 h-[148px] w-[148px]">
              {state === "connecting" && (
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)]" />
              )}
              {state === "connected" && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full border border-[var(--success)]/40 opacity-40" />
                  <div className="absolute inset-2 animate-ping rounded-full border border-[var(--success)]/30 opacity-30 [animation-delay:600ms]" />
                </>
              )}
              <button
                type="button"
                onClick={provision}
                disabled={provisioning || !selected || nodes.length === 0}
                className="absolute inset-7 flex items-center justify-center rounded-full border-0 transition-transform hover:scale-105 disabled:opacity-60"
                style={{
                  background: state === "connected" ? "var(--success)" : "var(--accent)",
                  boxShadow:
                    state === "connected"
                      ? "0 0 40px rgba(54,211,153,0.4)"
                      : "0 0 40px rgba(255,107,53,0.4)",
                }}
              >
                <div className="h-7 w-7 rotate-[-45deg] rounded-[9px] border-[3.5px] border-[var(--on-accent)] border-r-transparent" />
              </button>
            </div>
            <div className="mb-1.5 font-mono text-xs tracking-[0.2em]" style={{ color: statusUi.color }}>
              {statusUi.label}
            </div>
            <div className="text-2xl font-semibold">{selected?.name ?? selected?.region ?? "—"}</div>
            <div className="text-sm text-[var(--text-2)]">{selected ? nodeGeoLabel(selected) : "—"}</div>
            <AccentButton className="mt-5 w-full" onClick={provision} disabled={provisioning || !selected}>
              {provisioning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
                </>
              ) : (
                "Download config"
              )}
            </AccentButton>
          </Card>

          <Card className="p-1">
            {sessionStats.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 last:border-0"
              >
                <span className="text-sm text-[var(--text-2)]">{s.label}</span>
                <span className="font-mono text-xs" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </Card>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold">Change location</span>
                  <span className="text-xs text-[var(--text-3)]">{nodes.length} nodes available</span>
                </span>
                <span className="text-[var(--text-3)]">→</span>
              </button>
            </SheetTrigger>
            <SheetContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)] w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Select node</SheetTitle>
              </SheetHeader>
              <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto">
                {nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      setSelected(node);
                      setDetailId(node.id);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                      selected?.id === node.id
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                        : "border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            background: node.status === "online" ? "var(--success)" : "var(--text-3)",
                            boxShadow: node.status === "online" ? "0 0 8px var(--success)" : "none",
                          }}
                        />
                        <span className="truncate font-medium">{node.name || node.region}</span>
                        {node.access_mode === "private" && (
                          <span className="rounded bg-[var(--warn)]/15 px-1.5 font-mono text-[10px] text-[var(--warn)]">
                            private
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-3)]">
                        {[regionZoneLabel(node.region, node.zone), node.latency_ms != null ? `${node.latency_ms}ms` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm text-[var(--success)]">
                      {node.load_pct?.toFixed(0) ?? 0}%
                    </span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold">VPN clients</span>
            <span className="font-mono text-[11px] text-[var(--text-3)]">
              {clients.length}/{deviceLimit}
            </span>
            <span className="rounded-md bg-[var(--accent)]/12 px-2.5 py-1 font-mono text-[11px] text-[var(--accent-hi)]">
              {sub?.plan_id ?? sub?.plan ?? "free"} plan
            </span>
          </div>
          <ActionButton
            variant="accent"
            onClick={provision}
            disabled={provisioning || !selected || atLimit || !entitled}
          >
            <Plus size={14} />
            Add device
          </ActionButton>
        </div>

        {hasBandwidth && (
          <div className="flex items-center gap-6 border-b border-white/[0.04] bg-white/[0.015] px-5 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-3)]">
              Total transfer
            </span>
            <span className="font-mono text-xs text-[var(--text-2)]">
              <ArrowDown className="mr-1 inline h-3 w-3 text-[var(--success)]" />
              {formatBytes(totals.rx)}
            </span>
            <span className="font-mono text-xs text-[var(--text-2)]">
              <ArrowUp className="mr-1 inline h-3 w-3 text-[var(--accent-hi)]" />
              {formatBytes(totals.tx)}
            </span>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[var(--text-2)]">
              No VPN clients yet. Add one to generate a WireGuard config you can import into
              the WireGuard app.
            </p>
            <AccentButton
              className="mx-auto mt-4 !py-2.5 !text-[13px]"
              onClick={provision}
              disabled={provisioning || !selected || !entitled}
            >
              <Plus size={14} /> Create your first client
            </AccentButton>
          </div>
        ) : (
          clients.map((client) => {
            const activity = clientActivity(client.last_handshake);
            // Look across all known nodes (public + org) so a client's node name
            // resolves regardless of the currently selected scope.
            const nodeRegion = nodeNameById.get(client.node_id) ?? client.node_region;
            return (
              <div
                key={client.id}
                className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-4 md:grid md:grid-cols-[1.5fr_1.1fr_1.2fr_auto] md:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] font-mono text-sm">
                    ◎
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{client.name}</div>
                    <div className="font-mono text-[11px] text-[var(--text-3)]">
                      {nodeRegion ? `${nodeRegion} · ` : ""}
                      {client.id.slice(0, 8)}…
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: activity.color,
                        boxShadow: activity.online ? `0 0 8px ${activity.color}` : "none",
                      }}
                    />
                    <span style={{ color: activity.color }}>{activity.label}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--text-3)]">
                    {client.last_handshake
                      ? `handshake ${formatRelativeTime(client.last_handshake)}`
                      : `added ${new Date(client.created_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-4 font-mono text-xs text-[var(--text-2)]">
                  <span title="Downloaded">
                    <ArrowDown className="mr-1 inline h-3 w-3 text-[var(--success)]" />
                    {formatBytes(client.rx_bytes)}
                  </span>
                  <span title="Uploaded">
                    <ArrowUp className="mr-1 inline h-3 w-3 text-[var(--accent-hi)]" />
                    {formatBytes(client.tx_bytes)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    variant="neutral"
                    className="!px-2.5"
                    onClick={async () => {
                      try {
                        const { config: raw } = await fetchVpnClientConfig(client.id);
                        const pk = getClientPrivateKey(client.id);
                        setConfigModal({
                          name: client.name,
                          config: pk ? injectPrivateKey(raw, pk) : raw,
                          hasKey: !!pk,
                        });
                      } catch {
                        toast.error("Could not fetch config");
                      }
                    }}
                  >
                    <QrCode size={14} />
                    Config
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    className="!px-2.5"
                    onClick={async () => {
                      try {
                        await deleteVpnClient(client.id);
                        removeClientPrivateKey(client.id);
                        toast.success("Device removed");
                        await refresh();
                      } catch {
                        toast.error("Could not remove device");
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </ActionButton>
                </div>
              </div>
            );
          })
        )}

        {atLimit && (
          <div className="flex flex-col items-start justify-between gap-3 bg-[var(--accent)]/[0.04] px-5 py-4 sm:flex-row sm:items-center">
            <span className="text-sm text-[var(--text-2)]">Device limit reached on your current plan.</span>
            <Link href="/subscribe">
              <AccentButton className="!py-2 !text-[13px]">Upgrade</AccentButton>
            </Link>
          </div>
        )}
      </Card>

      <Dialog open={nameDialog} onOpenChange={setNameDialog}>
        <DialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <DialogHeader>
            <DialogTitle>Name this device</DialogTitle>
          </DialogHeader>
          <Label htmlFor="device-name">Device name</Label>
          <Input
            id="device-name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="mt-1 border-white/10 bg-[var(--surface-2)]"
          />
          <AccentButton
            className="mt-4 w-full"
            onClick={() => runProvision(deviceName.trim() || "My device")}
            disabled={provisioning}
          >
            {provisioning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
              </>
            ) : (
              "Provision device"
            )}
          </AccentButton>
        </DialogContent>
      </Dialog>

      <Dialog open={!!configModal} onOpenChange={(o) => !o && setConfigModal(null)}>
        <DialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{configModal?.name} — WireGuard config</DialogTitle>
          </DialogHeader>
          {configModal?.hasKey ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-sm text-[var(--text-2)]">
                Scan this with the WireGuard app, or download the <code>.conf</code> and import it.
              </p>
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG value={configModal.config} size={208} level="M" marginSize={0} />
              </div>
              <AccentButton
                className="w-full"
                onClick={() =>
                  saveAs(
                    new Blob([configModal.config], { type: "text/plain" }),
                    `${configModal.name.replace(/[^a-z0-9-_]+/gi, "-") || "erebrus"}.conf`
                  )
                }
              >
                <Download size={16} /> Download .conf
              </AccentButton>
            </div>
          ) : (
            <p className="rounded-lg bg-[var(--warn)]/10 px-3 py-3 text-center text-sm text-[var(--warn)]">
              The private key for this device isn’t available in this browser, so an installable
              config can’t be rebuilt. Remove this device and add it again to get a fresh config you
              can download or scan.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}