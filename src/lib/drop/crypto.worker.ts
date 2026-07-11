/// <reference lib="webworker" />
/**
 * Off-main-thread Drop crypto worker: SHA-256 hashing and chunked AES-256-GCM
 * encryption/decryption. Keeping this in a worker prevents large-file crypto
 * from blocking the UI. Raw key material only ever lives inside this worker for
 * the duration of a single operation and is never logged or persisted.
 */
import {
  DEFAULT_CHUNK_SIZE,
  DROP_CRYPTO_VERSION,
  decryptChunk,
  encryptChunk,
  encryptedChunkLength,
  type ChunkCryptoParams,
} from "./crypto";
import CryptoJS from "crypto-js";

type EncryptRequest = {
  id: string;
  type: "encrypt";
  file: File;
  dataKey: ArrayBuffer;
  noncePrefix: ArrayBuffer;
  chunkSize: number;
  version: number;
};

type DecryptRequest = {
  id: string;
  type: "decrypt";
  data: ArrayBuffer;
  dataKey: ArrayBuffer;
  noncePrefix: ArrayBuffer;
  chunkSize: number;
  version: number;
};

type HashRequest = {
  id: string;
  type: "hash";
  file: File;
  chunkSize: number;
};

type WorkerRequest = EncryptRequest | DecryptRequest | HashRequest;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/** Copy a view into a fresh, standalone ArrayBuffer usable as a BlobPart. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

function updateSHA256(
  hasher: ReturnType<typeof CryptoJS.algo.SHA256.create>,
  bytes: Uint8Array
) {
  hasher.update(CryptoJS.lib.WordArray.create(bytes as unknown as number[]));
}

async function handleHash(req: HashRequest) {
  const hasher = CryptoJS.algo.SHA256.create();
  const chunkSize = req.chunkSize || DEFAULT_CHUNK_SIZE;
  for (let offset = 0; offset < req.file.size; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, req.file.size);
    updateSHA256(hasher, new Uint8Array(await req.file.slice(offset, end).arrayBuffer()));
    ctx.postMessage({ id: req.id, type: "progress", processed: end, total: req.file.size });
  }
  ctx.postMessage({ id: req.id, type: "hashed", sha256: hasher.finalize().toString() });
}

async function handleEncrypt(req: EncryptRequest) {
  const params: ChunkCryptoParams = {
    version: req.version || DROP_CRYPTO_VERSION,
    chunkSize: req.chunkSize || DEFAULT_CHUNK_SIZE,
    noncePrefix: new Uint8Array(req.noncePrefix),
  };
  const dataKey = new Uint8Array(req.dataKey);
  const hasher = CryptoJS.algo.SHA256.create();

  const parts: BlobPart[] = [];
  const total = req.file.size;
  let counter = 0;
  let offset = 0;
  // A zero-length file still produces exactly one authenticated (final) chunk.
  do {
    const end = Math.min(offset + params.chunkSize, total);
    const isFinal = end >= total;
    const chunk = new Uint8Array(await req.file.slice(offset, end).arrayBuffer());
    const ct = await encryptChunk(dataKey, params, counter, chunk, isFinal);
    updateSHA256(hasher, ct);
    parts.push(toArrayBuffer(ct));
    offset = end;
    counter += 1;
    ctx.postMessage({ id: req.id, type: "progress", processed: offset, total });
  } while (offset < total);

  const blob = new Blob(parts, { type: "application/octet-stream" });
  ctx.postMessage({
    id: req.id,
    type: "encrypted",
    blob,
    sha256: hasher.finalize().toString(),
    plaintextSize: total,
    ciphertextSize: blob.size,
  });
}

async function handleDecrypt(req: DecryptRequest) {
  const params: ChunkCryptoParams = {
    version: req.version || DROP_CRYPTO_VERSION,
    chunkSize: req.chunkSize || DEFAULT_CHUNK_SIZE,
    noncePrefix: new Uint8Array(req.noncePrefix),
  };
  const dataKey = new Uint8Array(req.dataKey);
  const data = new Uint8Array(req.data);
  const encChunkSize = encryptedChunkLength(params.chunkSize);

  const parts: BlobPart[] = [];
  const total = data.length;
  let counter = 0;
  let offset = 0;
  do {
    const end = Math.min(offset + encChunkSize, total);
    const isFinal = end >= total;
    const chunk = data.subarray(offset, end);
    const pt = await decryptChunk(dataKey, params, counter, chunk, isFinal);
    parts.push(toArrayBuffer(pt));
    offset = end;
    counter += 1;
    ctx.postMessage({ id: req.id, type: "progress", processed: offset, total });
  } while (offset < total);

  const blob = new Blob(parts, { type: "application/octet-stream" });
  ctx.postMessage({ id: req.id, type: "decrypted", blob });
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === "encrypt") await handleEncrypt(req);
    else if (req.type === "decrypt") await handleDecrypt(req);
    else await handleHash(req);
  } catch (err) {
    ctx.postMessage({
      id: req.id,
      type: "error",
      message: err instanceof Error ? err.message : "Crypto worker error",
    });
  } finally {
    if (req.type === "encrypt" || req.type === "decrypt") {
      new Uint8Array(req.dataKey).fill(0);
    }
  }
};
