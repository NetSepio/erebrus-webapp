export type GatewayChain = "evm" | "sol";

export interface GatewayNode {
  id: string;
  peer_id: string;
  did: string;
  region: string;
  city?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  status: "online" | "offline" | "draining";
  access_mode: "public" | "private";
  min_tier?: number;
  load_pct?: number;
  latency_ms?: number;
  uptime_pct?: number;
  ip_hash?: string;
}

export interface GatewayVpnClient {
  id: string;
  name: string;
  node_id: string;
  node_region?: string;
  created_at: string;
  status?: string;
}

export interface GatewaySubscription {
  status: string;
  entitled: boolean;
  source?: string;
  trial_consumed?: boolean;
  plan?: string;
  expires_at?: string;
  device_limit?: number;
  nft_gating?: boolean;
}

export interface GatewayPlan {
  id: string;
  name: string;
  device_limit: number;
  duration_days?: number;
}

export interface GatewayOrg {
  id: string;
  name: string;
  kind: "team" | "company" | "individual" | "family";
  slug: string;
  description?: string;
  website?: string;
  role?: "owner" | "admin" | "member";
  member_count?: number;
  node_count?: number;
  online_nodes?: number;
  enrollment_secret?: string;
}

export interface GatewayOrgMember {
  user_id: string;
  wallet_address: string;
  chain: GatewayChain;
  role: "owner" | "admin" | "member";
  name?: string;
}

export interface GatewayProfile {
  user_id: string;
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
  ip?: string;
  device?: string;
  app?: string;
  created_at: string;
}

export interface GatewayRank {
  xp_earned: number;
  xp_claimed: number;
  xp_claimable: number;
  tier: number;
  tier_name: string;
}

export interface GatewayReferral {
  code: string;
  referrer_wallet?: string;
  referees?: Array<{ wallet_address: string; qualified: boolean; created_at: string }>;
}

export interface GatewayLeaderboardEntry {
  rank: number;
  wallet_address: string;
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
  peer_id: string;
  did: string;
  region: string;
  city?: string;
  status: string;
  access_mode: string;
  uptime_pct?: number;
  wg_peers?: number;
  org_id?: string;
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

export interface GatewayApiKey {
  id: string;
  prefix: string;
  name?: string;
  created_at: string;
}

export interface GatewayError {
  error: string;
  message?: string;
}