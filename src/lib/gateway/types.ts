export type GatewayChain = "evm" | "sol";

/** Org projection on public node discovery (`GET /api/v2/nodes`). */
export interface GatewayNodeOrgSummary {
  name: string;
  kind?: string;
  /** Always present when `org` is set; `false` is meaningful for dashboards. */
  verified: boolean;
  slug?: string;
  description?: string;
  website?: string;
}

/** Node-reported speedtest block on discovery responses. */
export interface GatewayNodeSpeedtest {
  download_mbps?: number;
  upload_mbps?: number;
  latency_ms?: number;
  measured_at?: number;
}

/** Capability flags advertised by a node. */
export interface GatewayNodeCapabilities {
  access_mode?: string;
  app_hosting?: boolean;
  wildcard_domain?: string;
}

/** WireGuard endpoint on a discovery node (dial host for client RTT probes). */
export interface GatewayNodeWireguardEndpoint {
  host?: string;
  port?: number;
  public_key?: string;
}

/** VLESS REALITY endpoint parameters (public dial metadata). */
export interface GatewayNodeVlessRealityEndpoint {
  port?: number;
  public_key?: string;
  short_ids?: string[];
  sni?: string;
}

/** Hysteria2 endpoint parameters. */
export interface GatewayNodeHysteria2Endpoint {
  port?: number;
  obfs?: string;
}

export interface GatewayNodeEndpoints {
  wireguard?: GatewayNodeWireguardEndpoint;
  vless_reality?: GatewayNodeVlessRealityEndpoint;
  hysteria2?: GatewayNodeHysteria2Endpoint;
}

/**
 * Raw gateway `NodePublic` from `GET /api/v2/nodes`.
 * Excludes raw IP, org_id, enrollment secrets, and full spec blobs.
 */
export interface GatewayNodePublic {
  node_id: string;
  name: string;
  did: string;
  peer_id?: string;
  wallet_address?: string;
  region: string;
  zone?: string;
  status: "online" | "offline" | "draining" | string;
  access_mode: string;
  min_tier: number;
  protocols: string[];
  capabilities?: GatewayNodeCapabilities;
  endpoints?: GatewayNodeEndpoints;
  speedtest?: GatewayNodeSpeedtest;
  load_pct: number;
  ip_hash?: string;
  version?: string;
  rx_bytes?: number;
  tx_bytes?: number;
  /** Last node WS heartbeat — control-plane ping (~30s when online). */
  last_heartbeat?: string;
  /** Latest WireGuard handshake across any client on this node. */
  last_peer_handshake?: string;
  created_at?: string;
  org?: GatewayNodeOrgSummary;
}

/** Normalized node for app UI (see `normalizeNode`). */
export interface GatewayNode {
  id: string;
  node_id?: string;
  name: string;
  peer_id?: string;
  did: string;
  region: string;
  zone?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status: "online" | "offline" | "draining" | string;
  access_mode: string;
  min_tier?: number;
  load_pct?: number;
  latency_ms?: number;
  uptime_pct?: number;
  ip_hash?: string;
  version?: string;
  rx_bytes?: number;
  tx_bytes?: number;
  protocols?: string[];
  capabilities?: GatewayNodeCapabilities;
  /** Node speedtest capacity (from the gateway `speedtest` block). */
  download_mbps?: number;
  upload_mbps?: number;
  speedtest_at?: number;
  /** Control-plane heartbeat timestamp (legacy alias for UI). */
  last_seen?: number | string;
  /** Raw gateway heartbeat timestamp when mapped 1:1 from discovery. */
  last_heartbeat?: string;
  /** Latest WireGuard handshake across any VPN client on this node. */
  last_peer_handshake?: string;
  created_at?: string;
  /** Operator wallet address, when exposed by the gateway. */
  wallet_address?: string;
  /** Operating org workspace (from gateway `org` block). */
  org?: GatewayNodeOrgSummary;
}

export interface GatewayVpnClient {
  id: string;
  name: string;
  node_id: string;
  node_region?: string;
  status?: string;
  created_at: string;
  rx_bytes?: number;
  tx_bytes?: number;
  last_handshake?: string;
}

export interface GatewaySubscription {
  status?: string;
  entitled: boolean;
  source?: string;
  trial_consumed?: boolean;
  plan_id?: string;
  plan?: string;
  current_period_end?: string;
  expires_at?: string;
  device_limit?: number;
  max_clients?: number;
  nft_gating?: boolean;
}

export interface GatewayPlan {
  id: string;
  name: string;
  period_days?: number;
  max_clients: number;
  device_limit?: number;
}

export interface GatewayOrg {
  id: string;
  name: string;
  kind: string;
  slug?: string;
  description?: string;
  website?: string;
  role?: string;
  /** Always present on org API responses; `false` is meaningful. */
  verified: boolean;
  member_count?: number;
  node_count?: number;
  online_nodes?: number;
  enrollment_secret?: string;
  created_at?: string;
}

export interface GatewayOrgMember {
  user_id: string;
  wallet_address: string;
  chain: GatewayChain;
  role: "owner" | "admin" | "member";
  name?: string;
}

export interface GatewayProfile {
  id: string;
  user_id?: string;
  wallet_address: string;
  chain: GatewayChain;
  name?: string;
  email?: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
}

export interface GatewayActivity {
  id: string;
  action: string;
  target?: string;
  ip?: string;
  device?: string;
  app?: string;
  user_agent?: string;
  created_at: string;
}

export interface GatewayRank {
  xp_earned: number;
  xp_claimed: number;
  xp_claimable: number;
  tier: number;
  tier_name: string;
  next_tier_at?: number;
  breakdown_by_kind?: Record<string, number>;
}

export interface GatewayReferral {
  code: string;
  referrer_wallet?: string;
  referees?: Array<{ wallet_address: string; qualified: boolean; created_at: string }>;
}

export interface GatewayLeaderboardEntry {
  rank: number;
  wallet: string;
  wallet_address?: string;
  name?: string;
  value: number;
}

export interface GatewayPerk {
  id: string;
  name: string;
  description?: string;
  type: string;
  tier_required: number;
  unlocked: boolean;
}

/** Operator org node view (`GET /api/v2/operator/nodes`). */
export interface GatewayOperatorNode {
  id: string;
  node_id?: string;
  peer_id?: string;
  did: string;
  wallet_address?: string;
  name?: string;
  region: string;
  zone?: string;
  city?: string;
  status: string;
  access_mode: string;
  min_tier?: number;
  load_pct?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  speedtest?: GatewayNodeSpeedtest;
  last_heartbeat?: string;
  created_at?: string;
  org?: GatewayNodeOrgSummary;
  /** Legacy / derived fields used by older client mappers. */
  uptime_pct?: number;
  wg_peers?: number;
  org_id?: string;
}

export interface GatewayApiKey {
  id: string;
  prefix: string;
  name?: string;
  created_at: string;
}

export interface GatewayNodeMetrics {
  buckets: Array<{
    ts: string;
    wg_peers?: number;
    rx_bytes?: number;
    tx_bytes?: number;
    cpu_pct?: number;
    mem_pct?: number;
  }>;
}

export interface GatewayOrgUsage {
  days?: number;
  window_days?: number;
  api_calls?: number;
  vpn_clients?: number;
  clients?: number;
  bytes_rx?: number;
  bytes_tx?: number;
  bandwidth_rx?: number;
  bandwidth_tx?: number;
  bandwidth_total?: number;
  org_id?: string;
}

export interface GatewaySocialAccount {
  provider: string;
  handle: string;
}

export interface GatewayAdminStats {
  nodes: { by_status: Record<string, number>; connected: number };
  users: { total: number };
  orgs: { total: number };
  subscriptions: { by_plan: Record<string, number> };
  traffic_30d: { rx_bytes: number; tx_bytes: number };
}

export interface GatewayAdminUser {
  id: string;
  wallet_address?: string;
  chain?: GatewayChain;
  role: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  created_at?: string;
}

export interface GatewayNodeLoad {
  cpu_pct?: number;
  mem_pct?: number;
  wg_peers?: number;
  proxy_sessions?: number;
  rx_bytes?: number;
  tx_bytes?: number;
}

export interface GatewayAdminNode {
  id: string;
  peer_id?: string;
  did: string;
  name?: string;
  region: string;
  zone?: string;
  status: string;
  access_mode?: string;
  min_tier?: number;
  org_id?: string;
  wallet_address?: string;
  load?: GatewayNodeLoad;
  speedtest?: GatewayNodeSpeedtest;
  rx_bytes?: number;
  tx_bytes?: number;
  version?: string;
  last_heartbeat?: string;
  created_at?: string;
}

export interface GatewayAdminOrg {
  id?: string;
  name: string;
  kind: string;
  verified: boolean;
  slug?: string;
  description?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GatewayPlatformSetting {
  key: string;
  value: string;
  description?: string;
}