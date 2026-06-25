import { getCurrentAuthToken } from "@/context/appkit";
import type {
  GatewayActivity,
  GatewayApiKey,
  GatewayLeaderboardEntry,
  GatewayNode,
  GatewayNodeMetrics,
  GatewayOperatorNode,
  GatewayOrg,
  GatewayOrgMember,
  GatewayPerk,
  GatewayPlan,
  GatewayProfile,
  GatewayRank,
  GatewayReferral,
  GatewaySubscription,
  GatewayVpnClient,
} from "./types";

const CLIENT_HEADER = "webapp";

function gatewayBase(): string {
  if (typeof window !== "undefined") return "/api/gateway/";
  const raw =
    process.env.NEXT_PUBLIC_EREBRUS_BASE_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    "https://gateway.erebrus.io";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = gatewayBase();
  const normalized = path.startsWith("api/") ? path : `api/v2/${path}`;
  const url = new URL(normalized, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export class GatewayApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
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

export async function fetchNodes(params?: {
  region?: string;
  status?: string;
}): Promise<GatewayNode[]> {
  const data = await gatewayFetch<{ nodes?: GatewayNode[] } | GatewayNode[]>("nodes", {
    params,
    auth: false,
  });
  return Array.isArray(data) ? data : (data.nodes ?? []);
}

// ── VPN Clients ────────────────────────────────────────────────────────────

export async function fetchVpnClients(): Promise<GatewayVpnClient[]> {
  const data = await gatewayFetch<{ clients?: GatewayVpnClient[] } | GatewayVpnClient[]>(
    "vpn/clients"
  );
  return Array.isArray(data) ? data : (data.clients ?? []);
}

export async function provisionVpnClient(body: {
  name: string;
  node_id: string;
  wg_public_key: string;
  wg_preshared_key?: string;
  idempotency_key?: string;
}): Promise<GatewayVpnClient & { config?: string }> {
  return gatewayFetch("vpn/clients", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteVpnClient(id: string): Promise<void> {
  await gatewayFetch(`vpn/clients/${id}`, { method: "DELETE" });
}

export async function fetchVpnClientConfig(id: string): Promise<{ config: string }> {
  return gatewayFetch(`vpn/clients/${id}/config`);
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export async function fetchSubscription(): Promise<GatewaySubscription> {
  return gatewayFetch("subscriptions");
}

export async function fetchPlans(): Promise<GatewayPlan[]> {
  const data = await gatewayFetch<{ plans?: GatewayPlan[] } | GatewayPlan[]>("subscriptions/plans", {
    auth: false,
  });
  return Array.isArray(data) ? data : (data.plans ?? []);
}

export async function startTrial(): Promise<GatewaySubscription> {
  return gatewayFetch("subscriptions/trial", { method: "POST" });
}

export async function refreshNftEntitlement(): Promise<GatewaySubscription> {
  return gatewayFetch("subscriptions/nft/refresh", { method: "POST" });
}

// ── Account ────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<GatewayProfile> {
  return gatewayFetch("account/profile");
}

export async function updateProfile(body: { name: string }): Promise<GatewayProfile> {
  return gatewayFetch("account/profile", { method: "PATCH", body: JSON.stringify(body) });
}

export async function fetchActivity(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: GatewayActivity[]; total?: number }> {
  return gatewayFetch("account/activity", { params });
}

// ── Email verification ─────────────────────────────────────────────────────

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
  const data = await gatewayFetch<{ orgs?: GatewayOrg[] } | GatewayOrg[]>("orgs");
  return Array.isArray(data) ? data : (data.orgs ?? []);
}

export async function fetchOrg(id: string): Promise<GatewayOrg> {
  return gatewayFetch(`orgs/${id}`);
}

export async function createOrg(body: {
  name: string;
  kind: GatewayOrg["kind"];
  slug: string;
  description?: string;
  website?: string;
}): Promise<GatewayOrg> {
  return gatewayFetch("orgs", { method: "POST", body: JSON.stringify(body) });
}

export async function updateOrg(
  id: string,
  body: Partial<Pick<GatewayOrg, "name" | "description" | "website">>
): Promise<GatewayOrg> {
  return gatewayFetch(`orgs/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function fetchOrgMembers(id: string): Promise<GatewayOrgMember[]> {
  const data = await gatewayFetch<{ members?: GatewayOrgMember[] } | GatewayOrgMember[]>(
    `orgs/${id}/members`
  );
  return Array.isArray(data) ? data : (data.members ?? []);
}

export async function addOrgMember(
  orgId: string,
  body: { wallet_address: string; chain: string; role: string }
): Promise<void> {
  await gatewayFetch(`orgs/${orgId}/members`, { method: "POST", body: JSON.stringify(body) });
}

export async function fetchOrgNodes(id: string): Promise<GatewayNode[]> {
  const data = await gatewayFetch<{ nodes?: GatewayNode[] } | GatewayNode[]>(`orgs/${id}/nodes`);
  return Array.isArray(data) ? data : (data.nodes ?? []);
}

export async function fetchOrgApiKeys(id: string): Promise<GatewayApiKey[]> {
  const data = await gatewayFetch<{ keys?: GatewayApiKey[] } | GatewayApiKey[]>(
    `orgs/${id}/apikeys`
  );
  return Array.isArray(data) ? data : (data.keys ?? []);
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
  const data = await gatewayFetch<{ nodes?: GatewayOperatorNode[] } | GatewayOperatorNode[]>(
    "operator/nodes"
  );
  return Array.isArray(data) ? data : (data.nodes ?? []);
}

export async function fetchOperatorNodeMetrics(
  id: string,
  params?: { range?: string; step?: string }
): Promise<GatewayNodeMetrics> {
  return gatewayFetch(`operator/nodes/${id}/metrics`, { params });
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

export async function claimRankReward(): Promise<GatewaySubscription> {
  return gatewayFetch("rank/claim", { method: "POST" });
}

export async function fetchLeaderboard(params?: {
  metric?: string;
  period?: string;
  limit?: number;
  offset?: number;
}): Promise<GatewayLeaderboardEntry[]> {
  const data = await gatewayFetch<{ entries?: GatewayLeaderboardEntry[] } | GatewayLeaderboardEntry[]>(
    "leaderboard",
    { params }
  );
  return Array.isArray(data) ? data : (data.entries ?? []);
}

// ── Social & Perks ─────────────────────────────────────────────────────────

export async function fetchPerks(): Promise<GatewayPerk[]> {
  const data = await gatewayFetch<{ perks?: GatewayPerk[] } | GatewayPerk[]>("perks");
  return Array.isArray(data) ? data : (data.perks ?? []);
}

export async function fetchMyPerks(): Promise<GatewayPerk[]> {
  const data = await gatewayFetch<{ perks?: GatewayPerk[] } | GatewayPerk[]>("perks/me");
  return Array.isArray(data) ? data : (data.perks ?? []);
}