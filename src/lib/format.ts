/** Human-readable byte counts: 0 → "0 B", 1536 → "1.5 KB", … */
export function formatBytes(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

/** Compact "time ago" for handshakes/heartbeats. Returns "—" when unknown. */
export function formatRelativeTime(input?: string | number | null): string {
  if (input == null || input === "") return "—";
  const ms = typeof input === "number" ? input * (input < 1e12 ? 1000 : 1) : Date.parse(input);
  if (Number.isNaN(ms)) return "—";
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
