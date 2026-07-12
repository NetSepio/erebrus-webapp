import {
  fromBase64,
  generateDataKeyRaw,
  makeChunkParams,
  toBase64,
  unwrapDataKey,
  wrapDataKey,
} from "./crypto";
import { encryptFileInWorker, decryptDataInWorker } from "./crypto-worker-client";
import type { PrepareContent } from "@/hooks/use-drop-uploads";
import type { DecryptContent } from "./download";
import type { DropEncryptionMetadata } from "./types";

/** Vault key accessor — returns the in-memory raw vault key, or null when locked. */
export type VaultKeyGetter = () => Uint8Array | null;

/**
 * Build a `prepare` step that encrypts a file before upload: a fresh random
 * per-file data key encrypts the content (chunked AES-256-GCM in a worker) and
 * is itself wrapped with the account vault key. Only the wrapped data key is
 * placed in gateway metadata — the plaintext data key never leaves memory.
 */
export function makeEncryptingPrepare(getVaultKey: VaultKeyGetter): PrepareContent {
  return async (item) => {
    const vaultKey = getVaultKey();
    if (!vaultKey) {
      throw new Error("Drop vault is locked — unlock it to upload private files.");
    }
    const dataKey = generateDataKeyRaw();
    const params = makeChunkParams();
    try {
      const result = await encryptFileInWorker(item.file, dataKey, params);
      const wrappedDataKey = await wrapDataKey(dataKey, vaultKey);
      const encryptionMetadata: DropEncryptionMetadata = {
        version: params.version,
        algorithm: "AES-256-GCM",
        chunk_size: params.chunkSize,
        nonce_prefix: toBase64(params.noncePrefix),
        plaintext_size: result.plaintextSize,
        ciphertext_size: result.ciphertextSize,
        wrapped_data_key: wrappedDataKey,
        key_context: "vault-v1",
      };

      return {
        blob: result.blob,
        contentType: "application/octet-stream",
        encrypted: true,
        encryptionMetadata,
        sha256: result.sha256,
      };
    } finally {
      dataKey.fill(0);
    }
  };
}

/** Build the decryptor used when downloading an encrypted file. */
export function makeDecryptor(getVaultKey: VaultKeyGetter): DecryptContent {
  return async (file, ciphertext) => {
    const meta = file.encryption_metadata;
    if (!meta) throw new Error("Missing encryption metadata for this file.");
    const vaultKey = getVaultKey();
    if (!vaultKey) throw new Error("Drop vault is locked — unlock it to download.");

    const dataKey = await unwrapDataKey(meta.wrapped_data_key, vaultKey);
    try {
      return await decryptDataInWorker(ciphertext, dataKey, {
        version: meta.version,
        chunkSize: meta.chunk_size,
        noncePrefix: fromBase64(meta.nonce_prefix),
      });
    } finally {
      dataKey.fill(0);
    }
  };
}
