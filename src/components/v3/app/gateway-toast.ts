"use client";

import { toast } from "sonner";
import { describeGatewayError, type GatewayErrorAction } from "@/lib/gateway-errors";

const ACTION_LABELS: Partial<Record<GatewayErrorAction, string>> = {
  upgrade: "Upgrade",
  remove_device: "Manage devices",
  pick_node: "Pick another node",
  retry: "Retry",
};

export interface GatewayToastHandlers {
  onRetry?: () => void;
  onRemoveDevice?: () => void;
  onPickNode?: () => void;
}

/**
 * Show a gateway error with its clear message and the single most useful next
 * step as a toast action. Returns the description for inline rendering too.
 */
export function toastGatewayError(err: unknown, handlers: GatewayToastHandlers = {}) {
  const described = describeGatewayError(err);
  const run: Partial<Record<GatewayErrorAction, (() => void) | undefined>> = {
    upgrade: () => window.location.assign("/pricing"),
    remove_device: handlers.onRemoveDevice,
    pick_node: handlers.onPickNode,
    retry: handlers.onRetry,
  };
  const primary = described.actions.find((a) => run[a]);
  toast.error(described.message, primary
    ? { action: { label: ACTION_LABELS[primary] ?? "OK", onClick: () => run[primary]?.() } }
    : undefined);
  return described;
}
