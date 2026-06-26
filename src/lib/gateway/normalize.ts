import { regionCoords } from "@/lib/regions";
import type {
  GatewayLeaderboardEntry,
  GatewayNode,
  GatewayOrg,
  GatewayPlan,
  GatewayProfile,
  GatewaySubscription,
  GatewayVpnClient,
} from "./types";

export function normalizeNode(raw: Record<string, unknown>): GatewayNode {
  const region = String(raw.region ?? "unknown");
  const coords = regionCoords(region);
  const speedtest = (raw.speedtest ?? {}) as Record<string, unknown>;
  const org = (raw.org ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | undefined =>
    v == null || v === "" || Number.isNaN(Number(v)) ? undefined : Number(v);
  return {
    id: String(raw.node_id ?? raw.id ?? ""),
    node_id: String(raw.node_id ?? raw.id ?? ""),
    name: String(raw.name ?? region),
    did: String(raw.did ?? ""),
    region,
    city: coords.label.split(",")[0],
    country: coords.label.split(",")[1]?.trim(),
    latitude: coords.lat,
    longitude: coords.lng,
    status: String(raw.status ?? "offline"),
    access_mode: String(raw.access_mode ?? "public"),
    min_tier: Number(raw.min_tier ?? 0),
    load_pct: num(raw.load_pct) ?? 0,
    latency_ms: num(speedtest.latency_ms),
    download_mbps: num(speedtest.download_mbps),
    upload_mbps: num(speedtest.upload_mbps),
    speedtest_at: num(speedtest.measured_at),
    org_name: org.name ? String(org.name) : undefined,
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

export function normalizeOrg(raw: Record<string, unknown>): GatewayOrg {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    kind: String(raw.kind ?? "team"),
    slug: raw.slug as string | undefined,
    description: raw.description as string | undefined,
    website: raw.website as string | undefined,
    role: raw.role as string | undefined,
    verified: Boolean(raw.verified),
    enrollment_secret: raw.enrollment_secret as string | undefined,
    created_at: raw.created_at as string | undefined,
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