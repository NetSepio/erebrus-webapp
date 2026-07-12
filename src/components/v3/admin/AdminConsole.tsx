"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminActivity,
  fetchAdminDeletionRequests,
  fetchAdminNodeMetrics,
  fetchAdminNodes,
  fetchAdminOrgUsage,
  fetchAdminOrgs,
  fetchAdminSettings,
  fetchAdminStats,
  fetchAdminSubscriptions,
  fetchAdminUsers,
  fulfillAdminDeletionRequest,
  grantAdminPerk,
  patchAdminOrg,
  setAdminOrgPlan,
  patchAdminSettings,
  GatewayApiError,
} from "@/lib/gateway/client";
import type {
  GatewayActivity,
  GatewayAdminNode,
  GatewayAdminOrg,
  GatewayAdminStats,
  GatewayAdminUser,
  GatewayDeletionRequest,
  GatewayPlatformSetting,
} from "@/lib/gateway/types";
import { AdminUserProfile } from "./AdminUserProfile";
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

// Org plans the platform admin can assign manually (self-serve upgrades land
// with payments later). Mirrors the gateway's normalizeOrgPlan whitelist.
const ORG_PLANS = ["basic", "starter", "pro", "business", "enterprise"] as const;

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
  const [orgSearch, setOrgSearch] = useState("");
  const [orgOffset, setOrgOffset] = useState(0);
  const [orgHasMore, setOrgHasMore] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<GatewayDeletionRequest[]>([]);
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

  const loadOrgs = useCallback(async (offset = 0, append = false) => {
    const data = await fetchAdminOrgs({ limit: 50, offset });
    setOrgs((prev) => (append ? [...prev, ...data.orgs] : data.orgs));
    setOrgOffset(offset);
    setOrgHasMore(data.orgs.length === 50);
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

  const loadDeletionRequests = useCallback(async () => {
    const data = await fetchAdminDeletionRequests({ status: "pending" });
    setDeletionRequests(data.requests);
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
        if (tab === "deletion-requests") await loadDeletionRequests();
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

  const verifyOrg = async (id: string, verified: boolean) => {
    try {
      await patchAdminOrg(id, verified);
      toast.success(verified ? "Org verified" : "Org unverified");
      loadOrgs();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to update org");
    }
  };

  const assignOrgPlan = async (id: string, plan: string) => {
    try {
      await setAdminOrgPlan(id, plan);
      toast.success(`Plan set to ${plan}`);
      loadOrgs();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to set plan");
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

  const orgSearchNorm = orgSearch.trim().toLowerCase();
  const filteredOrgs = useMemo(() => {
    if (!orgSearchNorm) return orgs;
    return orgs.filter((o) => {
      const name = o.name?.toLowerCase() ?? "";
      const slug = o.slug?.toLowerCase() ?? "";
      const id = o.id?.toLowerCase() ?? "";
      return (
        name.includes(orgSearchNorm) ||
        slug.includes(orgSearchNorm) ||
        id.includes(orgSearchNorm)
      );
    });
  }, [orgSearchNorm, orgs]);

  const selectedOrg =
    filteredOrgs.find((o) => o.id === selectedOrgId) ??
    (filteredOrgs.length === 1 ? filteredOrgs[0] : null);

  if (loading) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading admin console…</div>;
  }

  const onlineNodes =
    stats?.nodes.by_status?.online ?? stats?.nodes.connected ?? 0;

  const showOrgUsage = async (orgId: string) => {
    try {
      const u = await fetchAdminOrgUsage(orgId);
      toast.success(
        `30d: ${u.clients ?? u.vpn_clients ?? 0} clients · ${u.api_calls ?? 0} API calls · ${formatBytes(u.bandwidth_total ?? 0)} bandwidth`
      );
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Usage lookup failed");
    }
  };

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
          <TabsTrigger value="deletion-requests" className={v3TabsTriggerClass}>
            Deletion requests
          </TabsTrigger>
          <TabsTrigger value="settings" className={v3TabsTriggerClass}>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-3">
          <Card className="overflow-hidden">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSelectedUserId(u.id);
                  setProfileOpen(true);
                }}
                className="flex w-full flex-col gap-1 border-b border-white/[0.04] px-5 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
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
                    {u.deleted_at ? " · deleted" : ""}
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
              </button>
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
            <Label htmlFor="org-search">Find organization</Label>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              Search by name, slug, or id — then verify status or assign a plan.
            </p>
            <Input
              id="org-search"
              value={orgSearch}
              onChange={(e) => {
                setOrgSearch(e.target.value);
                setSelectedOrgId(null);
              }}
              placeholder="e.g. Acme Corp"
              className="mt-3 border-white/10 bg-[var(--surface-2)]"
            />
            {orgSearchNorm && (
              <p className="mt-2 font-mono text-[11px] text-[var(--text-3)]">
                {filteredOrgs.length} match{filteredOrgs.length === 1 ? "" : "es"}
                {filteredOrgs.length === 0 && orgHasMore
                  ? " — load more orgs below if yours is not listed"
                  : ""}
              </p>
            )}
          </Card>

          {selectedOrg?.id && (
            <Card className="space-y-4 p-5">
              <div>
                <div className="font-semibold">{selectedOrg.name}</div>
                <div className="mt-1 font-mono text-[11px] text-[var(--text-3)]">
                  {selectedOrg.id}
                  {selectedOrg.slug ? ` · ${selectedOrg.slug}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedOrg.plan ?? "basic"}
                  onChange={(e) => assignOrgPlan(selectedOrg.id!, e.target.value)}
                  className="rounded-md border border-white/10 bg-[var(--surface-2)] px-2 py-1.5 text-xs capitalize text-[var(--text)]"
                  aria-label={`Plan for ${selectedOrg.name}`}
                >
                  {ORG_PLANS.map((p) => (
                    <option key={p} value={p} className="capitalize">
                      {p}
                    </option>
                  ))}
                </select>
                <AccentButton
                  type="button"
                  variant="ghost"
                  onClick={() => verifyOrg(selectedOrg.id!, !selectedOrg.verified)}
                >
                  {selectedOrg.verified ? "Unverify" : "Verify"}
                </AccentButton>
                <AccentButton
                  type="button"
                  variant="ghost"
                  onClick={() => showOrgUsage(selectedOrg.id!)}
                >
                  30d usage
                </AccentButton>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            {filteredOrgs.map((o, i) => (
              <button
                key={o.id ?? `${o.name}-${i}`}
                type="button"
                onClick={() => o.id && setSelectedOrgId(o.id)}
                className={`flex w-full flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                  o.id && selectedOrgId === o.id ? "bg-[var(--accent)]/8" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-xs text-[var(--text-3)]">
                    <span className="uppercase text-[var(--accent-hi)]">{o.plan ?? o.kind}</span>
                    {o.slug ? ` · ${o.slug}` : ""}
                    {o.id ? (
                      <span className="ml-1 font-mono text-[10px]">· {o.id.slice(0, 8)}…</span>
                    ) : null}
                  </div>
                </div>
                {o.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={o.plan ?? "basic"}
                      onChange={(e) => assignOrgPlan(o.id!, e.target.value)}
                      className="rounded-md border border-white/10 bg-[var(--surface-2)] px-2 py-1 text-xs capitalize text-[var(--text)]"
                      aria-label={`Plan for ${o.name}`}
                    >
                      {ORG_PLANS.map((p) => (
                        <option key={p} value={p} className="capitalize">
                          {p}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => verifyOrg(o.id!, !o.verified)}
                      title={o.verified ? "Click to unverify" : "Click to verify"}
                      className={`rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase ${
                        o.verified
                          ? "border-[var(--success)]/40 text-[var(--success)]"
                          : "border-white/10 text-[var(--text-3)] hover:bg-white/[0.04]"
                      }`}
                    >
                      {o.verified ? "Verified" : "Unverified"}
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      o.verified ? "text-[var(--success)]" : "text-[var(--text-3)]"
                    }`}
                  >
                    {o.verified ? "Verified" : "Unverified"}
                  </span>
                )}
              </button>
            ))}
            {filteredOrgs.length === 0 && (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">
                {orgSearchNorm ? "No organizations match that search." : "No organizations loaded."}
              </p>
            )}
          </Card>
          <div className="flex gap-2">
            <AccentButton
              type="button"
              variant="ghost"
              disabled={orgOffset === 0}
              onClick={() => loadOrgs(Math.max(0, orgOffset - 50))}
            >
              Previous
            </AccentButton>
            <AccentButton
              type="button"
              variant="ghost"
              disabled={!orgHasMore}
              onClick={() => loadOrgs(orgOffset + 50, true)}
            >
              Load more orgs
            </AccentButton>
          </div>
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries({ ...stats?.subscriptions.by_plan, ...subs }).map(([plan, count]) => (
              <StatCard key={plan} label={plan} value={count ?? 0} sub="legacy subscription rows" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <span className="font-semibold">Fleet audit log</span>
              <span className="font-mono text-[11px] text-[var(--text-3)]">
                All users · actor wallet shown
              </span>
            </div>
            {activity.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No platform activity yet.</p>
            ) : (
              activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3.5 border-b border-white/[0.04] px-5 py-3.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[var(--accent)]/10 font-mono text-sm text-[var(--accent-hi)]">
                    ◎
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{a.action}</span>
                      <span className="font-mono text-[10px] text-[var(--text-3)]">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[var(--text-3)]">
                      {[
                        a.wallet ? `actor ${a.wallet}` : a.user_id ? `user ${a.user_id.slice(0, 8)}…` : null,
                        a.target ? `target ${a.target}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--text-3)]">
                      {[a.ip, a.device, a.app].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))
            )}
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

        <TabsContent value="deletion-requests" className="mt-4 space-y-3">
          <Card className="overflow-hidden">
            {deletionRequests.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No pending deletion requests.</p>
            ) : (
              deletionRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-mono text-sm">
                      {r.wallet_address ? truncateAddress(r.wallet_address) : r.user_id?.slice(0, 8) ?? "—"}
                    </div>
                    <div className="text-xs text-[var(--text-3)]">
                      {r.name || r.email || "—"} · requested {new Date(r.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ActionButton
                    variant="danger"
                    onClick={async () => {
                      if (!window.confirm("This will permanently delete the user account and any owned orgs. Continue?")) return;
                      try {
                        await fulfillAdminDeletionRequest(r.id);
                        toast.success("Account deleted and confirmation email sent");
                        await loadDeletionRequests();
                        loadUsers();
                      } catch (e) {
                        toast.error(e instanceof GatewayApiError ? e.message : "Failed to fulfill request");
                      }
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              ))
            )}
          </Card>
          <AccentButton type="button" variant="ghost" onClick={loadDeletionRequests}>
            Refresh
          </AccentButton>
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

      <AdminUserProfile
        userId={selectedUserId}
        open={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (!open) setSelectedUserId(null);
        }}
        onChanged={() => {
          loadUsers();
          loadDeletionRequests();
        }}
      />
    </div>
  );
}