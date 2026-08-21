export type GatewayChain = "evm" | "sol";

/** Org projection on public node discovery (`GET /api/v2/nodes`). */
export interface GatewayNodeOrgSummary {
  id?: string;
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
  wg_peers_registered?: number;
  wg_peers_connected?: number;
  accepting_clients?: boolean;
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
  wg_peers_registered?: number;
  wg_peers_connected?: number;
  accepting_clients?: boolean;
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
  org_id?: string;
  deployment_profile?: string;
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

export type OrgMemberRole = "owner" | "node_operator" | "member";

export type DeploymentProfile = "standard" | "shield" | "sentinel";

export interface GatewayOrg {
  id: string;
  name: string;
  /** Legacy display label; prefer `plan` from gateway. */
  kind: string;
  slug?: string;
  plan?: string;
  billing_status?: string;
  verification_status?: string;
  public_profile_enabled?: boolean;
  description?: string;
  website?: string;
  role?: OrgMemberRole | string;
  seat_tier?: string;
  /** Caller holds a paid seat (owner always does). */
  has_paid_seat?: boolean;
  /** Always present on org API responses; `false` is meaningful. */
  verified: boolean;
  member_count?: number;
  node_count?: number;
  online_nodes?: number;
  /** Deprecated — use scoped registration tokens instead. */
  enrollment_secret?: string;
  created_at?: string;
  updated_at?: string;
}

/** Workspace profile (`GET/PATCH /orgs/:id/profile`). */
export interface GatewayOrgProfile {
  org_id: string;
  legal_name?: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  public_email?: string;
  billing_email?: string;
  support_email?: string;
  country?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GatewayOrgMember {
  id?: string;
  user_id: string;
  wallet_address: string;
  chain?: GatewayChain;
  role: OrgMemberRole | string;
  seat_tier?: string;
  status?: string;
  name?: string;
  email?: string;
  created_at?: string;
}

export interface GatewayOrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: OrgMemberRole | string;
  seat_tier?: string;
  invited_by?: string;
  status: string;
}

export interface GatewayOrgInvitePreview {
  org_id: string;
  name: string;
  slug: string;
}

/** Pending workspace invite for the authenticated user (`GET /account/org-invites`). */
export interface GatewayUserOrgInvite {
  id: string;
  org_id: string;
  org_name: string;
  org_slug?: string;
  org_display_name?: string;
  org_plan?: string;
  org_description?: string;
  org_logo_url?: string;
  member_count?: number;
  node_count?: number;
  role: string;
  seat_tier?: string;
  source: "membership" | "email" | string;
  invite_channel?: "wallet" | "email" | string;
  invited_by_id?: string;
  invited_by_name?: string;
  invited_by_email?: string;
  created_at: string;
}

/** Public org profile (`GET /public/orgs/:slug`). */
export interface GatewayPublicOrgProfile {
  slug: string;
  name: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  public_email?: string;
  country?: string;
}

/** Control-plane org node (`GET /orgs/:id/nodes`). */
export interface GatewayOrgNode {
  id: string;
  org_id: string;
  node_id: string;
  node_name?: string;
  deployment_profile: DeploymentProfile | string;
  node_type?: string;
  visibility?: string;
  managed_by?: string;
  region?: string;
  zone?: string;
  /** Control-plane enrollment status (active, degraded, disabled, …). */
  status: string;
  /** Runtime connectivity from `nodes.status` (online, offline, draining). */
  runtime_status?: string;
  access_mode?: string;
  last_heartbeat?: string;
  api_public_url?: string;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GatewayOrgNodeService {
  id: string;
  org_id: string;
  node_id: string;
  service_type: string;
  service_name?: string;
  service_provider?: string;
  service_status: string;
  visibility?: string;
  config_ref?: string;
  access_url?: string;
  license_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GatewayOrgEntitlements {
  org_id: string;
  plan: string;
  paid_seats_included: number;
  managed_vpn_nodes_included: number;
  shield_instances_included: number;
  sentinel_licenses_included: number;
  public_node_access_tier?: string;
  api_quota_monthly?: number;
  bandwidth_policy?: string;
  support_tier?: string;
  audit_logs_enabled?: boolean;
  advanced_analytics_enabled?: boolean;
}

export interface GatewayRegistrationTokenMeta {
  id: string;
  org_id: string;
  scopes: string[];
  expires_at: string;
  created_by?: string;
  used_at?: string;
  created_at?: string;
}

export interface GatewayRegistrationTokenResult {
  token: string;
  token_meta: GatewayRegistrationTokenMeta;
}

export interface GatewayFirewallService {
  service: GatewayOrgNodeService;
  service_kind: "shield" | "sentinel" | string;
}

export interface GatewayFirewallRule {
  id: string;
  org_id: string;
  node_id: string;
  firewall_service_id: string;
  rule_type: string;
  target: string;
  action?: string;
  scope?: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GatewayFirewallStatus {
  service_status: string;
  service_kind: string;
  access_url?: string;
  config_ref?: string;
}

export interface GatewayFirewallSyncResult {
  service: GatewayOrgNodeService;
  action: string;
  node_notified?: boolean;
  rules?: number;
}

export interface GatewayProfile {
  id: string;
  user_id?: string;
  wallet_address: string;
  /** Absent for wallet-less accounts (email / Google / Apple sessions). */
  chain?: GatewayChain;
  name?: string;
  email?: string;
  email_verified?: boolean;
  /** IPFS CID of the profile image (bare hash, no gateway prefix). */
  profile_picture?: string;
  role?: string;
  created_at?: string;
}

export interface GatewayActivity {
  id: string;
  action: string;
  target?: string;
  /** Present on fleet-wide admin audit entries. */
  user_id?: string;
  wallet?: string;
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

/** GET /referrals/me and POST /referrals/redeem response. */
export interface GatewayReferral {
  code: string;
  referred_count: number;
  /** True even when the referrer has no wallet (email/social account). */
  referral_bound: boolean;
  /** Truncated wallet of whoever invited this account, when bound. */
  referred_by?: string;
  recent?: Array<{ wallet: string; qualified: boolean; joined_at: string }>;
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

// Genesis rewards API. Monetary values remain decimal strings so the browser
// never becomes the authority for USDC arithmetic.
export type GenesisSeasonStatus = "upcoming" | "active" | "finalized" | "paused" | string;
export type RewardCapacityStatus = "open" | "reserved" | "active" | "full" | string;
export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "failed"
  | string;

export interface GenesisBudgetBucket {
  key: "vpn" | "ai" | "reserve" | string;
  label: string;
  allocation_usdc: string;
  allocation_percent?: string;
}

export interface GenesisSeason {
  id: string;
  name: string;
  status: GenesisSeasonStatus;
  starts_at?: string;
  ends_at?: string;
  duration_weeks?: number;
  current_week?: number;
  xp_multiplier?: string;
  focus?: string[];
  total_budget_usdc: string;
  spent_usdc: string;
  reserved_usdc: string;
  remaining_usdc: string;
  buckets: GenesisBudgetBucket[];
  payouts_paused?: boolean;
}

export interface GenesisLeaderboardEntry {
  rank: number;
  display_name: string;
  contribution_xp: number;
  active_eligible_nodes: number;
  contribution_types: Array<"vpn" | "ai" | "drop" | string>;
  country_codes?: string[];
}

export interface RewardCapacitySlot {
  id: string;
  kind: "vpn" | "ai";
  status: RewardCapacityStatus;
  demand_label: string;
  city?: string;
  country?: string;
  model_family?: string;
  checkpoint?: string;
  quantization?: string;
  mode?: "persistent" | "opportunistic" | string;
  slots_requested?: number;
  slots_available?: number;
  current_capacity?: number;
  requirements?: string[];
  reservation_expires_at?: string;
  operator_verification_status?: string;
  reservable?: boolean;
}

export interface OperatorRewardNode {
  id: string;
  name: string;
  kind: "vpn" | "ai" | string;
  slot_status: string;
  quality_band?: string;
  uptime_percent?: string;
  demand_label?: string;
  contribution_xp: number;
  retained_xp: number;
  claimable_usdc: string;
  suggestions?: string[];
}

export interface OperatorRewardSummary {
  season_id: string;
  contribution_xp: number;
  retained_xp: number;
  reserved_xp: number;
  claimable_usdc: string;
  claimed_usdc: string;
  minimum_claim_usdc: string;
  verified_solana_wallet?: string;
  conflicting_withdrawal?: boolean;
  payouts_paused?: boolean;
  active_nodes: number;
  standby_nodes: number;
  probation_nodes: number;
  nodes: OperatorRewardNode[];
}

export interface XpLedgerEntry {
  id: string;
  created_at: string;
  label: string;
  kind: string;
  contribution_xp_delta: number;
  retained_xp_delta: number;
  status?: string;
}

export interface ClaimPreview {
  amount_usdc: string;
  xp_to_reserve: number;
  projected_retained_xp: number;
  payout_wallet: string;
  network: "solana" | string;
  token: "USDC" | string;
}

export interface RewardWithdrawal {
  id: string;
  created_at: string;
  amount_usdc: string;
  xp_amount: number;
  payout_wallet: string;
  status: WithdrawalStatus;
  rejection_reason?: string;
  transaction_signature?: string;
  retryable?: boolean;
  reservation_released?: boolean;
  operator_name?: string;
  contribution_xp?: number;
  retained_xp?: number;
  related_nodes?: string[];
  flags?: string[];
  season_remaining_after_payment?: string;
}

export interface AdminRewardsSummary {
  season: GenesisSeason;
  treasury_address?: string;
  treasury_usdc_balance: string;
  treasury_sol_balance: string;
  rewards_paused: boolean;
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
  wg_peers_registered?: number;
  wg_peers_connected?: number;
  accepting_clients?: boolean;
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
  deleted_at?: string;
}

export interface GatewayDeletionRequest {
  id: string;
  user_id?: string;
  wallet_address?: string;
  email?: string;
  name?: string;
  status: "pending" | "fulfilled";
  requested_at: string;
  fulfilled_at?: string;
}

export interface GatewayAdminUserProfile extends GatewayAdminUser {
  plan?: string;
  deletion_request?: GatewayDeletionRequest | null;
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
  plan?: string;
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
