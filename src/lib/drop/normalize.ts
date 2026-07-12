import { normalizeTier, type EffectiveTier } from "@/lib/entitlements";
import type {
  DropEncryptionMetadata,
  DropFile,
  DropFileStatus,
  DropNode,
  DropNodeCapacity,
  DropPublicFile,
  DropScope,
  DropUpload,
  DropUsage,
  DropVisibility,
} from "./types";

type Raw = Record<string, unknown>;

function str(v: unknown): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

/**
 * Validate and normalize a public IPFS gateway base. Nodes advertise their
 * gateway as an HTTPS domain (TLS-terminating reverse proxy in front of Kubo
 * 8080), so only `https://host` bases are accepted — any `http`, missing host,
 * or malformed value is rejected so an insecure link can never reach the UI.
 * The trailing slash is trimmed; the RPC endpoint (`:5001`) is refused.
 */
function httpsGatewayBase(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    const url = new URL(s);
    if (url.protocol !== "https:" || !url.hostname) return undefined;
    if (url.port === "5001") return undefined;
    return s.replace(/\/+$/, "");
  } catch {
    return undefined;
  }
}

function httpsGatewayBases(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    const base = httpsGatewayBase(item);
    if (base && !out.includes(base)) out.push(base);
  }
  return out.length ? out : undefined;
}

function scope(v: unknown): DropScope {
  return String(v ?? "").toLowerCase() === "public" ? "public" : "private";
}

function visibility(v: unknown): DropVisibility {
  return String(v ?? "").toLowerCase() === "public" ? "public" : "private";
}

const FILE_STATUSES: DropFileStatus[] = [
  "reserved",
  "uploading",
  "pinning",
  "available",
  "failed",
  "stale",
  "delete_pending",
];

function fileStatus(v: unknown): DropFileStatus {
  const s = String(v ?? "").toLowerCase();
  if (s === "active" || s === "committed") return "available";
  return (FILE_STATUSES as string[]).includes(s) ? (s as DropFileStatus) : "reserved";
}

function capacity(v: unknown): DropNodeCapacity {
  const s = String(v ?? "").toLowerCase();
  if (s === "available") return "ok";
  if (s === "ok" || s === "limited" || s === "full") return s;
  return "unknown";
}

export function normalizeDropEncryptionMetadata(
  raw: unknown
): DropEncryptionMetadata | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Raw;
  const wrapped = str(o.wrapped_data_key);
  const noncePrefix = str(o.nonce_prefix);
  if (!wrapped || !noncePrefix) return undefined;
  return {
    version: num(o.version, 1),
    algorithm: str(o.algorithm) ?? "AES-256-GCM",
    chunk_size: num(o.chunk_size),
    nonce_prefix: noncePrefix,
    plaintext_size: num(o.plaintext_size),
    ciphertext_size: num(o.ciphertext_size),
    wrapped_data_key: wrapped,
    key_context: str(o.key_context) ?? "",
  };
}

export function normalizeDropNode(raw: Raw): DropNode {
  const s = scope(raw.scope ?? (raw.access_mode === "public" ? "public" : "private"));
  const dropCap =
    raw.capabilities && typeof raw.capabilities === "object"
      ? ((raw.capabilities as Raw).drop as Raw | undefined)
      : undefined;
  // A node exposes its gateway purely by advertising an HTTPS domain in
  // `public_gateway_url` (empty means unpublished). There is no separate boolean
  // toggle: availability is derived solely from a valid HTTPS base being present.
  const gatewayUrl = httpsGatewayBase(
    raw.public_gateway_url ?? dropCap?.public_gateway_url ?? raw.gateway_url
  );
  const gatewayAvailable = !!gatewayUrl;
  return {
    id: String(raw.node_id ?? raw.id ?? ""),
    name: str(raw.name) ?? String(raw.node_id ?? raw.id ?? "node"),
    region: str(raw.region),
    scope: s,
    online:
      raw.online == null
        ? String(raw.status ?? raw.state ?? "").toLowerCase() === "online"
        : bool(raw.online),
    org_id: str(raw.org_id),
    capacity: capacity(raw.capacity ?? raw.capacity_state),
    accepting:
      raw.accepting_uploads == null
        ? raw.accepting !== false
        : bool(raw.accepting_uploads),
    webui_available: bool(raw.webui_available ?? dropCap?.webui_available),
    gateway_available: gatewayAvailable,
    gateway_url: gatewayUrl,
  };
}

export function normalizeDropFile(raw: Raw): DropFile {
  return {
    id: String(raw.file_id ?? raw.id ?? ""),
    filename: str(raw.filename ?? raw.name) ?? "untitled",
    content_type: str(raw.content_type) ?? "application/octet-stream",
    size_bytes: num(raw.size_bytes ?? raw.size),
    cid: str(raw.cid),
    visibility: visibility(raw.visibility),
    scope: scope(raw.scope ?? (raw.org_id ? "private" : "public")),
    node_id: String(raw.node_id ?? ""),
    org_id: str(raw.org_id),
    encrypted: bool(raw.encrypted),
    can_decrypt: raw.can_decrypt == null ? true : bool(raw.can_decrypt),
    status: fileStatus(raw.status),
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
    encryption_metadata: normalizeDropEncryptionMetadata(raw.encryption_metadata),
    gateway_url: httpsGatewayBase(raw.gateway_url ?? raw.public_gateway_url),
    gateway_urls: httpsGatewayBases(raw.gateway_urls ?? raw.public_gateway_urls),
  };
}

export function normalizeDropUsage(raw: Raw): DropUsage {
  const rawLimit = raw.limit_bytes ?? raw.limit;
  return {
    scope: scope(raw.scope),
    used_bytes: num(raw.used_bytes ?? raw.used),
    reserved_bytes: num(raw.reserved_bytes ?? raw.reserved),
    limit_bytes: rawLimit == null || rawLimit === "" ? null : num(rawLimit),
    tier: normalizeTier(str(raw.tier)),
    entitlement_org_id: str(raw.entitlement_org_id),
    org_id: str(raw.org_id),
  };
}

export function normalizeDropUpload(raw: Raw): DropUpload {
  return {
    upload_id: String(raw.upload_id ?? raw.id ?? ""),
    file_id: str(raw.file_id),
    status: fileStatus(raw.status),
    received_bytes: raw.received_bytes == null ? undefined : num(raw.received_bytes),
    size_bytes: raw.size_bytes == null ? undefined : num(raw.size_bytes),
    expires_at: str(raw.expires_at),
    resumable: raw.resumable == null ? undefined : bool(raw.resumable),
  };
}

export function normalizeDropPublicFile(raw: Raw): DropPublicFile {
  return {
    id: String(raw.file_id ?? raw.id ?? ""),
    filename: str(raw.filename ?? raw.name) ?? "download",
    content_type: str(raw.content_type) ?? "application/octet-stream",
    size_bytes: num(raw.size_bytes ?? raw.size),
    cid: str(raw.cid),
    created_at: str(raw.created_at),
    gateway_url: httpsGatewayBase(raw.gateway_url ?? raw.public_gateway_url),
    gateway_urls: httpsGatewayBases(raw.gateway_urls ?? raw.public_gateway_urls),
  };
}

/**
 * Advisory public Drop quota per effective tier (bytes). The gateway usage
 * endpoint is authoritative; this only seeds display before usage loads and for
 * enterprise (null = no fixed default until review).
 */
const PUBLIC_QUOTA_BYTES: Record<EffectiveTier, number | null> = {
  free: 500_000_000,
  starter: 1_000_000_000,
  pro: 5_000_000_000,
  business: 10_000_000_000,
  enterprise: null,
};

export function defaultPublicQuota(tier: EffectiveTier): number | null {
  return PUBLIC_QUOTA_BYTES[tier];
}
