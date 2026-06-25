export type GatewayChain = "evm" | "sol";

export interface GatewayNode {
  id: string;
  node_id?: string;
  name: string;
  peer_id?: string;
  did: string;
  region: string;
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
  protocols?: string[];
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
  verified?: boolean;
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

export interface GatewayOperatorNode {
  id: string;
  node_id?: string;
  peer_id?: string;
  did: string;
  region: string;
  name?: string;
  city?: string;
  status: string;
  access_mode: string;
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

export interface GatewayAdminNode {
  id: string;
  peer_id?: string;
  did: string;
  name?: string;
  region: string;
  status: string;
  access_mode?: string;
  min_tier?: number;
  org_id?: string;
  wallet_address?: string;
  load?: number;
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
  verified?: boolean;
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