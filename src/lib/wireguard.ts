import { generateKeyPair } from "curve25519-js";

export interface WgKeyPair {
  /** base64-encoded WireGuard private key (stays on the client, never sent to the node) */
  privateKey: string;
  /** base64-encoded WireGuard public key (sent to the node when provisioning) */
  publicKey: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Generate a fresh Curve25519 keypair for a WireGuard client, entirely on the
 * client side. The node only ever receives `publicKey`; `privateKey` must be
 * placed into the client's own config and never leaves the browser.
 */
export function generateWgKeyPair(): WgKeyPair {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  const { public: pub, private: priv } = generateKeyPair(seed);
  return { privateKey: bytesToBase64(priv), publicKey: bytesToBase64(pub) };
}

/**
 * The node builds the WireGuard config from the client's *public* key, so the
 * config it returns has a missing or placeholder `PrivateKey`. Inject the
 * client-held private key into the `[Interface]` section so the config is
 * actually usable (importable / scannable).
 */
export function injectPrivateKey(config: string, privateKey: string): string {
  const line = `PrivateKey = ${privateKey}`;
  // Replace an existing PrivateKey line (empty or placeholder) in place.
  if (/^[ \t]*PrivateKey[ \t]*=.*$/m.test(config)) {
    return config.replace(/^[ \t]*PrivateKey[ \t]*=.*$/m, () => line);
  }
  // Otherwise insert it right after the [Interface] header.
  if (/^[ \t]*\[Interface\][ \t]*$/m.test(config)) {
    return config.replace(/^([ \t]*\[Interface\][ \t]*)$/m, (m) => `${m}\n${line}`);
  }
  // Fallback: prepend a minimal [Interface] block.
  return `[Interface]\n${line}\n${config}`;
}

// ── Local private-key store ──────────────────────────────────────────────────
// WireGuard private keys exist only on the client. We keep them in localStorage,
// keyed by client id, so a device's config can be re-downloaded or shown as a QR
// after creation. Cleared when the device is removed.
const KEY_PREFIX = "erebrus.wg.pk.";

export function storeClientPrivateKey(clientId: string, privateKey: string): void {
  try {
    localStorage.setItem(KEY_PREFIX + clientId, privateKey);
  } catch {
    /* storage unavailable — config stays usable for this session only */
  }
}

export function getClientPrivateKey(clientId: string): string | null {
  try {
    return localStorage.getItem(KEY_PREFIX + clientId);
  } catch {
    return null;
  }
}

export function removeClientPrivateKey(clientId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + clientId);
  } catch {
    /* ignore */
  }
}
