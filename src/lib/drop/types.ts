import type { EffectiveTier } from "@/lib/entitlements";

/**
 * Typed models for the planned gateway Drop API (`/api/v2/drop/*` and the
 * organization Drop routes). The gateway is authoritative for authorization,
 * quota, node eligibility, and file state; these types mirror its contract so
 * the webapp never makes cached authorization decisions.
 */

/** Where a file lives: the public network or a private organization. */
export type DropScope = "public" | "private";

/** A file is either encrypted-and-uploader-readable, or public plaintext. */
export type DropVisibility = "private" | "public";

/**
 * Coarse node capacity signal. The gateway decides eligibility; the webapp only
 * surfaces the state so users understand why a node may reject an upload.
 */
export type DropNodeCapacity = "ok" | "limited" | "full" | "unknown";

export interface DropNode {
  id: string;
  name: string;
  region?: string;
  scope: DropScope;
  online: boolean;
  /** Present for private nodes; identifies the owning organization. */
  org_id?: string;
  capacity: DropNodeCapacity;
  /** False when the node is not currently accepting new pins. */
  accepting: boolean;
  webui_available: boolean;
  /**
   * True when the operator has exposed this node's public IPFS HTTP gateway
   * (port 8080), enabling direct in-browser file viewing by CID. When false,
   * content is only reachable through the Erebrus gateway proxy.
   */
  gateway_available: boolean;
  /** The node's public IPFS gateway base URL, present only when exposed. */
  gateway_url?: string;
}

/**
 * Lifecycle of a Drop file as reported by the gateway. `pinning` is distinct
 * from streaming: bytes may be fully transferred while the node still pins the
 * content. `delete_pending` means an unpin is queued but the node is offline.
 */
export type DropFileStatus =
  | "reserved"
  | "uploading"
  | "pinning"
  | "available"
  | "failed"
  | "stale"
  | "delete_pending";

export interface DropEncryptionMetadata {
  version: number;
  algorithm: string;
  chunk_size: number;
  nonce_prefix: string;
  plaintext_size: number;
  ciphertext_size: number;
  /** Base64 wrapped per-file data key — never the plaintext key. */
  wrapped_data_key: string;
  key_context: string;
}

export interface DropFile {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  /** Content identifier once pinned. Never used as an access-control token. */
  cid?: string;
  visibility: DropVisibility;
  scope: DropScope;
  node_id: string;
  org_id?: string;
  encrypted: boolean;
  can_decrypt: boolean;
  status: DropFileStatus;
  created_at?: string;
  updated_at?: string;
  encryption_metadata?: DropEncryptionMetadata;
  /** Direct public IPFS gateway base for the hosting node, when exposed. */
  gateway_url?: string;
  /**
   * Additional public gateway bases for other nodes that have pinned this CID.
   * Used to fall back across nodes if one is down (content is addressed by CID).
   */
  gateway_urls?: string[];
}

/** Per-user (public) or per-org (private) storage accounting. */
export interface DropUsage {
  scope: DropScope;
  used_bytes: number;
  reserved_bytes: number;
  /** null means "no fixed limit" (e.g. enterprise, pending review). */
  limit_bytes: number | null;
  tier: EffectiveTier;
  /** Entitlement provenance: org whose seat set the effective tier. */
  entitlement_org_id?: string;
  org_id?: string;
}

export interface DropUploadInit {
  node_id: string;
  org_id: string | null;
  scope: DropScope;
  filename: string;
  content_type: string;
  size_bytes: number;
  sha256?: string;
  visibility: DropVisibility;
  encrypted: boolean;
  encryption_metadata?: DropEncryptionMetadata;
  idempotency_key: string;
}

export interface DropUpload {
  upload_id: string;
  file_id?: string;
  status: DropFileStatus;
  /** Bytes the gateway has accepted so far (reservation progress). */
  received_bytes?: number;
  size_bytes?: number;
  /** Reservation expiry; an interrupted non-resumable upload must restart. */
  expires_at?: string;
  resumable?: boolean;
}

/** Opaque public-share payload — keyed by file id, not by raw CID. */
export interface DropPublicFile {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  cid?: string;
  created_at?: string;
  /** Direct public IPFS gateway base for the hosting node, when exposed. */
  gateway_url?: string;
  /** Additional gateway bases for other nodes pinning this CID (fallback). */
  gateway_urls?: string[];
}

/** Short-lived same-origin proxy session for a private node's Kubo WebUI. */
export interface DropWebuiSession {
  /** Same-origin gateway proxy URL. Never a raw Kubo RPC endpoint. */
  url: string;
  session_id: string;
  expires_in: number;
}
