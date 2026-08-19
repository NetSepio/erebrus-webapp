import { getCurrentAuthToken } from "@/context/appkit";
import { computeOrgStats } from "./org-stats";
import {
  normalizeActivity,
  normalizeClient,
  normalizeLeaderboardEntry,
  normalizeNode,
  normalizeOrg,
  normalizeOrgNode,
  normalizeProfile,
} from "./normalize";
import type {
  GatewayActivity,
  GatewayAdminNode,
  GatewayAdminOrg,
  GatewayAdminStats,
  GatewayAdminUser,
  GatewayAdminUserProfile,
  GatewayApiKey,
  GatewayDeletionRequest,
  GatewayLeaderboardEntry,
  GatewayNode,
  GatewayNodeMetrics,
  GatewayOperatorNode,
  GatewayFirewallRule,
  GatewayFirewallService,
  GatewayFirewallStatus,
  GatewayFirewallSyncResult,
  GatewayOrg,
  GatewayOrgProfile,
  GatewayOrgEntitlements,
  GatewayOrgMember,
  GatewayOrgInvite,
  GatewayOrgInvitePreview,
  GatewayPublicOrgProfile,
  GatewayOrgNode,
  GatewayOrgNodeService,
  GatewayOrgUsage,
  GatewayRegistrationTokenResult,
  GatewayPerk,
  GatewayPlatformSetting,
  GatewayProfile,
  GatewayUserOrgInvite,
  GatewayRank,
  GatewayReferral,
  GatewaySocialAccount,
  GatewayVpnClient,
  GenesisSeason,
  GenesisLeaderboardEntry,
  RewardCapacitySlot,
  OperatorRewardSummary,
  XpLedgerEntry,
  ClaimPreview,
  RewardWithdrawal,
  AdminRewardsSummary,
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
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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

// Both POST /vpn/clients and GET /vpn/clients/:id/config return the node's
// credential bundle: { id, wireguard: { client_conf, ... }, transports, ... }.
// The WireGuard conf (with a REPLACE_WITH_PRIVATE_KEY placeholder) lives at
// wireguard.client_conf.
function bundleWgConfig(data: Record<string, unknown>): string | null {
  const wg = data.wireguard as Record<string, unknown> | undefined;
  const conf = wg?.client_conf ?? data.config ?? data.bundle;
  return typeof conf === "string" && conf.length > 0 ? conf : null;
}

export async function provisionVpnClient(body: {
  name: string;
  node_id: string;
  wg_public_key: string;
  wg_preshared_key?: string;
  idempotency_key?: string;
}): Promise<{ client: GatewayVpnClient; wgConfig: string | null; bundle: Record<string, unknown> }> {
  const data = await gatewayFetch<Record<string, unknown>>("vpn/clients", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { client: normalizeClient(data), wgConfig: bundleWgConfig(data), bundle: data };
}

export async function deleteVpnClient(id: string): Promise<void> {
  await gatewayFetch(`vpn/clients/${id}`, { method: "DELETE" });
}

export async function fetchVpnClientConfig(id: string): Promise<{ config: string; bundle: Record<string, unknown> }> {
  const data = await gatewayFetch<Record<string, unknown>>(`vpn/clients/${id}/config`);
  const config = bundleWgConfig(data);
  if (!config) throw new Error("Credential bundle has no WireGuard config");
  return { config, bundle: data };
}

// ── Account ────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<GatewayProfile> {
  const data = await gatewayFetch<Record<string, unknown>>("account/profile");
  return normalizeProfile(data);
}

export async function updateProfile(body: {
  name?: string;
  /** Bare IPFS CID of the uploaded profile image. */
  profile_picture?: string;
}): Promise<GatewayProfile> {
  const data = await gatewayFetch<Record<string, unknown>>("account/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeProfile(data);
}

export async function fetchAccountOrgInvites(): Promise<GatewayUserOrgInvite[]> {
  const data = await gatewayFetch<unknown>("account/org-invites");
  return Array.isArray(data) ? (data as GatewayUserOrgInvite[]) : [];
}

export async function fetchAccountOrgInvite(orgId: string): Promise<GatewayUserOrgInvite> {
  return gatewayFetch(`account/org-invites/${orgId}`);
}

export async function acceptAccountOrgInvite(orgId: string): Promise<void> {
  await gatewayFetch(`account/org-invites/${orgId}/accept`, { method: "POST" });
}

export async function declineAccountOrgInvite(orgId: string): Promise<void> {
  await gatewayFetch(`account/org-invites/${orgId}/decline`, { method: "POST" });
}

export async function fetchActivity(params?: {
  limit?: number;
  cursor?: string;
}): Promise<{ items: GatewayActivity[]; next_cursor?: string }> {
  const data = await gatewayFetch<{
    activity?: Record<string, unknown>[];
    items?: Record<string, unknown>[];
    next_cursor?: string;
  }>("account/activity", { params });
  const rows = data.activity ?? data.items ?? [];
  return {
    items: rows.map((row) => normalizeActivity(row)),
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
  body: {
    name?: string;
    slug?: string;
    public_profile_enabled?: boolean;
  }
): Promise<GatewayOrg> {
  const data = await gatewayFetch<Record<string, unknown>>(`orgs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeOrg(data);
}

export async function fetchOrgProfile(id: string): Promise<GatewayOrgProfile> {
  const data = await gatewayFetch<Record<string, unknown>>(`orgs/${id}/profile`);
  return {
    org_id: String(data.org_id ?? id),
    legal_name: data.legal_name as string | undefined,
    display_name: data.display_name as string | undefined,
    description: data.description as string | undefined,
    logo_url: data.logo_url as string | undefined,
    website_url: data.website_url as string | undefined,
    public_email: data.public_email as string | undefined,
    billing_email: data.billing_email as string | undefined,
    support_email: data.support_email as string | undefined,
    country: data.country as string | undefined,
    timezone: data.timezone as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
}

export async function updateOrgProfile(
  id: string,
  body: Partial<
    Pick<
      GatewayOrgProfile,
      | "legal_name"
      | "display_name"
      | "description"
      | "logo_url"
      | "website_url"
      | "public_email"
      | "billing_email"
      | "support_email"
      | "country"
      | "timezone"
    >
  >
): Promise<GatewayOrgProfile> {
  await gatewayFetch(`orgs/${id}/profile`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return fetchOrgProfile(id);
}

export async function fetchOrgMembers(id: string): Promise<GatewayOrgMember[]> {
  const data = await gatewayFetch<unknown>(`orgs/${id}/members`);
  return Array.isArray(data) ? (data as GatewayOrgMember[]) : [];
}

export async function fetchOrgInvites(id: string): Promise<GatewayOrgInvite[]> {
  const data = await gatewayFetch<unknown>(`orgs/${id}/invites`);
  return Array.isArray(data) ? (data as GatewayOrgInvite[]) : [];
}

export async function revokeOrgInvite(orgId: string, inviteId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/invites/${inviteId}`, { method: "DELETE" });
}

export async function fetchPublicOrgProfile(slug: string): Promise<GatewayPublicOrgProfile> {
  return gatewayFetch(`public/orgs/${encodeURIComponent(slug)}`, { auth: false });
}

export async function fetchOrgInvitePreview(slug: string): Promise<GatewayOrgInvitePreview> {
  return gatewayFetch(`public/orgs/${encodeURIComponent(slug)}/invite`, { auth: false });
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
  role: "member" | "node_operator"
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

export async function deleteOrg(orgId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}`, { method: "DELETE" });
}

// Assigning a paid seat grants the member VPN entitlement + manager (admin) role;
// revoking removes both. Seats are capped by the org plan's paid_seats_included.
export async function assignOrgSeat(orgId: string, userId: string, seatTier: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/seats/assign`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, seat_tier: seatTier }),
  });
}

export async function revokeOrgSeat(orgId: string, userId: string): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/seats/revoke`, {
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

async function enrichOrgWithStats(org: GatewayOrg): Promise<GatewayOrg> {
  if (!org.id) return org;
  if (
    org.member_count != null &&
    org.node_count != null &&
    org.online_nodes != null
  ) {
    return org;
  }

  const [members, nodes] = await Promise.all([
    fetchOrgMembers(org.id).catch(() => []),
    fetchOrgNodes(org.id).catch(() => []),
  ]);

  return { ...org, ...computeOrgStats(members, nodes) };
}

/** Org list with member/node counts (gateway list omits aggregates). */
export async function fetchOrgsWithStats(): Promise<GatewayOrg[]> {
  const orgs = await fetchOrgs();
  if (orgs.length === 0) return [];
  return Promise.all(orgs.map(enrichOrgWithStats));
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

export interface GatewayFirewallCredentials {
  node_id: string;
  admin_user: string;
  admin_password: string;
  admin_url?: string;
  updated_at?: string;
}

/** Reveal a Shield node's AdGuard admin login (org paid seats only). */
export async function fetchFirewallCredentials(
  orgId: string,
  nodeId: string
): Promise<GatewayFirewallCredentials> {
  return gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/credentials`);
}

/** Rotate the AdGuard admin password (org paid seats only). */
export async function updateFirewallCredentials(
  orgId: string,
  nodeId: string,
  adminPassword: string
): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/nodes/${nodeId}/firewall/credentials`, {
    method: "POST",
    body: JSON.stringify({ admin_password: adminPassword }),
  });
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

/**
 * Org-scoped VPN nodes for the connect flow: every node across the orgs the
 * caller belongs to (incl. private), normalized into full `GatewayNode`s (geo
 * is derived from region/zone, so they place on the globe like public nodes).
 */
export async function fetchOrgVpnNodes(): Promise<GatewayNode[]> {
  const data = await gatewayFetch<unknown>("operator/nodes");
  return asArray(data, normalizeNode);
}

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

/** Applies an invite code to the signed-in account (one referrer, ever). */
export async function redeemReferralCode(code: string): Promise<GatewayReferral> {
  return gatewayFetch("referrals/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
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

// ── Genesis Season rewards ─────────────────────────────────────────────────────────────────

type RawRewardSeason = {
  id: string; name: string; status: string; start_at?: string; end_at?: string;
  xp_multiplier: number; min_payout_usdc: number; total_budget_usdc: number;
  vpn_envelope_usdc: number; ai_envelope_usdc: number; reserve_usdc: number;
  spent_usdc: number; reserved_usdc: number; payouts_paused?: boolean;
};

type RawRewardWithdrawal = {
  id: string; created_at: string; amount_usdc: number; reserved_xp: number;
  payout_address: string; status: string; admin_reason?: string;
  payout_attempt?: { signature?: string; status?: string };
};

function formatUSDCBaseUnits(value: number | string): string {
  const units = Number(value);
  if (!Number.isSafeInteger(units) || units < 0) throw new Error("Gateway returned an invalid USDC base-unit value");
  const whole = Math.floor(units / 1_000_000);
  let fraction = (units % 1_000_000).toString().padStart(6, "0");
  while (fraction.length > 2 && fraction.endsWith("0")) fraction = fraction.slice(0, -1);
  return `${whole}.${fraction}`;
}

function formatSOLBaseUnits(value: number | string): string {
  const lamports = Number(value);
  if (!Number.isSafeInteger(lamports) || lamports < 0) throw new Error("Gateway returned an invalid SOL base-unit value");
  const whole = Math.floor(lamports / 1_000_000_000);
  let fraction = (lamports % 1_000_000_000).toString().padStart(9, "0");
  while (fraction.length > 4 && fraction.endsWith("0")) fraction = fraction.slice(0, -1);
  return `${whole}.${fraction}`;
}

function normalizeGenesisSeason(raw: RawRewardSeason): GenesisSeason {
  const remaining = raw.total_budget_usdc - raw.spent_usdc - raw.reserved_usdc;
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    starts_at: raw.start_at,
    ends_at: raw.end_at,
    duration_weeks: raw.start_at && raw.end_at
      ? Math.max(1, Math.ceil((Date.parse(raw.end_at) - Date.parse(raw.start_at)) / (7 * 24 * 60 * 60 * 1000)))
      : undefined,
    xp_multiplier: String(raw.xp_multiplier),
    total_budget_usdc: formatUSDCBaseUnits(raw.total_budget_usdc),
    spent_usdc: formatUSDCBaseUnits(raw.spent_usdc),
    reserved_usdc: formatUSDCBaseUnits(raw.reserved_usdc),
    remaining_usdc: formatUSDCBaseUnits(Math.max(0, remaining)),
    payouts_paused: raw.payouts_paused,
    buckets: [
      { key: "vpn", label: "VPN capacity", allocation_usdc: formatUSDCBaseUnits(raw.vpn_envelope_usdc), allocation_percent: "55" },
      { key: "ai", label: "AI capacity", allocation_usdc: formatUSDCBaseUnits(raw.ai_envelope_usdc), allocation_percent: "40" },
      { key: "reserve", label: "Season reserve", allocation_usdc: formatUSDCBaseUnits(raw.reserve_usdc), allocation_percent: "5" },
    ],
  };
}

function normalizeRewardWithdrawal(raw: RawRewardWithdrawal): RewardWithdrawal {
  const status = raw.status.toLowerCase();
  return {
    id: raw.id,
    created_at: raw.created_at,
    amount_usdc: formatUSDCBaseUnits(raw.amount_usdc),
    xp_amount: raw.reserved_xp,
    payout_wallet: raw.payout_address,
    status: raw.status,
    rejection_reason: status === "rejected" ? raw.admin_reason : undefined,
    transaction_signature: raw.payout_attempt?.signature,
    retryable: status === "failed",
    reservation_released: status === "rejected",
  };
}

export async function fetchCurrentGenesisSeason(): Promise<GenesisSeason | null> {
  const raw = await gatewayFetch<RawRewardSeason & { active?: boolean }>("rewards/seasons/current", { auth: false });
  return raw.active === false ? null : normalizeGenesisSeason(raw);
}

export async function fetchGenesisLeaderboard(params?: {
  kind?: "overall" | "vpn" | "ai";
  season_id?: string;
  limit?: number;
}): Promise<{ entries: GenesisLeaderboardEntry[] }> {
  const data = await gatewayFetch<{ entries?: Array<{ rank: number; wallet: string; contribution_xp: number }> }>(
    "rewards/leaderboard", { params, auth: false }
  );
  return { entries: (data.entries ?? []).map((row) => ({
    rank: row.rank,
    display_name: row.wallet,
    contribution_xp: row.contribution_xp,
    active_eligible_nodes: 0,
    contribution_types: params?.kind && params.kind !== "overall" ? [params.kind] : [],
  })) };
}

export async function fetchRewardCapacity(params?: {
  kind?: "vpn" | "ai";
  status?: string;
}): Promise<{ slots: RewardCapacitySlot[] }> {
  const [slotData, modelData] = await Promise.all([
    gatewayFetch<{ slots?: Array<{ id: string; slot_type: string; country?: string; city?: string; model_request_id?: string; demand_state: string; state: string; reserved_until?: string }> }>(
      "rewards/slots", { params: { slot_type: params?.kind === "vpn" ? "vpn" : undefined, state: params?.status }, auth: false }
    ),
    gatewayFetch<{ model_requests?: Array<{ id: string; family: string; checkpoint_id: string; quantization?: string; persistent: boolean; target_slots: number }> }>(
      "rewards/model-requests", { auth: false }
    ),
  ]);
  const models = new Map((modelData.model_requests ?? []).map((model) => [model.id, model]));
  return { slots: (slotData.slots ?? []).map((raw): RewardCapacitySlot => {
    const model = raw.model_request_id ? models.get(raw.model_request_id) : undefined;
    const kind = raw.slot_type === "vpn" ? "vpn" : "ai";
    return {
      id: raw.id,
      kind,
      status: raw.state,
      demand_label: raw.demand_state,
      city: raw.city,
      country: raw.country,
      model_family: model?.family,
      checkpoint: model?.checkpoint_id,
      quantization: model?.quantization,
      mode: raw.slot_type === "ai_persistent" ? "persistent" : raw.slot_type === "ai_opportunistic" ? "opportunistic" : undefined,
      slots_requested: model?.target_slots,
      slots_available: raw.state === "open" ? 1 : 0,
      reservation_expires_at: raw.reserved_until,
      reservable: raw.state === "open",
    };
  }).filter((slot) => !params?.kind || slot.kind === params.kind) };
}

export async function reserveRewardCapacity(id: string): Promise<RewardCapacitySlot> {
  const result = await gatewayFetch<{ status: string }>(`rewards/slots/${id}/reserve`, { method: "POST" });
  return { id, kind: "vpn", status: result.status, demand_label: "normal", reservable: false };
}

export async function fetchOperatorRewardSummary(): Promise<OperatorRewardSummary> {
  const [raw, season, history, nodeData] = await Promise.all([
    gatewayFetch<{ season_id: string; verified_solana_wallet?: string; contribution_xp: number; retained_xp: number; reserved_xp: number; claimable_usdc: number; spent_usdc: number }>("rewards/me"),
    gatewayFetch<RawRewardSeason>("rewards/seasons/current", { auth: false }),
    fetchRewardWithdrawals(),
    gatewayFetch<{ nodes?: Array<{ node_id: string; node_type: string; slot_status: string; contribution_xp: number; cash_entitlement_usdc: number; average_quality_score: number }> }>("rewards/me/nodes"),
  ]);
  const nodes = (nodeData.nodes ?? []).map((node): import("./types").OperatorRewardNode => ({
    id: node.node_id,
    name: node.node_id,
    kind: node.node_type === "vpn" ? "vpn" : "ai",
    slot_status: node.slot_status,
    quality_band: node.average_quality_score >= 0.9 ? "excellent" : node.average_quality_score >= 0.75 ? "good" : node.average_quality_score > 0 ? "needs attention" : undefined,
    contribution_xp: node.contribution_xp,
    retained_xp: 0,
    claimable_usdc: formatUSDCBaseUnits(node.cash_entitlement_usdc),
  }));
  return {
    season_id: raw.season_id,
    contribution_xp: raw.contribution_xp,
    retained_xp: raw.retained_xp,
    reserved_xp: raw.reserved_xp,
    claimable_usdc: formatUSDCBaseUnits(raw.claimable_usdc),
    claimed_usdc: formatUSDCBaseUnits(raw.spent_usdc),
    minimum_claim_usdc: formatUSDCBaseUnits(season.min_payout_usdc),
    verified_solana_wallet: raw.verified_solana_wallet || undefined,
    conflicting_withdrawal: history.withdrawals.some((row) => ["pending", "approved", "processing", "failed"].includes(row.status.toLowerCase())),
    payouts_paused: season.payouts_paused,
    active_nodes: nodes.filter((node) => node.slot_status === "active").length,
    standby_nodes: nodes.filter((node) => node.slot_status === "standby" || node.slot_status === "settled").length,
    probation_nodes: nodes.filter((node) => node.slot_status === "probation").length,
    nodes,
  };
}

export async function fetchXpLedger(): Promise<{ entries: XpLedgerEntry[] }> {
  const data = await gatewayFetch<{ entries?: Array<{ id: string; created_at: string; event_type: string; points: number; reason?: string }> }>("rewards/me/ledger");
  return { entries: (data.entries ?? []).map((entry) => {
    const cashEvent = ["payout_reserve", "payout_release", "payout_deduct"].includes(entry.event_type);
    return {
      id: entry.id,
      created_at: entry.created_at,
      label: entry.reason || entry.event_type.replaceAll("_", " "),
      kind: entry.event_type,
      contribution_xp_delta: cashEvent ? 0 : entry.points,
      retained_xp_delta: entry.event_type === "payout_deduct" || !cashEvent ? entry.points : 0,
    };
  }) };
}

export async function previewRewardClaim(amountUsdc: string): Promise<ClaimPreview> {
  const raw = await gatewayFetch<{ amount_usdc: number; xp_to_reserve: number; projected_retained_xp: number; payout_wallet: string; network: string; token: string }>("rewards/withdrawals/preview", {
    method: "POST",
    body: JSON.stringify({ amount_usdc: amountUsdc }),
  });
  return { ...raw, amount_usdc: formatUSDCBaseUnits(raw.amount_usdc) } as ClaimPreview;
}

export async function fetchRewardWithdrawals(): Promise<{ withdrawals: RewardWithdrawal[] }> {
  const data = await gatewayFetch<{ withdrawals?: RawRewardWithdrawal[] }>("rewards/me/withdrawals");
  return { withdrawals: (data.withdrawals ?? []).map(normalizeRewardWithdrawal) };
}

export async function createRewardWithdrawal(
  amountUsdc: string,
  idempotencyKey: string,
  payoutAddress: string
): Promise<RewardWithdrawal> {
  const raw = await gatewayFetch<{ withdrawal_id: string; amount_usdc: number; reserved_xp: number; status: string }>("rewards/withdrawals", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ amount_usdc: amountUsdc, payout_address: payoutAddress, idempotency_key: idempotencyKey }),
  });
  return normalizeRewardWithdrawal({ id: raw.withdrawal_id, created_at: new Date().toISOString(), amount_usdc: raw.amount_usdc, reserved_xp: raw.reserved_xp, payout_address: payoutAddress, status: raw.status });
}

export async function fetchAdminRewardsSummary(): Promise<AdminRewardsSummary> {
  const [season, stats, treasury] = await Promise.all([
    fetchCurrentGenesisSeason(),
    gatewayFetch<{ payouts_paused: boolean }>("admin/rewards/seasons/stats"),
    gatewayFetch<{ treasury_address?: string; usdc_balance: number; sol_balance_lamports: number }>("admin/rewards/treasury"),
  ]);
  if (!season) throw new GatewayApiError("No active reward season", 404);
  return { season, treasury_address: treasury.treasury_address, treasury_usdc_balance: formatUSDCBaseUnits(treasury.usdc_balance), treasury_sol_balance: formatSOLBaseUnits(treasury.sol_balance_lamports), rewards_paused: stats.payouts_paused };
}

export async function fetchAdminRewardWithdrawals(params?: {
  status?: string;
}): Promise<{ withdrawals: RewardWithdrawal[] }> {
  const data = await gatewayFetch<{ withdrawals?: RawRewardWithdrawal[] }>("admin/rewards/withdrawals", { params });
  return { withdrawals: (data.withdrawals ?? []).map(normalizeRewardWithdrawal) };
}

export async function approveRewardWithdrawal(id: string): Promise<RewardWithdrawal> {
  const result = await gatewayFetch<{ status: string }>(`admin/rewards/withdrawals/${id}/approve`, { method: "POST" });
  return normalizeRewardWithdrawal({ id, created_at: new Date().toISOString(), amount_usdc: 0, reserved_xp: 0, payout_address: "", status: result.status });
}

export async function rejectRewardWithdrawal(id: string, reason: string): Promise<RewardWithdrawal> {
  const result = await gatewayFetch<{ status: string }>(`admin/rewards/withdrawals/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return { ...normalizeRewardWithdrawal({ id, created_at: new Date().toISOString(), amount_usdc: 0, reserved_xp: 0, payout_address: "", status: result.status, admin_reason: reason }), rejection_reason: reason };
}

export async function retryRewardWithdrawal(id: string): Promise<RewardWithdrawal> {
  return approveRewardWithdrawal(id);
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
  const data = await gatewayFetch<{
    activity?: Record<string, unknown>[];
    next_cursor?: string;
  }>("admin/activity", { params });
  return {
    activity: (data.activity ?? []).map((row) => normalizeActivity(row)),
    next_cursor: data.next_cursor,
  };
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
  const data = await gatewayFetch<{
    orgs?: Record<string, unknown>[];
    limit?: number;
    offset?: number;
  }>("admin/orgs", { params });
  const orgs = (data.orgs ?? []).map((raw): GatewayAdminOrg => {
    const o = normalizeOrg(raw);
    return {
      id: o.id || undefined,
      name: o.name,
      kind: o.kind,
      plan: o.plan,
      verified: o.verified,
      slug: o.slug,
      description: o.description,
      website: o.website,
      created_at: o.created_at,
      updated_at: o.updated_at,
    };
  });
  return { orgs, limit: data.limit ?? 0, offset: data.offset ?? 0 };
}

export async function patchAdminOrg(id: string, verified: boolean): Promise<void> {
  await gatewayFetch(`admin/orgs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ verification_status: verified ? "verified" : "unverified" }),
  });
}

export async function setAdminOrgPlan(id: string, plan: string): Promise<void> {
  await gatewayFetch(`admin/orgs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
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

export async function requestAccountDeletion(): Promise<{ message: string }> {
  return gatewayFetch("account/deletion-request", { method: "POST" });
}

export async function fetchAdminUser(id: string): Promise<GatewayAdminUserProfile> {
  return gatewayFetch(`admin/users/${id}`);
}

export async function fetchAdminUserOrgs(id: string): Promise<GatewayAdminOrg[]> {
  const data = await gatewayFetch<{ orgs?: Record<string, unknown>[] }>(`admin/users/${id}/orgs`);
  return (data.orgs ?? []).map((raw) => {
    const o = normalizeOrg(raw);
    return {
      id: o.id || undefined,
      name: o.name,
      kind: o.kind,
      plan: o.plan,
      verified: o.verified,
      slug: o.slug,
      description: o.description,
      website: o.website,
      created_at: o.created_at,
      updated_at: o.updated_at,
    };
  });
}

export async function setAdminUserPlan(id: string, planId: string): Promise<void> {
  await gatewayFetch(`admin/users/${id}/plan`, {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function fetchAdminDeletionRequests(params?: {
  status?: "pending" | "fulfilled";
}): Promise<{ requests: GatewayDeletionRequest[]; total: number; limit: number; offset: number }> {
  return gatewayFetch("admin/deletion-requests", { params });
}

export async function fulfillAdminDeletionRequest(id: string): Promise<void> {
  await gatewayFetch(`admin/deletion-requests/${id}/fulfill`, { method: "POST" });
}
