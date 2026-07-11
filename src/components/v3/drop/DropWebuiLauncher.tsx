"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, MonoLabel, ActionButton } from "@/components/v3/ui";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { createDropWebuiSession } from "@/lib/drop/client";
import { GatewayApiError } from "@/lib/gateway/client";
import type { DropNode } from "@/lib/drop/types";

/** Reject anything that isn't a same-origin URL so a raw Kubo RPC endpoint can
 * never be opened, even if the gateway response is malformed. */
function isSameOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function DropWebuiLauncher({
  orgId,
  nodes,
}: {
  orgId: string;
  nodes: DropNode[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const operableNodes = nodes.filter((n) => n.online);

  if (operableNodes.length === 0) return null;

  const launch = async (node: DropNode) => {
    setBusyId(node.id);
    try {
      const session = await createDropWebuiSession(orgId, node.id);
      if (!isSameOrigin(session.url)) {
        toast.error("Refusing to open a non-proxied WebUI URL.");
        return;
      }
      window.open(session.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(
        err instanceof GatewayApiError ? err.message : "Could not open the node WebUI."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-5">
      <MonoLabel>Node WebUI</MonoLabel>
      <p className="mt-2 text-xs text-[var(--text-3)]">
        Open the Kubo WebUI for a node you operate. The connection is a short-lived,
        same-origin proxy session.
      </p>
      <div className="mt-3 space-y-2">
        {operableNodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] px-3.5 py-2.5"
          >
            <span className="min-w-0 truncate text-sm">{node.name}</span>
            <ActionButton
              variant="neutral"
              disabled={busyId === node.id}
              onClick={() => launch(node)}
            >
              <ExternalLink size={13} />
              {busyId === node.id ? "Opening…" : "WebUI"}
            </ActionButton>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--warn)]/25 bg-[var(--warn)]/8 px-3 py-2.5">
        <TriangleAlert size={14} className="mt-0.5 shrink-0 text-[var(--warn)]" />
        <p className="text-[11px] leading-relaxed text-[var(--text-2)]">
          Pinning content directly in the WebUI creates <strong>unmanaged</strong> pins.
          Drop won&apos;t track them for quota, encryption, or sharing.
        </p>
      </div>
    </Card>
  );
}
