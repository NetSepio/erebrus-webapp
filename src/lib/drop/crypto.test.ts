import { describe, expect, it } from "vitest";
import {
  decryptChunk,
  encryptChunk,
  fromBase64,
  generateDataKeyRaw,
  generateVaultKeyRaw,
  makeChunkParams,
  toBase64,
  unwrapDataKey,
  unwrapVaultKey,
  wrapDataKey,
  wrapVaultKey,
} from "./crypto";

describe("base64", () => {
  it("round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 128]);
    expect(Array.from(fromBase64(toBase64(bytes)))).toEqual(Array.from(bytes));
  });
});

describe("vault key backup", () => {
  it("wraps and unwraps with the correct recovery secret", async () => {
    const vaultKey = generateVaultKeyRaw();
    const secret = "correct horse battery staple";
    const backup = await wrapVaultKey(vaultKey, secret);
    expect(backup.ciphertext).not.toContain(toBase64(vaultKey));
    const recovered = await unwrapVaultKey(backup, secret);
    expect(Array.from(recovered)).toEqual(Array.from(vaultKey));
  });

  it("fails to unwrap with a wrong recovery secret", async () => {
    const backup = await wrapVaultKey(generateVaultKeyRaw(), "right-secret");
    await expect(unwrapVaultKey(backup, "wrong-secret")).rejects.toBeDefined();
  });
});

describe("per-file data key wrapping", () => {
  it("wraps a data key under the vault key and unwraps it back", async () => {
    const vaultKey = generateVaultKeyRaw();
    const dataKey = generateDataKeyRaw();
    const wrapped = await wrapDataKey(dataKey, vaultKey);
    const unwrapped = await unwrapDataKey(wrapped, vaultKey);
    expect(Array.from(unwrapped)).toEqual(Array.from(dataKey));
  });

  it("cannot unwrap with a different vault key", async () => {
    const wrapped = await wrapDataKey(generateDataKeyRaw(), generateVaultKeyRaw());
    await expect(unwrapDataKey(wrapped, generateVaultKeyRaw())).rejects.toBeDefined();
  });
});

describe("chunked AES-256-GCM", () => {
  it("round-trips a chunk with matching counter and finality", async () => {
    const dataKey = generateDataKeyRaw();
    const params = makeChunkParams(1024);
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const ct = await encryptChunk(dataKey, params, 0, plaintext, true);
    const pt = await decryptChunk(dataKey, params, 0, ct, true);
    expect(Array.from(pt)).toEqual(Array.from(plaintext));
  });

  it("rejects a reordered chunk (wrong counter)", async () => {
    const dataKey = generateDataKeyRaw();
    const params = makeChunkParams(1024);
    const ct = await encryptChunk(dataKey, params, 0, new Uint8Array([9, 9]), false);
    await expect(decryptChunk(dataKey, params, 1, ct, false)).rejects.toBeDefined();
  });

  it("rejects a truncated stream (final flag mismatch)", async () => {
    const dataKey = generateDataKeyRaw();
    const params = makeChunkParams(1024);
    const ct = await encryptChunk(dataKey, params, 0, new Uint8Array([7]), false);
    await expect(decryptChunk(dataKey, params, 0, ct, true)).rejects.toBeDefined();
  });
});
