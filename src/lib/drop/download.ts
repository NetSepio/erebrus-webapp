import { saveAs } from "file-saver";
import { fetchDropContent } from "./client";
import type { DropFile } from "./types";

/**
 * Turns an encrypted file's ciphertext into a decrypted Blob. Phase 3 supplies
 * a Web Worker-backed implementation that unwraps the per-file data key with
 * the account vault key. Encrypted files cannot be downloaded without it.
 */
export type DecryptContent = (file: DropFile, ciphertext: ArrayBuffer) => Promise<Blob>;

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
    res = await fetchDropContent(file.id, { signal: opts.signal });
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
