/** Human-readable byte counts: 0 → "0 B", 1536 → "1.5 KB", … */
export function formatBytes(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

/** Parse gateway ISO or unix timestamps to epoch ms. */
export function timestampMs(input?: string | number | null): number | undefined {
  if (input == null || input === "") return undefined;
  const ms =
    typeof input === "number" ? input * (input < 1e12 ? 1000 : 1) : Date.parse(input);
  return Number.isNaN(ms) ? undefined : ms;
}

/** True when [input] is within [windowMs] of now (default 3 min — WG rekey window). */
export function isRecentTimestamp(
  input?: string | number | null,
  windowMs = 3 * 60 * 1000
): boolean {
  const ms = timestampMs(input);
  if (ms == null) return false;
  return Date.now() - ms < windowMs;
}

/** Compact "time ago" for handshakes/heartbeats. Returns "—" when unknown. */
export function formatRelativeTime(input?: string | number | null): string {
  const ms = timestampMs(input);
  if (ms == null) return "—";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** Pick label + timestamp for node liveness UI (matches VPN app logic). */
export function nodeActivityDisplay(
  node: {
    status?: string;
    last_peer_handshake?: string | number | null;
    last_heartbeat?: string | number | null;
    last_seen?: string | number | null;
  },
  handshakeWindowMs = 3 * 60 * 1000,
  heartbeatWindowMs = 90 * 1000
): { label: string; at?: string | number } {
  const online = node.status === "online";
  const recentHandshake = isRecentTimestamp(node.last_peer_handshake, handshakeWindowMs);
  if (recentHandshake && node.last_peer_handshake != null) {
    return { label: "Last handshake", at: node.last_peer_handshake };
  }
  const heartbeat = node.last_heartbeat ?? node.last_seen;
  const recentHeartbeat = isRecentTimestamp(heartbeat, heartbeatWindowMs);
  if (online && recentHeartbeat && heartbeat != null) {
    return { label: "Alive", at: heartbeat };
  }
  if (heartbeat != null) {
    return { label: online ? "Alive" : "Last alive", at: heartbeat };
  }
  return { label: online ? "Alive" : "Last alive" };
}

export type ClientActivity = {
  label: "Active" | "Idle" | "Never connected";
  color: string;
  /** true when a handshake happened within the active window. */
  online: boolean;
};

/**
 * Derive a WireGuard client's live status from its last handshake. WireGuard
 * rekeys roughly every 2 min, so a handshake inside ~3 min means the peer is up.
 */
export function clientActivity(lastHandshake?: string | null): ClientActivity {
  if (!lastHandshake) return { label: "Never connected", color: "var(--text-3)", online: false };
  const ms = Date.parse(lastHandshake);
  if (Number.isNaN(ms)) return { label: "Never connected", color: "var(--text-3)", online: false };
  const active = Date.now() - ms < 3 * 60 * 1000;
  return active
    ? { label: "Active", color: "var(--success)", online: true }
    : { label: "Idle", color: "var(--warn)", online: false };
}

/** Color token for a latency value (green <60ms, yellow <150ms, red above). */
export function latencyColor(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) return "var(--text-3)";
  if (ms < 60) return "var(--success)";
  if (ms < 150) return "var(--warn)";
  return "var(--danger)";
}

/** Format a latency value as "—" when unknown, otherwise "<ms> ms". */
export function formatLatency(ms?: number | null): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  return `${Math.round(ms)} ms`;
}
