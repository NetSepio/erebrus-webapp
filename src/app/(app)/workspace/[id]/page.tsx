"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchOrg, fetchOrgNodes, fetchOperatorNodes } from "@/lib/gateway/client";
import type { GatewayNode, GatewayOrg, GatewayOperatorNode } from "@/lib/gateway/types";
import { AccentButton, Card, MonoLabel, StatCard } from "@/components/v3/ui";
import { toast } from "sonner";

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<GatewayOrg | null>(null);
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [operatorNodes, setOperatorNodes] = useState<GatewayOperatorNode[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchOrg(id),
      fetchOrgNodes(id).catch(() => []),
      fetchOperatorNodes().catch(() => []),
    ]).then(([o, n, op]) => {
      setOrg(o);
      setNodes(n);
      setOperatorNodes(op.filter((node) => node.org_id === id));
    });
  }, [id]);

  const copySecret = async () => {
    if (!org?.enrollment_secret) return;
    await navigator.clipboard.writeText(org.enrollment_secret);
    setCopied(true);
    toast.success("Enrollment secret copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!org) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspace…</div>;
  }

  const online = nodes.filter((n) => n.status === "online").length;

  return (
    <div className="space-y-5">
      <Link
        href="/workspace"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
      >
        ← All workspaces
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className="h-[52px] w-[52px] rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #9945FF, #FF6B35)" }}
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{org.name}</h2>
          <p className="text-sm text-[var(--text-3)]">
            {org.kind} · {org.member_count ?? 0} members · {nodes.length} nodes
          </p>
        </div>
        {org.role && (
          <span className="rounded-lg bg-[var(--accent)]/12 px-3 py-1 font-mono text-xs uppercase text-[var(--accent-hi)]">
            {org.role}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card
          className="p-6"
          style={{
            borderColor: "rgba(255,107,53,0.2)",
            background:
              "radial-gradient(ellipse 80% 130% at 90% 0%, rgba(255,107,53,0.12), transparent 55%), linear-gradient(180deg, #131318, #0D0D11)",
          }}
        >
          <MonoLabel className="text-[var(--accent-hi)]">Operator overview</MonoLabel>
          <div className="mt-2 text-4xl font-bold tracking-tight">
            {operatorNodes.length}{" "}
            <span className="text-lg font-medium text-[var(--text-2)]">nodes enrolled</span>
          </div>
          <p className="mt-3 text-sm text-[var(--text-2)]">
            Track uptime, peers, and earnings from nodes in this workspace.
          </p>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="font-semibold">Enroll a new node</div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-2)]">
              Use this secret to register a machine. Visible to owners and admins only.
            </p>
          </div>
          {org.enrollment_secret ? (
            <div className="my-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#08080A] px-3.5 py-3 font-mono text-xs text-[var(--text-2)]">
              <span className="flex-1 truncate">{org.enrollment_secret}</span>
              <button
                type="button"
                onClick={copySecret}
                className="shrink-0 rounded-lg bg-[var(--accent)]/14 px-2.5 py-1.5 font-mono text-[11px] text-[var(--accent-hi)]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p className="my-4 text-sm text-[var(--text-3)]">
              Enrollment secret visible to owners/admins only.
            </p>
          )}
          <AccentButton className="w-full">+ Add node</AccentButton>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Nodes online" value={online} />
        <StatCard label="Total nodes" value={nodes.length} />
        <StatCard label="Members" value={org.member_count ?? 0} />
        <StatCard label="Access" value={org.kind} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4 font-semibold">Your nodes</div>
        {nodes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--text-2)]">
            No nodes in this workspace yet. Enroll a machine with the secret above.
          </p>
        ) : (
          nodes.map((node) => (
            <div
              key={node.id}
              className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: node.status === "online" ? "var(--success)" : "var(--text-3)",
                    boxShadow:
                      node.status === "online" ? "0 0 8px var(--success)" : "none",
                  }}
                />
                <div>
                  <div className="font-semibold">{node.city ?? node.region}</div>
                  <div className="font-mono text-[11px] text-[var(--text-3)]">{node.did}</div>
                </div>
              </div>
              <div className="flex gap-6 font-mono text-sm">
                <span className="text-[var(--success)]">{node.uptime_pct ?? "—"}% uptime</span>
                <span className="capitalize text-[var(--text-2)]">{node.access_mode}</span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}