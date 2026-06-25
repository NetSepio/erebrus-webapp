"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchOrg,
  fetchOrgNodes,
  fetchOrgMembers,
  fetchOrgApiKeys,
  fetchOrgUsage,
  fetchOrgClients,
  fetchOperatorNodeMetrics,
  createOrgApiKey,
  revokeOrgApiKey,
  addOrgMember,
  removeOrgMember,
  patchOrgMember,
  transferOrgOwnership,
  updateOrg,
} from "@/lib/gateway/client";
import type {
  GatewayApiKey,
  GatewayNode,
  GatewayOrg,
  GatewayOrgMember,
  GatewayVpnClient,
} from "@/lib/gateway/types";
import { AccentButton, Card, MonoLabel, StatCard } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function OrgDetailPanel({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<GatewayOrg | null>(null);
  const [nodes, setNodes] = useState<GatewayNode[]>([]);
  const [members, setMembers] = useState<GatewayOrgMember[]>([]);
  const [apiKeys, setApiKeys] = useState<GatewayApiKey[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [memberWallet, setMemberWallet] = useState("");
  const [memberChain, setMemberChain] = useState("sol");
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [editName, setEditName] = useState("");
  const [nodeMetrics, setNodeMetrics] = useState<Record<string, string>>({});
  const isPrivileged = org?.role === "owner" || org?.role === "admin";
  const isOwner = org?.role === "owner";

  const reload = () => {
    Promise.all([
      fetchOrg(orgId),
      fetchOrgNodes(orgId).catch(() => []),
      fetchOrgMembers(orgId).catch(() => []),
      isPrivileged ? fetchOrgApiKeys(orgId).catch(() => []) : Promise.resolve([]),
      fetchOrgUsage(orgId).catch(() => ({})),
      fetchOrgClients(orgId).catch(() => []),
    ]).then(([o, n, m, keys, u, c]) => {
      setOrg(o);
      setEditName(o.name);
      setNodes(n);
      setMembers(m);
      setApiKeys(keys as GatewayApiKey[]);
      setUsage(u as Record<string, number>);
      setClients(c as GatewayVpnClient[]);
    });
  };

  useEffect(() => {
    fetchOrg(orgId)
      .then((o) => {
        setOrg(o);
        setEditName(o.name);
        return Promise.all([
          fetchOrgNodes(orgId).catch(() => []),
          fetchOrgMembers(orgId).catch(() => []),
          o.role === "owner" || o.role === "admin"
            ? fetchOrgApiKeys(orgId).catch(() => [])
            : Promise.resolve([]),
          fetchOrgUsage(orgId).catch(() => ({})),
          fetchOrgClients(orgId).catch(() => []),
        ]);
      })
      .then(([n, m, keys, u, c]) => {
        setNodes(n);
        setMembers(m);
        setApiKeys(keys as GatewayApiKey[]);
        setUsage(u as Record<string, number>);
        setClients(c as GatewayVpnClient[]);
      })
      .catch(() => toast.error("Failed to load workspace"));
  }, [orgId]);

  const copySecret = async () => {
    if (!org?.enrollment_secret) return;
    await navigator.clipboard.writeText(org.enrollment_secret);
    setCopied(true);
    toast.success("Enrollment secret copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const issueKey = async () => {
    try {
      const key = await createOrgApiKey(orgId, "Webapp key");
      setNewKeySecret(key.secret);
      reload();
      toast.success("API key created — copy the secret now");
    } catch {
      toast.error("Failed to create API key");
    }
  };

  const saveOrgName = async () => {
    if (!editName.trim() || !isPrivileged) return;
    try {
      await updateOrg(orgId, { name: editName.trim() });
      reload();
      toast.success("Workspace updated");
    } catch {
      toast.error("Failed to update workspace");
    }
  };

  const loadNodeMetrics = async (nodeId: string) => {
    try {
      const data = await fetchOperatorNodeMetrics(nodeId, { range: "24h" });
      const points = data.buckets ?? [];
      const last = points[points.length - 1];
      setNodeMetrics((m) => ({
        ...m,
        [nodeId]: last
          ? `Peers ${last.wg_peers ?? 0} · RX ${Math.round((last.rx_bytes ?? 0) / 1024)}KB`
          : "No data",
      }));
    } catch {
      toast.error("Failed to load node metrics");
    }
  };

  const addMember = async () => {
    if (!memberWallet.trim()) return;
    try {
      await addOrgMember(orgId, {
        wallet_address: memberWallet.trim(),
        chain: memberChain,
        role: "member",
      });
      setMemberWallet("");
      reload();
      toast.success("Member added");
    } catch {
      toast.error("Failed to add member");
    }
  };

  if (!org) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspace…</div>;
  }

  const online = nodes.filter((n) => n.status === "online").length;

  return (
    <div className="space-y-5">
      <Link href="/workspace" className="inline-flex text-sm text-[var(--text-2)] hover:text-[var(--text)]">
        ← All workspaces
      </Link>

      {isPrivileged && (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Workspace name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 border-white/10 bg-[var(--surface-2)]"
            />
          </div>
          <AccentButton type="button" onClick={saveOrgName}>
            Save
          </AccentButton>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="h-[52px] w-[52px] rounded-[14px] bg-gradient-to-br from-[var(--solana)] to-[var(--accent)]" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{org.name}</h2>
          <p className="text-sm text-[var(--text-3)]">
            {org.kind} · {members.length} members · {nodes.length} nodes
          </p>
        </div>
        {org.role && (
          <span className="rounded-lg bg-[var(--accent)]/12 px-3 py-1 font-mono text-xs uppercase text-[var(--accent-hi)]">
            {org.role}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Nodes online" value={online} />
        <StatCard label="Total nodes" value={nodes.length} />
        <StatCard label="Members" value={members.length} />
        <StatCard label="VPN clients" value={clients.length} />
        <StatCard label="API calls (30d)" value={usage.api_calls ?? "—"} />
      </div>

      {isPrivileged && (
        <Card className="p-6">
          <div className="font-semibold">Enroll a new node</div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Register machines with this enrollment secret via{" "}
            <code className="font-mono text-xs">POST /api/v2/nodes/register</code>
          </p>
          {org.enrollment_secret ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#08080A] px-3.5 py-3 font-mono text-xs">
              <span className="flex-1 truncate">{org.enrollment_secret}</span>
              <button
                type="button"
                onClick={copySecret}
                className="rounded-lg bg-[var(--accent)]/14 px-2.5 py-1.5 text-[var(--accent-hi)]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-3)]">Secret visible to owners/admins only.</p>
          )}
        </Card>
      )}

      <Tabs defaultValue="nodes">
        <TabsList className="bg-white/[0.04]">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="clients">VPN clients</TabsTrigger>
          {isPrivileged && <TabsTrigger value="apikeys">API keys</TabsTrigger>}
        </TabsList>

        <TabsContent value="nodes" className="mt-4">
          <Card className="overflow-hidden">
            {nodes.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No nodes enrolled yet.</p>
            ) : (
              nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: node.status === "online" ? "var(--success)" : "var(--text-3)",
                        boxShadow: node.status === "online" ? "0 0 8px var(--success)" : undefined,
                      }}
                    />
                    <div>
                      <div className="font-semibold">{node.name || node.region}</div>
                      <div className="font-mono text-[11px] text-[var(--text-3)]">{node.did}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 font-mono text-sm capitalize text-[var(--text-2)]">
                    <span>{node.load_pct?.toFixed(0) ?? 0}% load</span>
                    <span>{node.access_mode}</span>
                    <button
                      type="button"
                      className="text-[var(--accent-hi)]"
                      onClick={() => loadNodeMetrics(node.id)}
                    >
                      {nodeMetrics[node.id] ?? "24h stats"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-4">
          {isPrivileged && (
            <Card className="p-5">
              <Label>Add member by wallet</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Wallet address"
                  value={memberWallet}
                  onChange={(e) => setMemberWallet(e.target.value)}
                  className="border-white/10 bg-[var(--surface-2)]"
                />
                <select
                  value={memberChain}
                  onChange={(e) => setMemberChain(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 text-sm"
                >
                  <option value="sol">Solana</option>
                  <option value="evm">EVM</option>
                </select>
                <AccentButton onClick={addMember}>Add</AccentButton>
              </div>
            </Card>
          )}
          <Card className="overflow-hidden">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
              >
                <div>
                  <div className="font-mono text-sm">{m.wallet_address.slice(0, 12)}…</div>
                  <MonoLabel>{m.role}</MonoLabel>
                </div>
                <div className="flex items-center gap-2">
                  {isPrivileged && m.role !== "owner" && (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        patchOrgMember(orgId, m.user_id, e.target.value as "admin" | "member")
                          .then(reload)
                          .catch(() => toast.error("Failed to update role"))
                      }
                      className="rounded border border-white/10 bg-[var(--surface-2)] px-2 py-1 text-xs"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                  {isOwner && m.role === "admin" && (
                    <button
                      type="button"
                      className="text-xs text-[var(--accent-hi)]"
                      onClick={() =>
                        transferOrgOwnership(orgId, m.user_id)
                          .then(reload)
                          .catch(() => toast.error("Transfer failed — target must be admin"))
                      }
                    >
                      Make owner
                    </button>
                  )}
                  {isPrivileged && m.role !== "owner" && (
                    <button
                      type="button"
                      className="text-xs text-[var(--danger)]"
                      onClick={() =>
                        removeOrgMember(orgId, m.user_id).then(reload).catch(() =>
                          toast.error("Failed to remove member")
                        )
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card className="overflow-hidden">
            {clients.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No VPN clients in this org.</p>
            ) : (
              clients.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-[11px] text-[var(--text-3)]">{c.node_id}</div>
                  </div>
                  <span className="font-mono text-xs capitalize text-[var(--text-2)]">
                    {c.status ?? "—"}
                  </span>
                </div>
              ))
            )}
          </Card>
        </TabsContent>

        {isPrivileged && (
          <TabsContent value="apikeys" className="mt-4 space-y-4">
            <AccentButton onClick={issueKey}>+ Issue API key</AccentButton>
            {newKeySecret && (
              <Card className="border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 font-mono text-xs break-all">
                <MonoLabel className="text-[var(--accent-hi)]">Copy now — shown once</MonoLabel>
                <p className="mt-2">{newKeySecret}</p>
              </Card>
            )}
            <Card className="overflow-hidden">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
                >
                  <div>
                    <div className="font-medium">{k.name ?? "API key"}</div>
                    <div className="font-mono text-xs text-[var(--text-3)]">{k.prefix}…</div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--danger)]"
                    onClick={() =>
                      revokeOrgApiKey(orgId, k.id).then(reload).catch(() =>
                        toast.error("Failed to revoke key")
                      )
                    }
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}