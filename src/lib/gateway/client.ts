import { getCurrentAuthToken } from "@/context/appkit";
import {
  normalizeClient,
  normalizeLeaderboardEntry,
  normalizeNode,
  normalizeOrg,
  normalizeOrgNode,
  normalizePlan,
  normalizeProfile,
  normalizeSubscription,
} from "./normalize";
import type {
  GatewayActivity,
  GatewayAdminNode,
  GatewayAdminOrg,
  GatewayAdminStats,
  GatewayAdminUser,
  GatewayApiKey,
  GatewayLeaderboardEntry,
  GatewayNode,
  GatewayNodeMetrics,
  GatewayOperatorNode,
  GatewayFirewallRule,
  GatewayFirewallService,
  GatewayFirewallStatus,
  GatewayFirewallSyncResult,
  GatewayOrg,
  GatewayOrgEntitlements,
  GatewayOrgMember,
  GatewayOrgNode,
  GatewayOrgNodeService,
  GatewayOrgUsage,
  GatewayRegistrationTokenResult,
  GatewayPerk,
  GatewayPlan,
  GatewayPlatformSetting,
  GatewayProfile,
  GatewayRank,
  GatewayReferral,
  GatewaySocialAccount,
  GatewaySubscription,
  GatewayVpnClient,
} from "./types";

const CLIENT_HEADER = "webapp";

function gatewayBase(): string {
  if (typeof window !== "undefined") return "/api/gateway/";
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "https://gateway.erebrus.io/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  // Browser calls `/api/gateway/*`; the Next proxy prepends `api/v2/` upstream.
  const routePath = path.replace(/^api\/v2\//, "");

  const url =
    typeof window !== "undefined"
      ? new URL(routePath, `${window.location.origin}/api/gateway/`)
      : new URL(
          path.startsWith("api/") ? path : `api/v2/${path}`,
          gatewayBase()
        );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function asArray<T>(data: unknown, mapper: (r: Record<string, unknown>) => T): T[] {
  if (Array.isArray(data)) return data.map((item) => mapper(item as Record<string, unknown>));
  return [];
}

export class GatewayApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "GatewayApiError";
  }
}

async function gatewayFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined>; auth?: boolean } = {}
): Promise<T> {
  const { params, auth = true, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Erebrus-Client", CLIENT_HEADER);

  if (auth) {
    const token = getCurrentAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(buildUrl(path, params), { ...init, headers, cache: "no-store" });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: string }).error)
        : `Gateway request failed (${res.status})`;
    throw new GatewayApiError(message, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Nodes ──────────────────────────────────────────────────────────────────

export async function fetchNodes(params?: { region?: string; status?: string }): Promise<GatewayNode[]> {
  const data = await gatewayFetch<unknown>("nodes", { params, auth: false });
  return asArray(data, normalizeNode);
}

// ── VPN Clients ────────────────────────────────────────────────────────────

export async function fetchVpnClients(): Promise<GatewayVpnClient[]> {
  const data = await gatewayFetch<unknown>("vpn/clients");
  return asArray(data, normalizeClient);
}

export async function provisionVpnClient(body: {
  name: string;
  node_id: string;
  wg_public_key: string;
  wg_preshared_key?: string;
  idempotency_key?: string;
}): Promise<GatewayVpnClient> {
  const data = await gatewayFetch<Record<string, unknown>>("vpn/clients", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeClient(data);
}

export async function deleteVpnClient(id: string): Promise<void> {
  await gatewayFetch(`vpn/clients/${id}`, { method: "DELETE" });
}

export async function fetchVpnClientConfig(id: string): Promise<{ config: string }> {
  const data = await gatewayFetch<Record<string, unknown>>(`vpn/clients/${id}/config`);
  const config = (data.config ?? data.bundle ?? "") as string;
  if (typeof config === "string" && config.length > 0) return { config };
  return { config: JSON.stringify(data, null, 2) };
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export async function fetchSubscription(): Promise<GatewaySubscription> {
  const data = await gatewayFetch<Record<string, unknown>>("subscriptions");
  return normalizeSubscription(data);
}

export async function fetchPlans(): Promise<GatewayPlan[]> {
  const data = await gatewayFetch<unknown>("subscriptions/plans", { auth: false });
  return asArray(data, normalizePlan);
}

export async function startTrial(): Promise<GatewaySubscription> {
  const data = await gatewayFetch<Record<string, unknown>>("subscriptions/trial", { method: "POST" });
  return normalizeSubscription(data);
}

export async function refreshNftEntitlement(): Promise<GatewaySubscription> {
  const data = await gatewayFetch<Record<string, unknown>>("subscriptions/nft/refresh", { method: "POST" });
  return normalizeSubscription(data);
}

// ── Account ────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<GatewayProfile> {
  const data = await gatewayFetch<Record<string, unknown>>("account/profile");
  return normalizeProfile(data);
}

export async function updateProfile(body: { name: string }): Promise<GatewayProfile> {
  const data = await gatewayFetch<Record<string, unknown>>("account/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeProfile(data);
}

export async function fetchActivity(params?: {
  limit?: number;
  cursor?: string;
}): Promise<{ items: GatewayActivity[]; next_cursor?: string }> {
  const data = await gatewayFetch<{
    activity?: GatewayActivity[];
    items?: GatewayActivity[];
    next_cursor?: string;
  }>("account/activity", { params });
  return {
    items: data.activity ?? data.items ?? [],
    next_cursor: data.next_cursor,
  };
}

// ── Email ──────────────────────────────────────────────────────────────────

export async function sendEmailOtp(email: string): Promise<void> {
  await gatewayFetch("auth/email", { method: "POST", body: JSON.stringify({ email }) });
}

export async function verifyEmailOtp(email: string, code: string): Promise<void> {
  await gatewayFetch("auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

// ── Organizations ──────────────────────────────────────────────────────────

export async function fetchOrgs(): Promise<GatewayOrg[]> {
  const data = await gatewayFetch<unknown>("orgs");
  return asArray(data, normalizeOrg);
}

export async function fetchOrg(id: string): Promise<GatewayOrg> {
  const data = await gatewayFetch<Record<string, unknown>>(`orgs/${id}`);
  return normalizeOrg(data);
}

export async function createOrg(body: {
  name: string;
  slug: string;
  kind?: string;
  description?: string;
  website?: string;
}): Promise<GatewayOrg> {
  const data = await gatewayFetch<Record<string, unknown>>("orgs", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeOrg(data);
}

export async function updateOrg(
  id: string,
  body: Partial<Pick<GatewayOrg, "name" | "description" | "website">>
): Promise<GatewayOrg> {
  const data = await gatewayFetch<Record<string, unknown>>(`orgs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeOrg(data);
}

export async function fetchOrgMembers(id: string): Promise<GatewayOrgMember[]> {
  const data = await gatewayFetch<unknown>(`orgs/${id}/members`);
  return Array.isArray(data) ? (data as GatewayOrgMember[]) : [];
}

export async function addOrgMember(
  orgId: string,
  body: { wallet_address: string; chain: string; role: string }
): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/members`, { method: "POST", body: JSON.stringify(body) });
}

export async function inviteOrgMember(
  orgId: string,
  body: {
    wallet_address?: string;
    email?: string;
    chain?: string;
    role?: string;
    seat_tier?: string;
  }
): Promise<{ member?: GatewayOrgMember; status?: string; email?: string; email_sent?: boolean }> {
  return gatewayFetch(`orgs/${orgId}/members/invite`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/members/${userId}`, { method: "DELETE" });
}

export async function patchOrgMember(
  orgId: string,
  userId: string,
  role: "admin" | "member" | "node_operator"
): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function transferOrgOwnership(orgId: string, userId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/transfer-ownership`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function fetchOrgClients(orgId: string): Promise<GatewayVpnClient[]> {
  const data = await gatewayFetch<unknown>(`orgs/${orgId}/clients`);
  return asArray(data, normalizeClient);
}

export async function fetchOrgNodes(id: string): Promise<GatewayOrgNode[]> {
  const data = await gatewayFetch<unknown>(`orgs/${id}/nodes`);
  return asArray(data, normalizeOrgNode);
}

export async function fetchOrgEntitlements(id: string): Promise<GatewayOrgEntitlements> {
  return gatewayFetch(`orgs/${id}/entitlements`);
}

export async function createNodeRegistrationToken(
  orgId: string,
  body?: { ttl_hours?: number; scopes?: string[] }
): Promise<GatewayRegistrationTokenResult> {
  return gatewayFetch(`orgs/${orgId}/node-registration-tokens`, {
    method: "POST",
    body: JSON.stringify(body ?? { ttl_hours: 24 }),
  });
}

export async function fetchOrgNodeServices(
  orgId: string,
  nodeId: string
): Promise<GatewayOrgNodeService[]> {
  const data = await gatewayFetch<unknown>(`orgs/${orgId}/nodes/${nodeId}/services`);
  return Array.isArray(data) ? (data as GatewayOrgNodeService[]) : [];
}

export async function fetchFirewallService(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallService> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall`);
}

export async function fetchFirewallStatus(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallStatus> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/status`);
}

export async function fetchFirewallRules(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallRule[]> {
  const data = await gatewayFetch<unknown>(`orgs/${orgId}/nodes/${nodeId}/firewall/rules`);
  return Array.isArray(data) ? (data as GatewayFirewallRule[]) : [];
}

export async function createFirewallRule(
  orgId: string,
  nodeId: string,
  body: {
    rule_type: string;
    target: string;
    action?: string;
    scope?: string;
    enabled?: boolean;
  }
): Promise<GatewayFirewallRule> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/rules`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteFirewallRule(
  orgId: string,
  nodeId: string,
  ruleId: string
): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/rules/${ruleId}`, {
    method: "DELETE",
  });
}

export async function syncFirewall(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallSyncResult> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/sync`, { method: "POST" });
}

export async function restartFirewall(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallSyncResult> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/restart`, { method: "POST" });
}

export async function fetchOrgUsage(id: string, days = 30): Promise<GatewayOrgUsage> {
  return gatewayFetch(`orgs/${id}/usage`, { params: { days } });
}

export async function fetchOrgApiKeys(id: string): Promise<GatewayApiKey[]> {
  const data = await gatewayFetch<unknown>(`orgs/${id}/apikeys`);
  return Array.isArray(data) ? (data as GatewayApiKey[]) : [];
}

export async function createOrgApiKey(
  orgId: string,
  name?: string
): Promise<GatewayApiKey & { secret: string }> {
  return gatewayFetch(`orgs/${orgId}/apikeys`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function revokeOrgApiKey(orgId: string, keyId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/apikeys/${keyId}`, { method: "DELETE" });
}

// ── Operator ───────────────────────────────────────────────────────────────

export async function fetchOperatorNodes(): Promise<GatewayOperatorNode[]> {
  const data = await gatewayFetch<unknown>("operator/nodes");
  if (!Array.isArray(data)) return [];
  return data.map((n) => {
    const raw = n as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw.node_id ?? ""),
      did: String(raw.did ?? ""),
      region: String(raw.region ?? ""),
      name: raw.name as string | undefined,
      status: String(raw.status ?? "offline"),
      access_mode: String(raw.access_mode ?? "public"),
      org_id: raw.org_id as string | undefined,
      uptime_pct: Number(raw.uptime_pct ?? 0),
      wg_peers: Number(raw.wg_peers ?? 0),
    };
  });
}

export async function fetchOperatorNodeMetrics(
  id: string,
  params?: { range?: string; step?: string }
): Promise<GatewayNodeMetrics> {
  const data = await gatewayFetch<Record<string, unknown>>(`operator/nodes/${id}/metrics`, {
    params,
  });
  const points = (data.points ?? data.buckets) as GatewayNodeMetrics["buckets"] | undefined;
  return { buckets: points ?? [] };
}

export async function updateOperatorNode(
  id: string,
  body: { org_id?: string; access_mode?: string }
): Promise<void> {
  await gatewayFetch(`operator/nodes/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

// ── Referrals & Rank ───────────────────────────────────────────────────────

export async function fetchReferrals(): Promise<GatewayReferral> {
  return gatewayFetch("referrals/me");
}

export async function fetchRank(): Promise<GatewayRank> {
  return gatewayFetch("rank/me");
}

export async function claimRankReward(): Promise<void> {
  await gatewayFetch("rank/claim", {
    method: "POST",
    body: JSON.stringify({ reward: "free_days" }),
  });
}

export async function fetchLeaderboard(params?: {
  metric?: string;
  period?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: GatewayLeaderboardEntry[]; my_rank?: number; my_value?: number }> {
  const data = await gatewayFetch<{
    entries?: Record<string, unknown>[];
    my_rank?: number;
    my_value?: number;
  }>("leaderboard", { params });
  return {
    entries: (data.entries ?? []).map(normalizeLeaderboardEntry),
    my_rank: data.my_rank,
    my_value: data.my_value,
  };
}

// ── Perks & Social ─────────────────────────────────────────────────────────

export async function fetchPerks(): Promise<GatewayPerk[]> {
  const data = await gatewayFetch<unknown>("perks");
  return Array.isArray(data) ? (data as GatewayPerk[]) : [];
}

export async function fetchMyPerks(): Promise<GatewayPerk[]> {
  const data = await gatewayFetch<unknown>("perks/me");
  return Array.isArray(data) ? (data as GatewayPerk[]) : [];
}

export async function fetchSocialAccounts(): Promise<GatewaySocialAccount[]> {
  const data = await gatewayFetch<unknown>("social/accounts");
  return Array.isArray(data) ? (data as GatewaySocialAccount[]) : [];
}

export async function verifyTelegramAccount(
  payload: Record<string, string>
): Promise<GatewaySocialAccount> {
  return gatewayFetch("social/telegram", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyXAccount(accessToken: string): Promise<GatewaySocialAccount> {
  return gatewayFetch("social/x", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });
}

// ── Platform admin ─────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<GatewayAdminStats> {
  return gatewayFetch("admin/stats");
}

export async function fetchAdminActivity(params?: {
  cursor?: string;
  limit?: number;
}): Promise<{ activity: GatewayActivity[]; next_cursor?: string }> {
  return gatewayFetch("admin/activity", { params });
}

export async function fetchAdminUsers(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ users: GatewayAdminUser[]; limit: number; offset: number }> {
  return gatewayFetch("admin/users", { params });
}

export async function fetchAdminSubscriptions(): Promise<{
  active_by_plan: Record<string, number>;
}> {
  return gatewayFetch("admin/subscriptions");
}

export async function fetchAdminNodes(params?: {
  status?: string;
  region?: string;
}): Promise<{ online_connected: number; nodes: GatewayAdminNode[] }> {
  return gatewayFetch("admin/nodes", { params });
}

export async function fetchAdminNodeMetrics(
  id: string,
  params?: { range?: string; step?: string }
): Promise<GatewayNodeMetrics & { node_id?: string; range?: string; step?: string; points?: GatewayNodeMetrics["buckets"] }> {
  const data = await gatewayFetch<Record<string, unknown>>(`admin/nodes/${id}/metrics`, { params });
  const points = (data.points ?? data.buckets) as GatewayNodeMetrics["buckets"] | undefined;
  return { ...data, buckets: points ?? [], points };
}

export async function fetchAdminOrgs(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ orgs: GatewayAdminOrg[]; limit: number; offset: number }> {
  return gatewayFetch("admin/orgs", { params });
}

export async function patchAdminOrg(id: string, verified: boolean): Promise<void> {
  await gatewayFetch(`admin/orgs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  });
}

export async function fetchAdminOrgUsage(
  orgId: string,
  days = 30
): Promise<GatewayOrgUsage> {
  return gatewayFetch(`admin/orgs/${orgId}/usage`, { params: { days } });
}

export async function fetchAdminSettings(): Promise<{ settings: GatewayPlatformSetting[] }> {
  return gatewayFetch("admin/settings");
}

export async function patchAdminSettings(
  settings: Record<string, string>
): Promise<void> {
  await gatewayFetch("admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings }),
  });
}

export async function upsertAdminPerk(body: {
  id: string;
  name: string;
  type: "nft" | "xp" | "free_days" | "node_pool";
  min_tier?: number;
  meta?: Record<string, unknown>;
  is_active?: boolean;
}): Promise<void> {
  await gatewayFetch("admin/perks", { method: "POST", body: JSON.stringify(body) });
}

export async function grantAdminPerk(
  perkId: string,
  target: { user_id?: string; wallet?: string }
): Promise<void> {
  await gatewayFetch(`admin/perks/${perkId}/grant`, {
    method: "POST",
    body: JSON.stringify(target),
  });
}