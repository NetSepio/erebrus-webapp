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
  fetchOrgEntitlements,
  fetchOrgNodeServices,
  createNodeRegistrationToken,
  createOrgApiKey,
  revokeOrgApiKey,
  inviteOrgMember,
  removeOrgMember,
  patchOrgMember,
  transferOrgOwnership,
  assignOrgSeat,
  revokeOrgSeat,
  deleteOrg,
  updateOrg,
  GatewayApiError,
} from "@/lib/gateway/client";
import type {
  GatewayApiKey,
  GatewayOrg,
  GatewayOrgEntitlements,
  GatewayOrgMember,
  GatewayOrgNode,
  GatewayOrgNodeService,
  GatewayVpnClient,
} from "@/lib/gateway/types";
import {
  profileBadgeClass,
  profileLabel,
  serviceStatusLabel,
} from "@/lib/gateway/profiles";
import { NodeFirewallPanel } from "@/components/v3/workspace/NodeFirewallPanel";
import {
  AccentButton,
  ActionButton,
  Card,
  MonoLabel,
  StatCard,
  v3TabsListClass,
  v3TabsTriggerClass,
} from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function OrgDetailPanel({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<GatewayOrg | null>(null);
  const [nodes, setNodes] = useState<GatewayOrgNode[]>([]);
  const [nodeServices, setNodeServices] = useState<Record<string, GatewayOrgNodeService[]>>({});
  const [members, setMembers] = useState<GatewayOrgMember[]>([]);
  const [apiKeys, setApiKeys] = useState<GatewayApiKey[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [entitlements, setEntitlements] = useState<GatewayOrgEntitlements | null>(null);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [memberWallet, setMemberWallet] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberChain, setMemberChain] = useState("sol");
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [editName, setEditName] = useState("");
  const [regToken, setRegToken] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const isPrivileged = org?.role === "owner" || org?.role === "admin";
  const isOwner = org?.role === "owner";
  const canManageNodes =
    org?.role === "owner" || org?.role === "admin" || org?.role === "node_operator";

  // Seats: a paid plan's tier is also the seat tier to assign. Seats used = the
  // owner + members holding a non-free seat (== VPN-entitled members).
  const PLAN_SEAT_TIER: Record<string, string> = {
    starter: "starter",
    pro: "pro",
    business: "business",
    enterprise: "enterprise",
  };
  const planSeatTier = org?.plan ? PLAN_SEAT_TIER[org.plan] : undefined;
  const seatsUsed = members.filter((m) => m.seat_tier && m.seat_tier !== "free").length;
  const seatsIncluded = entitlements?.paid_seats_included ?? 0;

  const handleDeleteOrg = async () => {
    if (!confirm(`Delete "${org?.name}"? This removes the workspace, its members and seats. Nodes are detached and keep running. This cannot be undone.`)) {
      return;
    }
    try {
      await deleteOrg(orgId);
      toast.success("Organization deleted");
      window.location.href = "/workspace";
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to delete org");
    }
  };

  const loadNodeServices = async (nodeList: GatewayOrgNode[]) => {
    const entries = await Promise.all(
      nodeList.map(async (n) => {
        const svcs = await fetchOrgNodeServices(orgId, n.node_id).catch(() => []);
        return [n.node_id, svcs] as const;
      })
    );
    setNodeServices(Object.fromEntries(entries));
  };

  const reload = () => {
    Promise.all([
      fetchOrg(orgId),
      fetchOrgNodes(orgId).catch(() => []),
      fetchOrgMembers(orgId).catch(() => []),
      isPrivileged ? fetchOrgApiKeys(orgId).catch(() => []) : Promise.resolve([]),
      fetchOrgUsage(orgId).catch(() => ({})),
      fetchOrgClients(orgId).catch(() => []),
      fetchOrgEntitlements(orgId).catch(() => null),
    ]).then(([o, n, m, keys, u, c, ent]) => {
      setOrg(o);
      setEditName(o.name);
      setNodes(n);
      setMembers(m);
      setApiKeys(keys as GatewayApiKey[]);
      setUsage(u as Record<string, number>);
      setClients(c as GatewayVpnClient[]);
      setEntitlements(ent);
      if (n.length > 0) {
        setSelectedNodeId((prev) => prev ?? n[0].node_id);
        void loadNodeServices(n);
      }
    });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const mintRegistrationToken = async () => {
    try {
      const res = await createNodeRegistrationToken(orgId, { ttl_hours: 24 });
      setRegToken(res.token);
      toast.success("Registration token minted — copy now");
    } catch {
      toast.error("Failed to mint registration token");
    }
  };

  const copyToken = async () => {
    if (!regToken) return;
    await navigator.clipboard.writeText(regToken);
    setTokenCopied(true);
    toast.success("Token copied");
    setTimeout(() => setTokenCopied(false), 2000);
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

  const inviteMember = async () => {
    if (!memberWallet.trim() && !memberEmail.trim()) return;
    try {
      await inviteOrgMember(orgId, {
        wallet_address: memberWallet.trim() || undefined,
        email: memberEmail.trim() || undefined,
        chain: memberChain,
        role: "member",
      });
      setMemberWallet("");
      setMemberEmail("");
      reload();
      toast.success("Invite sent");
    } catch {
      toast.error("Failed to invite member");
    }
  };

  if (!org) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspace…</div>;
  }

  const online = nodes.filter((n) => n.status === "active" || n.status === "online").length;
  const selectedNode = nodes.find((n) => n.node_id === selectedNodeId) ?? null;

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
            {org.plan ?? org.kind} · {members.length} members · {nodes.length} nodes
            {entitlements ? ` · ${entitlements.shield_instances_included} Shield · ${entitlements.sentinel_licenses_included} Sentinel` : ""}
          </p>
        </div>
        {org.role && (
          <span className="rounded-lg bg-[var(--accent)]/12 px-3 py-1 font-mono text-xs uppercase text-[var(--accent-hi)]">
            {org.role}
          </span>
        )}
        {isOwner && (
          <ActionButton type="button" variant="danger" onClick={handleDeleteOrg}>
            Delete org
          </ActionButton>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Nodes online" value={online} />
        <StatCard label="Total nodes" value={nodes.length} />
        <StatCard label="Members" value={members.length} />
        <StatCard label="Seats (VPN)" value={planSeatTier ? `${seatsUsed}/${seatsIncluded}` : "—"} />
        <StatCard label="VPN clients" value={clients.length} />
        <StatCard label="API calls (30d)" value={usage.api_calls ?? "—"} />
      </div>

      {isPrivileged && (
        <Card className="p-6">
          <div className="font-semibold">Register a node</div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Mint a scoped token for{" "}
            <code className="font-mono text-xs">EREBRUS_NODE_REGISTRATION_TOKEN</code> /{" "}
            <code className="font-mono text-xs">POST /api/v2/nodes/register</code>. Set{" "}
            <code className="font-mono text-xs">EREBRUS_PROFILE=shield|sentinel</code> on the node
            for firewall sidecars.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AccentButton type="button" onClick={mintRegistrationToken}>
              Mint token (24h)
            </AccentButton>
            {regToken && (
              <ActionButton type="button" onClick={copyToken}>
                {tokenCopied ? "Copied" : "Copy token"}
              </ActionButton>
            )}
          </div>
          {regToken && (
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#08080A] px-3.5 py-3 font-mono text-xs break-all">
              {regToken}
            </div>
          )}
        </Card>
      )}

      <Tabs defaultValue="nodes">
        <TabsList className={v3TabsListClass}>
          <TabsTrigger value="nodes" className={v3TabsTriggerClass}>
            Nodes
          </TabsTrigger>
          {canManageNodes && (
            <TabsTrigger value="firewall" className={v3TabsTriggerClass}>
              Firewall
            </TabsTrigger>
          )}
          <TabsTrigger value="members" className={v3TabsTriggerClass}>
            Members
          </TabsTrigger>
          <TabsTrigger value="clients" className={v3TabsTriggerClass}>
            VPN clients
          </TabsTrigger>
          {isPrivileged && (
            <TabsTrigger value="apikeys" className={v3TabsTriggerClass}>
              API keys
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="nodes" className="mt-4">
          <Card className="overflow-hidden">
            {nodes.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No nodes enrolled yet.</p>
            ) : (
              nodes.map((node) => {
                const svcs = nodeServices[node.node_id] ?? [];
                return (
                  <div
                    key={node.id}
                    className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            node.status === "active" || node.status === "online"
                              ? "var(--success)"
                              : "var(--text-3)",
                          boxShadow:
                            node.status === "active" || node.status === "online"
                              ? "0 0 8px var(--success)"
                              : undefined,
                        }}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{node.node_name || node.region}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${profileBadgeClass(node.deployment_profile)}`}
                          >
                            {profileLabel(node.deployment_profile)}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-[var(--text-3)]">
                          {node.node_id}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-[var(--text-2)]">
                      <span className="capitalize">{node.status}</span>
                      {svcs.length > 0 && (
                        <div className="flex flex-wrap gap-2 font-mono text-[10px] text-[var(--text-3)]">
                          {svcs.map((s) => (
                            <span key={s.id}>
                              {s.service_type}: {serviceStatusLabel(s.service_status)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </TabsContent>

        {canManageNodes && (
          <TabsContent value="firewall" className="mt-4 space-y-4">
            {nodes.length === 0 ? (
              <Card className="p-5 text-sm text-[var(--text-2)]">Enroll a node first.</Card>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {nodes.map((n) => (
                    <ActionButton
                      key={n.node_id}
                      type="button"
                      onClick={() => setSelectedNodeId(n.node_id)}
                      className={
                        selectedNodeId === n.node_id
                          ? "border-[var(--accent)]/40 text-[var(--accent-hi)]"
                          : undefined
                      }
                    >
                      {n.node_name || n.node_id.slice(0, 12)}
                    </ActionButton>
                  ))}
                </div>
                {selectedNode && (
                  <NodeFirewallPanel orgId={orgId} node={selectedNode} canManage={canManageNodes} />
                )}
              </>
            )}
          </TabsContent>
        )}

        <TabsContent value="members" className="mt-4 space-y-4">
          {isPrivileged && (
            <Card className="p-5 space-y-3">
              <MonoLabel>Invite member</MonoLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Wallet address (optional)"
                  value={memberWallet}
                  onChange={(e) => setMemberWallet(e.target.value)}
                  className="border-white/10 bg-[var(--surface-2)]"
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="border-white/10 bg-[var(--surface-2)]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={memberChain}
                  onChange={(e) => setMemberChain(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 text-sm"
                >
                  <option value="sol">Solana</option>
                  <option value="evm">EVM</option>
                </select>
                <AccentButton onClick={inviteMember}>Send invite</AccentButton>
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
                  <div className="font-mono text-sm">
                    {m.wallet_address ? `${m.wallet_address.slice(0, 12)}…` : m.status ?? "pending"}
                  </div>
                  <MonoLabel>
                    {m.role}
                    {m.seat_tier ? ` · ${m.seat_tier}` : ""}
                  </MonoLabel>
                </div>
                <div className="flex items-center gap-2">
                  {isPrivileged && planSeatTier && m.role !== "owner" &&
                    (m.seat_tier && m.seat_tier !== "free" ? (
                      <ActionButton
                        type="button"
                        onClick={() =>
                          revokeOrgSeat(orgId, m.user_id)
                            .then(reload)
                            .catch((e) =>
                              toast.error(e instanceof GatewayApiError ? e.message : "Failed to revoke seat")
                            )
                        }
                      >
                        Revoke seat
                      </ActionButton>
                    ) : (
                      <ActionButton
                        type="button"
                        variant="accent"
                        onClick={() =>
                          assignOrgSeat(orgId, m.user_id, planSeatTier)
                            .then(reload)
                            .catch((e) =>
                              toast.error(e instanceof GatewayApiError ? e.message : "No seats remaining")
                            )
                        }
                      >
                        Give seat
                      </ActionButton>
                    ))}
                  {isPrivileged && m.role !== "owner" && (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        patchOrgMember(
                          orgId,
                          m.user_id,
                          e.target.value as "admin" | "member" | "node_operator"
                        )
                          .then(reload)
                          .catch(() => toast.error("Failed to update role"))
                      }
                      className="rounded border border-white/10 bg-[var(--surface-2)] px-2 py-1 text-xs"
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                      <option value="node_operator">node_operator</option>
                    </select>
                  )}
                  {isOwner && m.role === "admin" && (
                    <ActionButton
                      type="button"
                      onClick={() =>
                        transferOrgOwnership(orgId, m.user_id)
                          .then(reload)
                          .catch(() => toast.error("Transfer failed — target must be admin"))
                      }
                    >
                      Make owner
                    </ActionButton>
                  )}
                  {isPrivileged && m.role !== "owner" && (
                    <ActionButton
                      type="button"
                      variant="danger"
                      onClick={() =>
                        removeOrgMember(orgId, m.user_id).then(reload).catch(() =>
                          toast.error("Failed to remove member")
                        )
                      }
                    >
                      Remove
                    </ActionButton>
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
                  <ActionButton
                    type="button"
                    variant="danger"
                    onClick={() =>
                      revokeOrgApiKey(orgId, k.id).then(reload).catch(() =>
                        toast.error("Failed to revoke key")
                      )
                    }
                  >
                    Revoke
                  </ActionButton>
                </div>
              ))}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}