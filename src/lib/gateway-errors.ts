import { GatewayApiError } from "@/lib/gateway/client";

/**
 * Next steps the UI can offer next to a gateway error. The gateway enforces
 * every limit; this module only turns its `{ error, code, details }` envelope
 * into clear copy and actions.
 */
export type GatewayErrorAction =
  | "upgrade"
  | "remove_device"
  | "pick_node"
  | "retry"
  | "contact_owner"
  | "signin";

export interface GatewayErrorDescription {
  code: string | null;
  message: string;
  actions: GatewayErrorAction[];
}

/** Machine-readable code from a gateway error body, if any. */
export function gatewayErrorCode(err: unknown): string | null {
  if (!(err instanceof GatewayApiError)) return null;
  const body = err.body;
  if (body && typeof body === "object" && "code" in body) {
    const code = (body as { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
  }
  return null;
}

function gatewayErrorDetails(err: unknown): Record<string, unknown> {
  if (!(err instanceof GatewayApiError)) return {};
  const body = err.body;
  if (body && typeof body === "object" && "details" in body) {
    const details = (body as { details?: unknown }).details;
    if (details && typeof details === "object") return details as Record<string, unknown>;
  }
  return {};
}

/** Decimal storage units matching gateway quotas (1 GB = 1,000,000,000 bytes). */
export function formatStorageBytes(bytes?: number | null): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  const value = bytes / 1000 ** i;
  const rounded = value >= 100 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${rounded.replace(/\.0$/, "")} ${units[i]}`;
}

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

type Describer = (details: Record<string, unknown>) => Omit<GatewayErrorDescription, "code">;

const BY_CODE: Record<string, Describer> = {
  VPN_DEVICE_LIMIT: (d) => {
    const limit = num(d.limit);
    const used = num(d.used);
    const count = limit != null ? ` (${used ?? limit}/${limit})` : "";
    return {
      message: `Device limit reached${count}. Remove a device or upgrade your plan.`,
      actions: ["remove_device", "upgrade"],
    };
  },
  VPN_DEVICE_PAUSED: () => ({
    message: "This device is paused because your plan no longer covers it. Remove another device or upgrade to use it again.",
    actions: ["remove_device", "upgrade"],
  }),
  ENTITLEMENT_REQUIRED: () => ({
    message: "You need an active workspace to use public nodes. Refresh or sign in again.",
    actions: ["retry"],
  }),
  BILLING_ACCESS_REQUIRED: () => ({
    message: "This managed node isn't covered by the workspace's current billing. Restore billing to reconnect.",
    actions: ["contact_owner"],
  }),
  TIER_REQUIRED: () => ({
    message: "This node needs a higher XP rank. Pick an open-pool node.",
    actions: ["pick_node"],
  }),
  PRIVATE_NODE_ACCESS: () => ({
    message: "This is a private workspace node — you need to be a member to connect.",
    actions: ["pick_node"],
  }),
  NODE_DRAINING: () => ({
    message: "This node is draining and not accepting new devices. Pick another node.",
    actions: ["pick_node"],
  }),
  NODE_CAPACITY: () => ({
    message: "This node is at capacity. Pick another node.",
    actions: ["pick_node"],
  }),
  NODE_UNREACHABLE: () => ({
    message: "The node could not be reached, so no device was created. Try again or pick another node.",
    actions: ["retry", "pick_node"],
  }),
  IDEMPOTENCY_CONFLICT: () => ({
    message: "A previous attempt is still being processed. Try again.",
    actions: ["retry"],
  }),
  API_KEY_PLAN_REQUIRED: () => ({
    message: "Gateway API keys need the Starter plan or higher. Upgrade this workspace to create or use keys.",
    actions: ["upgrade"],
  }),
  SEAT_LIMIT: () => ({
    message: "No paid seats left on this workspace's plan — Starter includes only the owner's seat. Invite them as a free member instead.",
    actions: ["upgrade"],
  }),
  PLAN_REQUIRED: () => ({
    message: "This workspace's plan doesn't include this service. Upgrade to use it.",
    actions: ["upgrade"],
  }),
  BILLING_ALREADY_SUBSCRIBED: () => ({
    message: "You already have a personal plan on another workspace, and it applies across all your workspaces. Business plans can still be added to other workspaces.",
    actions: [],
  }),
  DROP_QUOTA_EXCEEDED: () => ({
    message: "Your Drop storage is full. Delete files or upgrade for more space.",
    actions: ["upgrade"],
  }),
  DROP_FILE_TOO_LARGE: (d) => ({
    message: `This file is larger than the ${formatStorageBytes(num(d.max_file_bytes) ?? 1_000_000_000)} per-file limit.`,
    actions: [],
  }),
  DROP_NODE_CAPACITY: () => ({
    message: "This Drop node is full. Pick another node.",
    actions: ["pick_node"],
  }),
  DROP_NODE_UNAVAILABLE: () => ({
    message: "This Drop node isn't accepting uploads right now. Pick another node or try again.",
    actions: ["retry", "pick_node"],
  }),
};

/** Clear copy + next steps for any gateway (or network) error. */
export function describeGatewayError(err: unknown): GatewayErrorDescription {
  const code = gatewayErrorCode(err);
  if (code && BY_CODE[code]) return { code, ...BY_CODE[code](gatewayErrorDetails(err)) };
  if (err instanceof GatewayApiError) {
    if (err.status === 401) return { code, message: "Your session expired. Sign in again.", actions: ["signin"] };
    if (err.status === 429) return { code, message: "Too many requests. Wait a moment and try again.", actions: ["retry"] };
    if (err.status >= 500) return { code, message: "Erebrus is temporarily unavailable. Try again shortly.", actions: ["retry"] };
    return { code, message: err.message, actions: [] };
  }
  return { code: null, message: "Could not reach Erebrus. Check your connection and try again.", actions: ["retry"] };
}
