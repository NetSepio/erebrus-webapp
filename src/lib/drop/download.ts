import { saveAs } from "file-saver";
import { fetchDropContent } from "./client";
import type { DropFile } from "./types";

/**
 * Transforms an encrypted content stream into plaintext. Phase 3 supplies a
 * Web Worker-backed decryptor; unencrypted files use the identity passthrough.
 */
export type DecryptStream = (
  input: ReadableStream<Uint8Array>,
  file: DropFile
) => ReadableStream<Uint8Array>;

const identityStream: DecryptStream = (input) => input;

/**
 * Stream a file's content from the gateway and save it, decrypting on the fly
 * when the file is encrypted. The bytes are streamed through a Blob sink rather
 * than base64-encoded or held in React state.
 */
export async function downloadDropFile(
  file: DropFile,
  opts: { decrypt?: DecryptStream; signal?: AbortSignal } = {}
): Promise<void> {
  const res = await fetchDropContent(file.id, { signal: opts.signal });
  if (!res.body) throw new Error("Empty response body");

  const decrypt = file.encrypted ? opts.decrypt ?? identityStream : identityStream;
  const plaintext = decrypt(res.body, file);

  const parts: BlobPart[] = [];
  const reader = plaintext.getReader();
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
