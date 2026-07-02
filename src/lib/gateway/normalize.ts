import { regionCoords } from "@/lib/regions";
import type {
  GatewayActivity,
  GatewayLeaderboardEntry,
  GatewayNode,
  GatewayNodeCapabilities,
  GatewayNodeOrgSummary,
  GatewayOrg,
  GatewayOrgNode,
  GatewayPlan,
  GatewayProfile,
  GatewaySubscription,
  GatewayVpnClient,
} from "./types";

function optStr(v: unknown): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
}

function optNum(v: unknown): number | undefined {
  if (v == null || v === "" || Number.isNaN(Number(v))) return undefined;
  return Number(v);
}

function normalizeNodeOrg(raw: unknown): GatewayNodeOrgSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const name = optStr(o.name);
  if (!name) return undefined;
  return {
    name,
    kind: optStr(o.kind),
    verified: o.verified === true,
    slug: optStr(o.slug),
    description: optStr(o.description),
    website: optStr(o.website),
  };
}

function normalizeCapabilities(raw: unknown): GatewayNodeCapabilities | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const caps = raw as Record<string, unknown>;
  const out: GatewayNodeCapabilities = {};
  const accessMode = optStr(caps.access_mode);
  if (accessMode) out.access_mode = accessMode;
  if (caps.app_hosting === true) out.app_hosting = true;
  const wildcard = optStr(caps.wildcard_domain);
  if (wildcard) out.wildcard_domain = wildcard;
  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizeNode(raw: Record<string, unknown>): GatewayNode {
  const region = String(raw.region ?? "unknown");
  const zone = optStr(raw.zone);
  const coords = regionCoords(region, zone);
  const speedtest = (raw.speedtest ?? {}) as Record<string, unknown>;
  const heartbeat = optStr(raw.last_heartbeat);
  const peerHandshake = optStr(raw.last_peer_handshake);
  const wallet = optStr(raw.wallet_address ?? raw.wallet);
  return {
    id: String(raw.node_id ?? raw.id ?? ""),
    node_id: String(raw.node_id ?? raw.id ?? ""),
    name: String(raw.name ?? region),
    peer_id: optStr(raw.peer_id),
    did: String(raw.did ?? ""),
    region,
    zone,
    city: coords.label.split(",")[0],
    country: coords.label.split(",")[1]?.trim(),
    latitude: coords.lat,
    longitude: coords.lng,
    status: String(raw.status ?? "offline"),
    access_mode: String(raw.access_mode ?? "public"),
    min_tier: Number(raw.min_tier ?? 0),
    load_pct: optNum(raw.load_pct) ?? 0,
    latency_ms: optNum(speedtest.latency_ms),
    download_mbps: optNum(speedtest.download_mbps),
    upload_mbps: optNum(speedtest.upload_mbps),
    speedtest_at: optNum(speedtest.measured_at),
    last_seen: (heartbeat ?? peerHandshake ?? raw.last_seen ?? raw.last_alive) as
      | string
      | number
      | undefined,
    last_heartbeat: heartbeat,
    last_peer_handshake: peerHandshake,
    created_at: optStr(raw.created_at),
    wallet_address: wallet,
    ip_hash: optStr(raw.ip_hash),
    version: optStr(raw.version),
    rx_bytes: optNum(raw.rx_bytes),
    tx_bytes: optNum(raw.tx_bytes),
    capabilities: normalizeCapabilities(raw.capabilities),
    org: normalizeNodeOrg(raw.org),
    protocols: Array.isArray(raw.protocols) ? (raw.protocols as string[]) : [],
  };
}

export function normalizeSubscription(raw: Record<string, unknown>): GatewaySubscription {
  const end = (raw.current_period_end ?? raw.expires_at) as string | undefined;
  return {
    status: raw.status as string | undefined,
    entitled: Boolean(raw.entitled),
    source: raw.source as string | undefined,
    trial_consumed: Boolean(raw.trial_consumed),
    plan_id: (raw.plan_id ?? raw.plan) as string | undefined,
    plan: (raw.plan_id ?? raw.plan) as string | undefined,
    current_period_end: end,
    expires_at: end,
    nft_gating: Boolean(raw.nft_gating),
  };
}

export function normalizePlan(raw: Record<string, unknown>): GatewayPlan {
  const max = Number(raw.max_clients ?? raw.device_limit ?? 1);
  return {
    id: String(raw.id),
    name: String(raw.name),
    period_days: Number(raw.period_days ?? 30),
    max_clients: max,
    device_limit: max,
  };
}

export function normalizeClient(raw: Record<string, unknown>): GatewayVpnClient {
  return {
    id: String(raw.id),
    name: String(raw.name),
    node_id: String(raw.node_id),
    status: raw.status as string | undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    rx_bytes: Number(raw.rx_bytes ?? 0),
    tx_bytes: Number(raw.tx_bytes ?? 0),
    last_handshake: raw.last_handshake as string | undefined,
  };
}

export function normalizeActivity(raw: Record<string, unknown>): GatewayActivity {
  return {
    id: String(raw.id ?? ""),
    action: String(raw.action ?? ""),
    target: optStr(raw.target),
    user_id: optStr(raw.user_id),
    wallet: optStr(raw.wallet),
    ip: optStr(raw.ip),
    device: optStr(raw.device),
    app: optStr(raw.app),
    user_agent: optStr(raw.user_agent),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

export function normalizeOrg(raw: Record<string, unknown>): GatewayOrg {
  const plan = optStr(raw.plan);
  const verification = optStr(raw.verification_status);
  const stats =
    raw.stats && typeof raw.stats === "object"
      ? (raw.stats as Record<string, unknown>)
      : null;

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    kind: String(raw.kind ?? plan ?? "team"),
    slug: raw.slug as string | undefined,
    plan,
    billing_status: optStr(raw.billing_status),
    verification_status: verification,
    public_profile_enabled: raw.public_profile_enabled === true,
    description: raw.description as string | undefined,
    website: raw.website as string | undefined,
    role: raw.role as string | undefined,
    verified:
      raw.verified === true ||
      verification === "verified",
    member_count:
      optNum(raw.member_count) ??
      optNum(raw.members_count) ??
      optNum(stats?.member_count) ??
      optNum(stats?.members),
    node_count:
      optNum(raw.node_count) ??
      optNum(raw.nodes_count) ??
      optNum(stats?.node_count) ??
      optNum(stats?.nodes),
    online_nodes:
      optNum(raw.online_nodes) ??
      optNum(raw.nodes_online) ??
      optNum(stats?.online_nodes) ??
      optNum(stats?.nodes_online),
    enrollment_secret: raw.enrollment_secret as string | undefined,
    created_at: raw.created_at as string | undefined,
    updated_at: optStr(raw.updated_at),
  };
}

/** Maps `GET /orgs/:id/nodes` control-plane records. */
export function normalizeOrgNode(raw: Record<string, unknown>): GatewayOrgNode {
  return {
    id: String(raw.id ?? ""),
    org_id: String(raw.org_id ?? ""),
    node_id: String(raw.node_id ?? ""),
    node_name: optStr(raw.node_name),
    deployment_profile: String(raw.deployment_profile ?? "erebrus"),
    node_type: optStr(raw.node_type),
    visibility: optStr(raw.visibility),
    managed_by: optStr(raw.managed_by),
    region: optStr(raw.region) ?? "unknown",
    zone: optStr(raw.zone),
    status: String(raw.status ?? "offline"),
    api_public_url: optStr(raw.api_public_url),
    last_seen_at: optStr(raw.last_seen_at),
    created_at: optStr(raw.created_at),
    updated_at: optStr(raw.updated_at),
  };
}

export function normalizeProfile(raw: Record<string, unknown>): GatewayProfile {
  return {
    id: String(raw.id ?? raw.user_id ?? ""),
    user_id: String(raw.id ?? raw.user_id ?? ""),
    wallet_address: String(raw.wallet_address ?? ""),
    chain: (raw.chain as GatewayProfile["chain"]) ?? "sol",
    name: raw.name as string | undefined,
    email: raw.email as string | undefined,
    email_verified: Boolean(raw.email_verified),
    role: raw.role as string | undefined,
    created_at: raw.created_at as string | undefined,
  };
}

export function normalizeLeaderboardEntry(raw: Record<string, unknown>): GatewayLeaderboardEntry {
  return {
    rank: Number(raw.rank),
    wallet: String(raw.wallet ?? raw.wallet_address ?? ""),
    wallet_address: String(raw.wallet ?? raw.wallet_address ?? ""),
    value: Number(raw.value ?? 0),
    name: raw.name as string | undefined,
  };
}

export function subscriptionDeviceLimit(
  sub: GatewaySubscription | null,
  plans: GatewayPlan[]
): number {
  if (!sub?.entitled) return 1;
  const planId = sub.plan_id ?? sub.plan ?? "free";
  const plan = plans.find((p) => p.id === planId);
  return plan?.max_clients ?? sub.max_clients ?? sub.device_limit ?? 3;
}