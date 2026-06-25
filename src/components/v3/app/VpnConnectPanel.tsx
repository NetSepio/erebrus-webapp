"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateKeyPair } from "curve25519-js";
import { saveAs } from "file-saver";
import {
  fetchNodes,
  fetchSubscription,
  fetchVpnClients,
  provisionVpnClient,
  deleteVpnClient,
  fetchVpnClientConfig,
  startTrial,
  GatewayApiError,
} from "@/lib/gateway/client";
import type { GatewayNode, GatewaySubscription, GatewayVpnClient } from "@/lib/gateway/types";
import { AccentButton, Card, MonoLabel, StatusDot } from "@/components/v3/ui";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Trash2, Download } from "lucide-react";
import Link from "next/link";

type VpnState = "disconnected" | "connecting" | "connected";

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function VpnConnectPanel() {
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [sub, setSub] = useState<GatewaySubscription | null>(null);
  const [selected, setSelected] = useState<GatewayNode | null>(null);
  const [state, setState] = useState<VpnState>("disconnected");
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  const refresh = useCallback(async () => {
    const [n, c, s] = await Promise.all([
      fetchNodes({ status: "online" }).catch(() => []),
      fetchVpnClients().catch(() => []),
      fetchSubscription().catch(() => null),
    ]);
    setNodes(n.sort((a, b) => (a.latency_ms ?? 999) - (b.latency_ms ?? 999)));
    setClients(c);
    setSub(s);
    if (!selected && n.length) setSelected(n[0]);
    setLoading(false);
  }, [selected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deviceLimit = sub?.device_limit ?? 3;
  const atLimit = clients.length >= deviceLimit;
  const entitled = sub?.entitled ?? false;

  const statusUi = useMemo(() => {
    if (state === "connecting")
      return { label: "CONNECTING", color: "var(--accent-hi)", border: "rgba(255,107,53,0.3)" };
    if (clients.length > 0)
      return { label: "PROTECTED", color: "var(--success)", border: "rgba(54,211,153,0.3)" };
    return { label: "DISCONNECTED", color: "var(--text-3)", border: "rgba(255,255,255,0.08)" };
  }, [state, clients.length]);

  const provision = async () => {
    if (!selected) return;
    if (!entitled) {
      toast.error("No active entitlement. Start a trial or get an access pass.");
      return;
    }
    if (atLimit) {
      toast.error(`Device limit reached (${deviceLimit}). Upgrade your plan.`);
      return;
    }

    setProvisioning(true);
    setState("connecting");
    try {
      const seed = new Uint8Array(32);
      crypto.getRandomValues(seed);
      const { public: wgPublicKeyBytes } = generateKeyPair(seed);
      const wgPublicKey = bytesToBase64(wgPublicKeyBytes);

      const client = await provisionVpnClient({
        name: `Device ${clients.length + 1}`,
        node_id: selected.id,
        wg_public_key: wgPublicKey,
        idempotency_key: `${selected.id}-${Date.now()}`,
      });

      const configRes = await fetchVpnClientConfig(client.id);
      const blob = new Blob([configRes.config], { type: "text/plain" });
      saveAs(blob, `erebrus-${selected.region ?? "vpn"}.conf`);

      setState("connected");
      toast.success("VPN client provisioned — config downloaded");
      await refresh();
    } catch (err) {
      setState("disconnected");
      if (err instanceof GatewayApiError) {
        if (err.status === 402) toast.error("No entitlement — subscribe or start trial");
        else if (err.status === 409) toast.error("Device limit reached");
        else toast.error(err.message);
      } else {
        toast.error("Failed to provision VPN client");
      }
    } finally {
      setProvisioning(false);
    }
  };

  const removeClient = async (id: string) => {
    try {
      await deleteVpnClient(id);
      toast.success("Device removed");
      await refresh();
      if (clients.length <= 1) setState("disconnected");
    } catch {
      toast.error("Failed to remove device");
    }
  };

  const startFreeTrial = async () => {
    try {
      await startTrial();
      toast.success("7-day trial activated");
      await refresh();
    } catch (err) {
      if (err instanceof GatewayApiError && err.status === 409) {
        toast.error("Trial already used");
      } else {
        toast.error("Could not start trial");
      }
    }
  };

  if (loading) {
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
            Start your free 7-day trial to provision VPN clients.
          </p>
          <AccentButton onClick={startFreeTrial}>Start trial</AccentButton>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_372px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <MonoLabel>Global Network</MonoLabel>
              <span className="font-mono text-[11px] text-[var(--success)]">
                ● {nodes.length} online
              </span>
            </div>
          </div>
          <div className="relative flex h-[280px] items-center justify-center bg-[var(--bg-deep)] md:h-[470px]">
            <div
              className="h-48 w-48 rounded-full border border-white/10 md:h-64 md:w-64"
              style={{
                background:
                  "radial-gradient(circle at 40% 35%, rgba(255,107,53,0.15), transparent 65%)",
              }}
            />
            {selected && (
              <div className="absolute bottom-5 left-5 font-mono text-[11px] text-[var(--text-3)]">
                <div>LAT {selected.latitude?.toFixed(2) ?? "—"}</div>
                <div>LON {selected.longitude?.toFixed(2) ?? "—"}</div>
              </div>
            )}
            {selected && (
              <div className="absolute bottom-5 right-5 text-right">
                <div className="font-mono text-[11px] text-[var(--accent-hi)]">SELECTED</div>
                <div className="text-lg font-semibold">{selected.city ?? selected.region}</div>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card
            className="p-6 text-center"
            style={{ borderColor: statusUi.border }}
          >
            <div
              className="relative mx-auto mb-5 h-[148px] w-[148px]"
            >
              {state === "connecting" && (
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)]" />
              )}
              <button
                type="button"
                onClick={provision}
                disabled={provisioning || !selected}
                className="absolute inset-7 flex items-center justify-center rounded-full border-0 transition-transform hover:scale-105 disabled:opacity-60"
                style={{
                  background: clients.length ? "var(--success)" : "var(--accent)",
                  boxShadow: clients.length
                    ? "0 0 40px rgba(54,211,153,0.4)"
                    : "0 0 40px rgba(255,107,53,0.4)",
                }}
              >
                <div className="h-7 w-7 rotate-[-45deg] rounded-[9px] border-[3.5px] border-[var(--on-accent)] border-r-transparent" />
              </button>
            </div>
            <div
              className="mb-1.5 font-mono text-xs tracking-[0.2em]"
              style={{ color: statusUi.color }}
            >
              {statusUi.label}
            </div>
            <div className="text-2xl font-semibold">{selected?.city ?? selected?.region ?? "—"}</div>
            <div className="text-sm text-[var(--text-2)]">{selected?.country ?? ""}</div>
            <AccentButton
              className="mt-5 w-full"
              onClick={provision}
              disabled={provisioning || !selected}
            >
              {provisioning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Provisioning…
                </>
              ) : (
                "Download config"
              )}
            </AccentButton>
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
            <SheetContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
              <SheetHeader>
                <SheetTitle>Select node</SheetTitle>
              </SheetHeader>
              <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto">
                {nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelected(node)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <div>
                      <div className="font-medium">{node.city ?? node.region}</div>
                      <div className="font-mono text-[11px] text-[var(--text-3)]">{node.did}</div>
                    </div>
                    <span className="font-mono text-sm text-[var(--success)]">
                      {node.latency_ms ?? "—"}ms
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
            <span className="font-semibold">Connected devices</span>
            <span className="font-mono text-[11px] text-[var(--text-3)]">
              {clients.length}/{deviceLimit}
            </span>
          </div>
          <span className="rounded-md bg-[var(--accent)]/12 px-2.5 py-1 font-mono text-[11px] text-[var(--accent-hi)]">
            {sub?.plan ?? "trial"} plan
          </span>
        </div>

        <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-4 border-b border-white/[0.05] px-5 py-3 font-mono text-[10.5px] uppercase tracking-wide text-[var(--text-3)] md:grid">
          <div>Device</div>
          <div>Node</div>
          <div>Created</div>
          <div />
        </div>

        {clients.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--text-2)]">
            No devices yet. Download a config to add one.
          </p>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-4 md:grid md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] font-mono text-sm">
                  ◎
                </span>
                <div>
                  <div className="font-semibold">{client.name}</div>
                  <div className="font-mono text-[11px] text-[var(--text-3)]">{client.id.slice(0, 8)}…</div>
                </div>
              </div>
              <div className="text-sm">{client.node_region ?? "—"}</div>
              <div className="font-mono text-xs text-[var(--text-3)]">
                {new Date(client.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--text-2)] hover:bg-white/[0.06]"
                  onClick={async () => {
                    const { config } = await fetchVpnClientConfig(client.id);
                    saveAs(new Blob([config]), `${client.name}.conf`);
                  }}
                  aria-label="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  onClick={() => removeClient(client.id)}
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}

        {atLimit && (
          <div className="flex flex-col items-start justify-between gap-3 bg-[var(--accent)]/[0.04] px-5 py-4 sm:flex-row sm:items-center">
            <span className="text-sm text-[var(--text-2)]">
              Device limit reached on your current plan.
            </span>
            <Link href="/subscribe">
              <AccentButton className="!py-2 !text-[13px]">Upgrade</AccentButton>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}