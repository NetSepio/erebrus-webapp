"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminActivity,
  fetchAdminNodeMetrics,
  fetchAdminNodes,
  fetchAdminOrgUsage,
  fetchAdminOrgs,
  fetchAdminSettings,
  fetchAdminStats,
  fetchAdminSubscriptions,
  fetchAdminUsers,
  grantAdminPerk,
  patchAdminOrg,
  patchAdminSettings,
  GatewayApiError,
} from "@/lib/gateway/client";
import type {
  GatewayActivity,
  GatewayAdminNode,
  GatewayAdminOrg,
  GatewayAdminStats,
  GatewayAdminUser,
  GatewayPlatformSetting,
} from "@/lib/gateway/types";
import {
  AccentButton,
  ActionButton,
  Card,
  MonoLabel,
  StatCard,
  v3TabsListClass,
  v3TabsTriggerClass,
} from "@/components/v3/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/design";
import { regionZoneLabel } from "@/lib/regions";

function formatBytes(n: number): string {
  if (!n || n < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function NodeMetricsRow({ nodeId }: { nodeId: string }) {
  const [metrics, setMetrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminNodeMetrics(nodeId, { range: "24h", step: "1h" });
      const points = data.buckets ?? data.points ?? [];
      const last = points[points.length - 1];
      if (!last) {
        setMetrics("No metrics in the last 24h");
      } else {
        setMetrics(
          `Peers ${last.wg_peers ?? 0} · RX ${formatBytes(last.rx_bytes ?? 0)} · TX ${formatBytes(last.tx_bytes ?? 0)} · CPU ${last.cpu_pct?.toFixed(0) ?? "—"}%`
        );
      }
    } catch {
      setMetrics("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 border-t border-white/[0.04] pt-2">
      {metrics ? (
        <p className="font-mono text-[11px] text-[var(--text-3)]">{metrics}</p>
      ) : (
        <ActionButton type="button" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "View 24h stats"}
        </ActionButton>
      )}
    </div>
  );
}

export function AdminConsole() {
  const [stats, setStats] = useState<GatewayAdminStats | null>(null);
  const [users, setUsers] = useState<GatewayAdminUser[]>([]);
  const [userOffset, setUserOffset] = useState(0);
  const [nodes, setNodes] = useState<GatewayAdminNode[]>([]);
  const [nodeFilter, setNodeFilter] = useState("");
  const [orgs, setOrgs] = useState<GatewayAdminOrg[]>([]);
  const [activity, setActivity] = useState<GatewayActivity[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | undefined>();
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<GatewayPlatformSetting[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});
  const [verifyOrgId, setVerifyOrgId] = useState("");
  const [grantPerkId, setGrantPerkId] = useState("");
  const [grantWallet, setGrantWallet] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    const [s, sub] = await Promise.all([fetchAdminStats(), fetchAdminSubscriptions()]);
    setStats(s);
    setSubs(sub.active_by_plan ?? {});
  }, []);

  const loadUsers = useCallback(async (offset = 0) => {
    const data = await fetchAdminUsers({ limit: 50, offset });
    setUsers(data.users);
    setUserOffset(offset);
  }, []);

  const loadNodes = useCallback(async () => {
    const data = await fetchAdminNodes(
      nodeFilter ? { status: nodeFilter } : undefined
    );
    setNodes(data.nodes);
  }, [nodeFilter]);

  const loadOrgs = useCallback(async () => {
    const data = await fetchAdminOrgs({ limit: 50, offset: 0 });
    setOrgs(data.orgs);
  }, []);

  const loadActivity = useCallback(async (cursor?: string, append = false) => {
    const data = await fetchAdminActivity({ limit: 50, cursor });
    setActivity((prev) => (append ? [...prev, ...data.activity] : data.activity));
    setActivityCursor(data.next_cursor);
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await fetchAdminSettings();
    setSettings(data.settings);
    const draft: Record<string, string> = {};
    data.settings.forEach((s) => {
      draft[s.key] = s.value;
    });
    setSettingsDraft(draft);
  }, []);

  useEffect(() => {
    loadOverview()
      .catch((e) => toast.error(e instanceof GatewayApiError ? e.message : "Failed to load stats"))
      .finally(() => setLoading(false));
  }, [loadOverview]);

  const onTab = (tab: string) => {
    const run = async () => {
      try {
        if (tab === "users" && users.length === 0) await loadUsers();
        if (tab === "nodes" && nodes.length === 0) await loadNodes();
        if (tab === "orgs" && orgs.length === 0) await loadOrgs();
        if (tab === "activity" && activity.length === 0) await loadActivity();
        if (tab === "settings" && settings.length === 0) await loadSettings();
      } catch (e) {
        toast.error(e instanceof GatewayApiError ? e.message : "Failed to load data");
      }
    };
    run();
  };

  const saveSettings = async () => {
    try {
      await patchAdminSettings(settingsDraft);
      toast.success("Platform settings updated");
      loadSettings();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to save settings");
    }
  };

  const toggleOrgVerified = async (verified: boolean) => {
    if (!verifyOrgId.trim()) {
      toast.error("Enter org UUID (from workspace URL)");
      return;
    }
    try {
      await patchAdminOrg(verifyOrgId.trim(), verified);
      toast.success(verified ? "Org verified" : "Org unverified");
      loadOrgs();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to update org");
    }
  };

  const grantPerk = async () => {
    if (!grantPerkId.trim() || !grantWallet.trim()) {
      toast.error("Perk ID and wallet required");
      return;
    }
    try {
      await grantAdminPerk(grantPerkId.trim(), { wallet: grantWallet.trim() });
      toast.success("Perk granted");
      setGrantWallet("");
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to grant perk");
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading admin console…</div>;
  }

  const onlineNodes =
    stats?.nodes.by_status?.online ?? stats?.nodes.connected ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <MonoLabel className="text-[var(--accent-hi)]">Platform admin</MonoLabel>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Admin Console</h2>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Fleet overview, users, nodes, orgs, audit log, and platform settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={stats?.users.total ?? "—"} />
        <StatCard label="Organizations" value={stats?.orgs.total ?? "—"} />
        <StatCard
          label="Nodes online"
          value={onlineNodes}
          sub={`${stats?.nodes.connected ?? 0} connected via hub`}
        />
        <StatCard
          label="Traffic (30d)"
          value={formatBytes(
            (stats?.traffic_30d.rx_bytes ?? 0) + (stats?.traffic_30d.tx_bytes ?? 0)
          )}
        />
      </div>

      <Tabs defaultValue="users" onValueChange={onTab}>
        <TabsList className={v3TabsListClass}>
          <TabsTrigger value="users" className={v3TabsTriggerClass}>
            Users
          </TabsTrigger>
          <TabsTrigger value="nodes" className={v3TabsTriggerClass}>
            Nodes
          </TabsTrigger>
          <TabsTrigger value="orgs" className={v3TabsTriggerClass}>
            Orgs
          </TabsTrigger>
          <TabsTrigger value="subs" className={v3TabsTriggerClass}>
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="activity" className={v3TabsTriggerClass}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="perks" className={v3TabsTriggerClass}>
            Perks
          </TabsTrigger>
          <TabsTrigger value="settings" className={v3TabsTriggerClass}>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-3">
          <Card className="overflow-hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-1 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-mono text-sm">
                    {u.wallet_address ? truncateAddress(u.wallet_address) : u.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-[var(--text-3)]">
                    {u.name || "—"} · {u.chain ?? "—"} ·{" "}
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase ${
                    u.role === "admin"
                      ? "bg-[var(--accent)]/20 text-[var(--accent-hi)]"
                      : "bg-white/[0.06] text-[var(--text-2)]"
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </Card>
          <div className="flex gap-2">
            <AccentButton
              type="button"
              variant="ghost"
              disabled={userOffset === 0}
              onClick={() => loadUsers(Math.max(0, userOffset - 50))}
            >
              Previous
            </AccentButton>
            <AccentButton type="button" variant="ghost" onClick={() => loadUsers(userOffset + 50)}>
              Next page
            </AccentButton>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {["", "online", "offline", "draining"].map((s) => (
              <button
                key={s || "all"}
                type="button"
                onClick={() => {
                  setNodeFilter(s);
                  fetchAdminNodes(s ? { status: s } : undefined)
                    .then((d) => setNodes(d.nodes))
                    .catch(() => toast.error("Failed to load nodes"));
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  nodeFilter === s
                    ? "border-[var(--accent)]/30 bg-[var(--accent)]/20 text-[var(--accent-hi)]"
                    : "border-white/[0.1] bg-white/[0.04] text-[var(--text-2)]"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          <Card className="overflow-hidden">
            {nodes.map((n) => (
              <div key={n.id} className="border-b border-white/[0.04] px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold">{n.name || n.region}</div>
                    <div className="font-mono text-[11px] text-[var(--text-3)]">{n.did}</div>
                    <div className="mt-1 text-xs text-[var(--text-2)]">
                      {regionZoneLabel(n.region, n.zone)} · tier {n.min_tier ?? 0} · {n.access_mode ?? "public"}
                    </div>
                  </div>
                  <span
                    className="self-start rounded-md px-2 py-0.5 font-mono text-[10px] uppercase"
                    style={{
                      background:
                        n.status === "online"
                          ? "rgba(54,211,153,0.15)"
                          : "rgba(255,255,255,0.06)",
                      color: n.status === "online" ? "var(--success)" : "var(--text-3)",
                    }}
                  >
                    {n.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-[var(--text-3)]">
                  <span>RX {formatBytes(n.rx_bytes ?? 0)}</span>
                  <span>TX {formatBytes(n.tx_bytes ?? 0)}</span>
                  {n.org_id && <span>Org {n.org_id.slice(0, 8)}…</span>}
                </div>
                <NodeMetricsRow nodeId={n.id} />
              </div>
            ))}
            {nodes.length === 0 && (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No nodes found.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="orgs" className="mt-4 space-y-4">
          <Card className="p-5">
            <Label>Verify org by UUID</Label>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              Copy the org id from a workspace URL (/workspace/[id]).
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={verifyOrgId}
                onChange={(e) => setVerifyOrgId(e.target.value)}
                placeholder="Org UUID"
                className="border-white/10 bg-[var(--surface-2)]"
              />
              <AccentButton type="button" onClick={() => toggleOrgVerified(true)}>
                Verify
              </AccentButton>
              <AccentButton type="button" variant="ghost" onClick={() => toggleOrgVerified(false)}>
                Unverify
              </AccentButton>
              <AccentButton
                type="button"
                variant="ghost"
                onClick={async () => {
                  if (!verifyOrgId.trim()) return;
                  try {
                    const u = await fetchAdminOrgUsage(verifyOrgId.trim());
                    toast.success(
                      `30d: ${u.clients ?? u.vpn_clients ?? 0} clients · ${u.api_calls ?? 0} API calls · ${formatBytes(u.bandwidth_total ?? 0)} bandwidth`
                    );
                  } catch (e) {
                    toast.error(e instanceof GatewayApiError ? e.message : "Usage lookup failed");
                  }
                }}
              >
                Usage
              </AccentButton>
            </div>
          </Card>
          <Card className="overflow-hidden">
            {orgs.map((o, i) => (
              <div
                key={`${o.name}-${i}`}
                className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
              >
                <div>
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-xs capitalize text-[var(--text-3)]">
                    {o.kind}
                    {o.slug ? ` · ${o.slug}` : ""}
                  </div>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase ${
                    o.verified ? "text-[var(--success)]" : "text-[var(--text-3)]"
                  }`}
                >
                  {o.verified ? "Verified" : "Unverified"}
                </span>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries({ ...stats?.subscriptions.by_plan, ...subs }).map(([plan, count]) => (
              <StatCard key={plan} label={plan} value={count ?? 0} sub="active subscriptions" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-3">
          <Card className="overflow-hidden">
            {activity.map((a) => (
              <div key={a.id} className="border-b border-white/[0.04] px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-[var(--accent-hi)]">{a.action}</span>
                  <span className="font-mono text-[10px] text-[var(--text-3)]">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                {a.target && (
                  <div className="mt-1 font-mono text-[11px] text-[var(--text-3)]">{a.target}</div>
                )}
              </div>
            ))}
          </Card>
          {activityCursor && (
            <AccentButton type="button" variant="ghost" onClick={() => loadActivity(activityCursor, true)}>
              Load more
            </AccentButton>
          )}
        </TabsContent>

        <TabsContent value="perks" className="mt-4">
          <Card className="space-y-4 p-5">
            <p className="text-sm text-[var(--text-2)]">
              Grant a catalog perk to a user by wallet address.
            </p>
            <div>
              <Label>Perk ID</Label>
              <Input
                value={grantPerkId}
                onChange={(e) => setGrantPerkId(e.target.value)}
                className="mt-1 border-white/10 bg-[var(--surface-2)]"
              />
            </div>
            <div>
              <Label>Wallet address</Label>
              <Input
                value={grantWallet}
                onChange={(e) => setGrantWallet(e.target.value)}
                className="mt-1 border-white/10 bg-[var(--surface-2)]"
              />
            </div>
            <AccentButton type="button" onClick={grantPerk}>
              Grant perk
            </AccentButton>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="divide-y divide-white/[0.04] overflow-hidden">
            {settings.map((s) => (
              <div key={s.key} className="px-5 py-4">
                <Label className="font-mono text-xs text-[var(--accent-hi)]">{s.key}</Label>
                {s.description && (
                  <p className="mt-0.5 text-xs text-[var(--text-3)]">{s.description}</p>
                )}
                <Input
                  value={settingsDraft[s.key] ?? ""}
                  onChange={(e) =>
                    setSettingsDraft((d) => ({ ...d, [s.key]: e.target.value }))
                  }
                  className="mt-2 border-white/10 bg-[var(--surface-2)] font-mono text-sm"
                />
              </div>
            ))}
          </Card>
          <AccentButton type="button" onClick={saveSettings}>
            Save platform settings
          </AccentButton>
        </TabsContent>
      </Tabs>
    </div>
  );
}