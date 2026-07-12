/**
 * Drop client-side encryption primitives.
 *
 * Threat model: the gateway and node operators are honest-but-curious. Private
 * files are encrypted in the browser so operators can store, list, and delete
 * them but can never read their contents. Nothing here ever transmits or
 * persists a plaintext vault key, per-file data key, or recovery secret.
 *
 * Scheme:
 *  - A random 256-bit account "vault key" wraps every per-file data key.
 *  - The vault key is backed up to the gateway only in wrapped form: it is
 *    AES-256-GCM encrypted under a key derived (PBKDF2-SHA256) from a
 *    client-held recovery secret. The gateway stores ciphertext + KDF params.
 *  - Each file gets a fresh random 256-bit data key and is encrypted in
 *    fixed-size chunks with AES-256-GCM. The 96-bit IV of each chunk is an
 *    8-byte per-file random nonce prefix concatenated with a 4-byte monotonic
 *    big-endian counter, guaranteeing IV uniqueness within the file.
 *  - Each chunk authenticates versioned associated data (version ‖ nonce prefix
 *    ‖ counter ‖ final-flag) so chunks cannot be reordered, truncated, or
 *    replayed across files/versions.
 */

export const DROP_CRYPTO_VERSION = 1;
export const DEFAULT_CHUNK_SIZE = 1 << 20; // 1 MiB plaintext chunks
const NONCE_PREFIX_BYTES = 8;
const COUNTER_BYTES = 4;
const GCM_TAG_BYTES = 16;
const PBKDF2_ITERATIONS = 310_000;

const subtle = () => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) throw new Error("WebCrypto is unavailable in this context");
  return c.subtle;
};

const randomBytes = (n: number): Uint8Array => {
  const b = new Uint8Array(n);
  (globalThis as { crypto: Crypto }).crypto.getRandomValues(b);
  return b;
};

// ── base64 helpers ───────────────────────────────────────────────────────────

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── vault key + recovery ───────────────────────────────────────────────────

export interface WrappedVaultBackup {
  version: number;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

/** A fresh recovery secret the user must store; it is never sent to the server. */
export function generateRecoverySecret(): string {
  return toBase64(randomBytes(32));
}

export function generateVaultKeyRaw(): Uint8Array {
  return randomBytes(32);
}

async function deriveKek(recoverySecret: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(recoverySecret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt the raw vault key under the recovery secret for server backup. */
export async function wrapVaultKey(
  rawVaultKey: Uint8Array,
  recoverySecret: string
): Promise<WrappedVaultBackup> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveKek(recoverySecret, salt, PBKDF2_ITERATIONS);
  const ct = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv: iv as BufferSource }, kek, rawVaultKey as BufferSource)
  );
  return {
    version: DROP_CRYPTO_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ct),
  };
}

/** Recover the raw vault key from a server backup using the recovery secret. */
export async function unwrapVaultKey(
  backup: WrappedVaultBackup,
  recoverySecret: string
): Promise<Uint8Array> {
  const kek = await deriveKek(recoverySecret, fromBase64(backup.salt), backup.iterations);
  const plain = await subtle().decrypt(
    { name: "AES-GCM", iv: fromBase64(backup.iv) as BufferSource },
    kek,
    fromBase64(backup.ciphertext) as BufferSource
  );
  return new Uint8Array(plain);
}

// ── per-file data keys ───────────────────────────────────────────────────────

export function generateDataKeyRaw(): Uint8Array {
  return randomBytes(32);
}

async function importVaultKey(rawVaultKey: Uint8Array): Promise<CryptoKey> {
  return subtle().importKey("raw", rawVaultKey as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Wrap a per-file data key with the vault key (result is base64 iv‖ciphertext). */
export async function wrapDataKey(
  rawDataKey: Uint8Array,
  rawVaultKey: Uint8Array
): Promise<string> {
  const vaultKey = await importVaultKey(rawVaultKey);
  const iv = randomBytes(12);
  const ct = new Uint8Array(
    await subtle().encrypt({ name: "AES-GCM", iv: iv as BufferSource }, vaultKey, rawDataKey as BufferSource)
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return toBase64(combined);
}

export async function unwrapDataKey(
  wrapped: string,
  rawVaultKey: Uint8Array
): Promise<Uint8Array> {
  const vaultKey = await importVaultKey(rawVaultKey);
  const combined = fromBase64(wrapped);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const plain = await subtle().decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    vaultKey,
    ct as BufferSource
  );
  return new Uint8Array(plain);
}

// ── chunked file encryption ──────────────────────────────────────────────────

export interface ChunkCryptoParams {
  version: number;
  chunkSize: number;
  noncePrefix: Uint8Array;
}

export function makeChunkParams(chunkSize = DEFAULT_CHUNK_SIZE): ChunkCryptoParams {
  return { version: DROP_CRYPTO_VERSION, chunkSize, noncePrefix: randomBytes(NONCE_PREFIX_BYTES) };
}

function ivForChunk(noncePrefix: Uint8Array, counter: number): Uint8Array {
  const iv = new Uint8Array(NONCE_PREFIX_BYTES + COUNTER_BYTES);
  iv.set(noncePrefix, 0);
  new DataView(iv.buffer).setUint32(NONCE_PREFIX_BYTES, counter, false);
  return iv;
}

/** Associated data binds each chunk to its version, file nonce, index, and finality. */
function aadForChunk(params: ChunkCryptoParams, counter: number, isFinal: boolean): Uint8Array {
  const aad = new Uint8Array(4 + NONCE_PREFIX_BYTES + COUNTER_BYTES + 1);
  const view = new DataView(aad.buffer);
  view.setUint32(0, params.version, false);
  aad.set(params.noncePrefix, 4);
  view.setUint32(4 + NONCE_PREFIX_BYTES, counter, false);
  aad[aad.length - 1] = isFinal ? 1 : 0;
  return aad;
}

/** The on-disk size of an encrypted chunk given its plaintext length. */
export function encryptedChunkLength(plaintextLength: number): number {
  return plaintextLength + GCM_TAG_BYTES;
}

export async function encryptChunk(
  rawDataKey: Uint8Array,
  params: ChunkCryptoParams,
  counter: number,
  plaintext: Uint8Array,
  isFinal: boolean
): Promise<Uint8Array> {
  const key = await importVaultKey(rawDataKey);
  const ct = await subtle().encrypt(
    {
      name: "AES-GCM",
      iv: ivForChunk(params.noncePrefix, counter) as BufferSource,
      additionalData: aadForChunk(params, counter, isFinal) as BufferSource,
    },
    key,
    plaintext as BufferSource
  );
  return new Uint8Array(ct);
}

export async function decryptChunk(
  rawDataKey: Uint8Array,
  params: ChunkCryptoParams,
  counter: number,
  ciphertext: Uint8Array,
  isFinal: boolean
): Promise<Uint8Array> {
  const key = await importVaultKey(rawDataKey);
  const plain = await subtle().decrypt(
    {
      name: "AES-GCM",
      iv: ivForChunk(params.noncePrefix, counter) as BufferSource,
      additionalData: aadForChunk(params, counter, isFinal) as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );
  return new Uint8Array(plain);
}
