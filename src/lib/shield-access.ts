/** AdGuard admin URL reported by nodes is often a Docker hostname — not user-routable. */
export function isInternalShieldAdminUrl(url?: string | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes("adguardhome") ||
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.startsWith("http://10.") ||
    u.startsWith("http://172.") ||
    u.startsWith("http://192.168.")
  );
}

/**
 * User-facing AdGuard console URL for a Shield node.
 * Private Shield consoles are reachable over the WireGuard tunnel (gateway DNS IP).
 */
export function resolveShieldAdminUrl(
  storedUrl: string | undefined,
  nodeName?: string
): { url: string; note: string } {
  if (storedUrl && !isInternalShieldAdminUrl(storedUrl)) {
    return {
      url: storedUrl,
      note: "Open while connected to this node's VPN tunnel.",
    };
  }

  const host =
    nodeName && /^[a-z0-9][a-z0-9.-]*$/i.test(nodeName)
      ? `${nodeName.toLowerCase()}.erebrus.io`
      : null;

  if (host) {
    return {
      url: `https://${host}:3000`,
      note:
        "Connect with WireGuard first. If the console is not exposed publicly, use http://10.0.0.1:3000 over the VPN tunnel.",
    };
  }

  return {
    url: "http://10.0.0.1:3000",
    note: "Connect with WireGuard first, then open this address inside the tunnel.",
  };
}