import {
  DEFAULT_CHUNK_SIZE,
  DROP_CRYPTO_VERSION,
  type ChunkCryptoParams,
} from "./crypto";

/**
 * Thin RPC wrapper around the Drop crypto Web Worker. A single worker instance
 * is reused; each call is correlated by an id so concurrent operations don't
 * cross wires.
 */

export interface EncryptResult {
  blob: Blob;
  sha256: string;
  plaintextSize: number;
  ciphertextSize: number;
}

type ProgressCb = (processed: number, total: number) => void;

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker {
  if (typeof window === "undefined") throw new Error("Drop crypto requires a browser");
  if (!worker) {
    worker = new Worker(new URL("./crypto.worker.ts", import.meta.url));
  }
  return worker;
}

function call<T>(
  message: Record<string, unknown> & { type: string },
  onProgress: ProgressCb | undefined,
  resolveType: string,
  extract: (data: Record<string, unknown>) => T
): Promise<T> {
  const w = getWorker();
  const id = `op-${(seq += 1)}`;
  return new Promise<T>((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown>;
      if (data.id !== id) return;
      if (data.type === "progress") {
        onProgress?.(Number(data.processed), Number(data.total));
      } else if (data.type === resolveType) {
        w.removeEventListener("message", handler);
        resolve(extract(data));
      } else if (data.type === "error") {
        w.removeEventListener("message", handler);
        reject(new Error(String(data.message ?? "Crypto worker error")));
      }
    };
    w.addEventListener("message", handler);
    w.postMessage({ ...message, id });
  });
}

export async function encryptFileInWorker(
  file: File,
  dataKey: Uint8Array,
  params: ChunkCryptoParams,
  onProgress?: ProgressCb
): Promise<EncryptResult> {
  const dataKeyBuf = dataKey.slice().buffer;
  const noncePrefixBuf = params.noncePrefix.slice().buffer;
  return call<EncryptResult>(
    {
      type: "encrypt",
      file,
      dataKey: dataKeyBuf,
      noncePrefix: noncePrefixBuf,
      chunkSize: params.chunkSize || DEFAULT_CHUNK_SIZE,
      version: params.version || DROP_CRYPTO_VERSION,
    },
    onProgress,
    "encrypted",
    (data) => ({
      blob: data.blob as Blob,
      sha256: String(data.sha256),
      plaintextSize: Number(data.plaintextSize),
      ciphertextSize: Number(data.ciphertextSize),
    })
  );
}

export async function hashFileInWorker(
  file: File,
  onProgress?: ProgressCb
): Promise<string> {
  return call<string>(
    { type: "hash", file, chunkSize: DEFAULT_CHUNK_SIZE },
    onProgress,
    "hashed",
    (data) => String(data.sha256)
  );
}

export async function decryptDataInWorker(
  data: ArrayBuffer,
  dataKey: Uint8Array,
  params: ChunkCryptoParams,
  onProgress?: ProgressCb
): Promise<Blob> {
  const dataKeyBuf = dataKey.slice().buffer;
  const noncePrefixBuf = params.noncePrefix.slice().buffer;
  return call<Blob>(
    {
      type: "decrypt",
      data,
      dataKey: dataKeyBuf,
      noncePrefix: noncePrefixBuf,
      chunkSize: params.chunkSize || DEFAULT_CHUNK_SIZE,
      version: params.version || DROP_CRYPTO_VERSION,
    },
    onProgress,
    "decrypted",
    (d) => d.blob as Blob
  );
}
