/**
 * Helpers for the `/api/gateway/[...path]` proxy. The gateway enforces auth and
 * limits; the proxy must only (1) never escape `/api/v2/` and (2) pass the real
 * client IP so the gateway's per-IP rate limits apply per user, not to the
 * webapp server as a whole.
 */

/**
 * Build the upstream URL, or null when a segment could escape `/api/v2/`
 * (decoded `..`, `.`, or embedded slashes such as `..%2F`).
 */
export function gatewayProxyTarget(base: string, segments: string[]): URL | null {
  if (segments.some((seg) => seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return null;
  }
  const baseUrl = new URL(base.endsWith("/") ? base : `${base}/`);
  const target = new URL(`api/v2/${segments.map(encodeURIComponent).join("/")}`, baseUrl);
  const prefix = `${baseUrl.pathname.replace(/\/$/, "")}/api/v2/`;
  return target.origin === baseUrl.origin && target.pathname.startsWith(prefix) ? target : null;
}

/**
 * Client-IP headers to forward. The hosting edge appends the real client to
 * `X-Forwarded-For`; the gateway (with the webapp listed in TRUSTED_PROXIES)
 * reads it from the right, so forwarding the chain unchanged cannot be spoofed.
 */
export function forwardedClientHeaders(incoming: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  const xff = incoming.get("x-forwarded-for")?.trim();
  const realIp = incoming.get("x-real-ip")?.trim();
  if (xff) out["X-Forwarded-For"] = xff;
  else if (realIp) out["X-Forwarded-For"] = realIp;
  if (realIp) out["X-Real-IP"] = realIp;
  return out;
}
