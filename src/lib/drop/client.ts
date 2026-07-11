import { getCurrentAuthToken } from "@/context/appkit";
import { GatewayApiError } from "@/lib/gateway/client";
import type { WrappedVaultBackup } from "./crypto";
import {
  normalizeDropFile,
  normalizeDropNode,
  normalizeDropPublicFile,
  normalizeDropUpload,
  normalizeDropUsage,
} from "./normalize";
import type {
  DropFile,
  DropNode,
  DropPublicFile,
  DropScope,
  DropUpload,
  DropUploadInit,
  DropUsage,
  DropWebuiSession,
} from "./types";

const CLIENT_HEADER = "webapp";

/** Browser calls the same-origin `/api/gateway/*` proxy, which prepends `api/v2/`. */
function dropUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(path.replace(/^\/+/, ""), `${window.location.origin}/api/gateway/`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

function authHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  headers.set("X-Erebrus-Client", CLIENT_HEADER);
  const token = getCurrentAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function dropJson<T>(
  path: string,
  options: {
    method?: string;
    params?: Record<string, string | undefined>;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const headers = authHeaders();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const res = await fetch(dropUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    cache: "no-store",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(res: Response): Promise<GatewayApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => "");
  }
  const message =
    typeof body === "object" && body !== null && "error" in body
      ? String((body as { error: string }).error)
      : `Drop request failed (${res.status})`;
  return new GatewayApiError(message, res.status, body);
}

function asArray<T>(data: unknown, map: (r: Record<string, unknown>) => T): T[] {
  return Array.isArray(data) ? data.map((d) => map(d as Record<string, unknown>)) : [];
}

// ── Node discovery ───────────────────────────────────────────────────────────

export async function fetchDropNodes(scope: DropScope, orgId?: string): Promise<DropNode[]> {
  const data = await dropJson<unknown>("drop/nodes", {
    params: { scope, org_id: scope === "private" ? orgId : undefined },
  });
  return asArray(data, normalizeDropNode);
}

// ── Usage ──────────────────────────────────────────────────────────────────

export async function fetchDropUsage(orgId?: string): Promise<DropUsage> {
  const path = orgId ? `orgs/${orgId}/drop/usage` : "drop/usage";
  return normalizeDropUsage(await dropJson<Record<string, unknown>>(path));
}

// ── Files ────────────────────────────────────────────────────────────────────

export async function fetchDropFiles(orgId?: string): Promise<DropFile[]> {
  const path = orgId ? `orgs/${orgId}/drop/files` : "drop/files";
  return asArray(await dropJson<unknown>(path), normalizeDropFile);
}

export async function fetchDropFile(fileId: string): Promise<DropFile> {
  return normalizeDropFile(await dropJson<Record<string, unknown>>(`drop/files/${fileId}`));
}

export async function deleteDropFile(fileId: string): Promise<void> {
  await dropJson<void>(`drop/files/${fileId}`, { method: "DELETE" });
}

// ── Upload lifecycle ───────────────────────────────────────────────────────

export async function createDropUpload(init: DropUploadInit): Promise<DropUpload> {
  return normalizeDropUpload(
    await dropJson<Record<string, unknown>>("drop/uploads", { method: "POST", body: init })
  );
}

export async function getDropUpload(uploadId: string): Promise<DropUpload> {
  return normalizeDropUpload(
    await dropJson<Record<string, unknown>>(`drop/uploads/${uploadId}`)
  );
}

/**
 * Stream a file/blob body to the gateway with upload progress. Uses XHR because
 * `fetch` exposes no upload-progress events; the body is sent directly (never
 * base64-encoded and never accumulated into application state).
 */
export function uploadDropContent(
  uploadId: string,
  body: Blob,
  opts: {
    contentType?: string;
    onProgress?: (sentBytes: number, totalBytes: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<DropUpload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", dropUrl(`drop/uploads/${uploadId}/content`));
    const token = getCurrentAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("X-Erebrus-Client", CLIENT_HEADER);
    xhr.setRequestHeader("Content-Type", opts.contentType ?? "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        } catch {
          parsed = {};
        }
        resolve(normalizeDropUpload({ upload_id: uploadId, ...parsed }));
      } else {
        let bodyObj: unknown = xhr.responseText;
        try {
          bodyObj = JSON.parse(xhr.responseText);
        } catch {
          /* keep text */
        }
        const message =
          typeof bodyObj === "object" && bodyObj !== null && "error" in bodyObj
            ? String((bodyObj as { error: string }).error)
            : `Upload failed (${xhr.status})`;
        reject(new GatewayApiError(message, xhr.status, bodyObj));
      }
    };
    xhr.onerror = () => reject(new GatewayApiError("Upload network error", 0));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort();
        return;
      }
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

/**
 * Stream a file's content back from the gateway. Returns the raw streamed
 * Response so callers can pipe/decrypt without buffering the whole file.
 */
export async function fetchDropContent(
  fileId: string,
  opts: { signal?: AbortSignal } = {}
): Promise<Response> {
  const res = await fetch(dropUrl(`drop/files/${fileId}/content`), {
    headers: authHeaders(),
    cache: "no-store",
    signal: opts.signal,
  });
  if (!res.ok) throw await toApiError(res);
  return res;
}

// ── Encryption vault backup ──────────────────────────────────────────────────

/**
 * Fetch the account's wrapped Drop vault backup. Returns null when no vault has
 * been set up yet. The gateway only ever stores the wrapped (encrypted) form.
 */
export async function fetchDropVault(): Promise<WrappedVaultBackup | null> {
  try {
    const data = await dropJson<WrappedVaultBackup | null>("drop/crypto/vault");
    return data && typeof data === "object" && "ciphertext" in data ? data : null;
  } catch (err) {
    if (err instanceof GatewayApiError && err.status === 404) return null;
    throw err;
  }
}

export async function putDropVault(backup: WrappedVaultBackup): Promise<void> {
  await dropJson<void>("drop/crypto/vault", { method: "PUT", body: backup });
}

// ── Private-node Kubo WebUI ──────────────────────────────────────────────────

/**
 * Open a short-lived, same-origin gateway proxy session to a private node's
 * Kubo WebUI. The gateway authorizes the caller as a node operator and returns
 * only a proxy URL — the raw Kubo RPC endpoint is never exposed to the client.
 */
export async function createDropWebuiSession(
  orgId: string,
  nodeId: string
): Promise<DropWebuiSession> {
  const data = await dropJson<Record<string, unknown>>(
    `orgs/${orgId}/nodes/${nodeId}/drop/webui/session`,
    { method: "POST" }
  );
  const url = typeof data.url === "string" ? data.url : "";
  if (!url) throw new GatewayApiError("No WebUI session URL returned", 502, data);
  return { url, expires_at: typeof data.expires_at === "string" ? data.expires_at : undefined };
}

// ── Public sharing ───────────────────────────────────────────────────────────

export async function fetchPublicDropFile(fileId: string): Promise<DropPublicFile> {
  return normalizeDropPublicFile(
    await dropJson<Record<string, unknown>>(`drop/public/${fileId}`, {})
  );
}

export function publicDropContentUrl(fileId: string): string {
  return dropUrl(`drop/public/${fileId}/content`);
}
