"use client";

import { Globe, GlobeLock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, MonoLabel, StatusDot } from "@/components/v3/ui";
import type { DropNode } from "@/lib/drop/types";

const CAPACITY_LABEL: Record<DropNode["capacity"], string> = {
  ok: "Available",
  limited: "Limited",
  full: "Full",
  unknown: "—",
};

const CAPACITY_COLOR: Record<DropNode["capacity"], string> = {
  ok: "var(--success)",
  limited: "var(--warn)",
  full: "var(--danger)",
  unknown: "var(--text-3)",
};

export function DropNodePicker({
  nodes,
  selectedId,
  onSelect,
  loading,
}: {
  nodes: DropNode[];
  selectedId: string | null;
  onSelect: (node: DropNode) => void;
  loading: boolean;
}) {
  return (
    <Card className="p-5">
      <MonoLabel>Storage node</MonoLabel>
      {loading ? (
        <p className="mt-3 text-sm text-[var(--text-3)]">Loading nodes…</p>
      ) : nodes.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text-2)]">
          No eligible nodes in this scope right now.
        </p>
      ) : (
        <div
          className="mt-3 grid gap-2"
          role="radiogroup"
          aria-label="Select a storage node"
        >
          {nodes.map((node) => {
            const disabled = !node.online || !node.accepting || node.capacity === "full";
            const active = node.id === selectedId;
            return (
              <button
                key={node.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onSelect(node)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-[var(--accent)]/45 bg-[var(--accent)]/10"
                    : "border-white/[0.07] hover:bg-white/[0.04]",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot color={node.online ? "var(--success)" : "var(--text-3)"} />
                    <span className="truncate font-medium">{node.name}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 font-mono text-[10px]",
                        node.scope === "public"
                          ? "bg-white/[0.06] text-[var(--text-3)]"
                          : "bg-[var(--accent)]/15 text-[var(--accent-hi)]"
                      )}
                    >
                      {node.scope}
                    </span>
                    <span
                      title={
                        node.gateway_available
                          ? `This node publishes its IPFS gateway over HTTPS${
                              node.gateway_url ? ` (${node.gateway_url})` : ""
                            } — files can be viewed directly in the browser by CID.`
                          : "This node has not published a public gateway — files are served through the Erebrus gateway proxy only."
                      }
                      className={cn(
                        "flex items-center gap-1 rounded px-1.5 font-mono text-[10px]",
                        node.gateway_available
                          ? "bg-[var(--success)]/15 text-[var(--success)]"
                          : "bg-white/[0.06] text-[var(--text-3)]"
                      )}
                    >
                      {node.gateway_available ? (
                        <>
                          <Globe size={10} />
                          direct view
                        </>
                      ) : (
                        <>
                          <GlobeLock size={10} />
                          proxy only
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-3)]">
                    {[node.region, node.online ? "online" : "offline"].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span
                  className="shrink-0 font-mono text-[11px]"
                  style={{ color: CAPACITY_COLOR[node.capacity] }}
                >
                  {CAPACITY_LABEL[node.capacity]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
