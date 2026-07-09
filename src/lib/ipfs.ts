/**
 * IPFS profile-image plumbing. Uploads go through our API route to the IPFS
 * node's HTTP API; only the bare CID is stored on the gateway profile. Reads
 * resolve through a public gateway base URL that will move off localhost later.
 */

export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export const IPFS_GATEWAY_URL =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ?? "http://127.0.0.1:8080/ipfs/";

/** Resolve a stored profile image value (bare CID, ipfs:// URI, or full URL). */
export function ipfsImageUrl(value?: string | null): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const cid = v.replace(/^ipfs:\/\//i, "");
  const base = IPFS_GATEWAY_URL.endsWith("/") ? IPFS_GATEWAY_URL : `${IPFS_GATEWAY_URL}/`;
  return `${base}${cid}`;
}
