import { saveAs } from "file-saver";
import { fetchDropContent, publicContentSources, type PublicContentRef } from "./client";
import type { DropFile } from "./types";

/**
 * Turns an encrypted file's ciphertext into a decrypted Blob. Phase 3 supplies
 * a Web Worker-backed implementation that unwraps the per-file data key with
 * the account vault key. Encrypted files cannot be downloaded without it.
 */
export type DecryptContent = (file: DropFile, ciphertext: ArrayBuffer) => Promise<Blob>;

/**
 * Fetch a file's content. Public files stream from the same-origin Erebrus
 * gateway proxy, which can source the same CID from any pinned node so a
 * downed node doesn't break retrieval. Encrypted/private files stream from
 * the authenticated gateway proxy.
 */
async function fetchContentWithFallback(
  file: DropFile,
  signal?: AbortSignal
): Promise<Response> {
  if (file.encrypted || file.visibility !== "public") {
    return fetchDropContent(file.id, { signal });
  }
  const sources = publicContentSources(file);
  let lastError: unknown;
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal, redirect: "follow" });
      if (res.ok && res.body) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not fetch file from any source");
}

/**
 * Stream a file's content from the gateway and save it. Unencrypted files are
 * streamed straight to a Blob sink (never base64, never held in React state);
 * encrypted files are decrypted via the provided worker-backed decryptor.
 */
export async function downloadDropFile(
  file: DropFile,
  opts: { decrypt?: DecryptContent; signal?: AbortSignal } = {}
): Promise<void> {
  const directSink = file.encrypted ? null : await openDirectSaveSink(file);
  let res: Response;
  try {
    res = await fetchContentWithFallback(file, opts.signal);
    if (!res.body) throw new Error("Empty response body");
  } catch (error) {
    await directSink?.abort(error);
    throw error;
  }

  if (file.encrypted) {
    if (!opts.decrypt) {
      throw new Error("This file is encrypted — unlock your Drop vault to download it.");
    }
    const ciphertext = await res.arrayBuffer();
    const plaintext = await opts.decrypt(file, ciphertext);
    saveAs(new Blob([plaintext], { type: file.content_type }), file.filename);
    return;
  }

  if (directSink) {
    await res.body.pipeTo(directSink);
    return;
  }

  const parts: BlobPart[] = [];
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const chunk = new ArrayBuffer(value.byteLength);
      new Uint8Array(chunk).set(value);
      parts.push(chunk);
    }
  }

  saveAs(new Blob(parts, { type: file.content_type }), file.filename);
}

/**
 * Download a public file from the opaque share page through the Erebrus gateway
 * proxy. Tolerates a downed node since the CID is content-addressed.
 */
export async function downloadPublicRef(
  file: PublicContentRef & { filename: string; content_type: string },
  signal?: AbortSignal
): Promise<void> {
  const sources = publicContentSources(file);
  let lastError: unknown;
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal, redirect: "follow" });
      if (!res.ok || !res.body) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const parts: BlobPart[] = [];
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = new ArrayBuffer(value.byteLength);
          new Uint8Array(chunk).set(value);
          parts.push(chunk);
        }
      }
      saveAs(new Blob(parts, { type: file.content_type }), file.filename);
      return;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not fetch file from any source");
}

interface DropSaveFileHandle {
  createWritable(): Promise<WritableStream<Uint8Array>>;
}

type DropSaveFilePicker = (options: {
  suggestedName: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}) => Promise<DropSaveFileHandle>;

async function openDirectSaveSink(
  file: DropFile
): Promise<WritableStream<Uint8Array> | null> {
  const picker = (
    window as Window & { showSaveFilePicker?: DropSaveFilePicker }
  ).showSaveFilePicker;
  if (!picker) return null;
  try {
    const handle = await picker({
      suggestedName: file.filename,
      types: [
        {
          description: file.content_type || "File",
          accept: { [file.content_type || "application/octet-stream"]: [".bin"] },
        },
      ],
    });
    return handle.createWritable();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DOMException("Download canceled", "AbortError");
    }
    return null;
  }
}
