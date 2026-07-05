"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchOrg,
  fetchOrgNodes,
  fetchOrgMembers,
  fetchOrgInvites,
  fetchOrgApiKeys,
  fetchOrgUsage,
  fetchOrgClients,
  fetchOrgEntitlements,
  fetchOrgProfile,
  fetchOrgNodeServices,
  createNodeRegistrationToken,
  updateOrgProfile,
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
import { memberRoleLabel, memberStatusLabel } from "@/lib/gateway/member-labels";
import {
  memberPrimaryLabel,
  memberSecondaryLabel,
  visiblePendingInvites,
} from "@/lib/gateway/member-display";
import type {
  GatewayApiKey,
  GatewayOrg,
  GatewayOrgEntitlements,
  GatewayOrgProfile,
  GatewayOrgMember,
  GatewayOrgInvite,
  GatewayOrgNode,
  GatewayOrgNodeService,
  GatewayVpnClient,
} from "@/lib/gateway/types";
import { isValidEmail, isValidWalletAddress } from "@/lib/validation";
import {
  profileBadgeClass,
  profileLabel,
  serviceStatusLabel,
  visibilityLabel,
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
  const [pendingInvites, setPendingInvites] = useState<GatewayOrgInvite[]>([]);
  const [apiKeys, setApiKeys] = useState<GatewayApiKey[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [entitlements, setEntitlements] = useState<GatewayOrgEntitlements | null>(null);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [inviteMode, setInviteMode] = useState<"email" | "wallet">("email");
  const [inviteValue, setInviteValue] = useState("");
  const [memberChain, setMemberChain] = useState<"sol" | "evm">("sol");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [orgProfile, setOrgProfile] = useState<GatewayOrgProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPublicProfile, setEditPublicProfile] = useState(false);
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
    fetchOrg(orgId).then((o) => {
      const privileged = o.role === "owner" || o.role === "admin";
      return Promise.all([
        Promise.resolve(o),
        fetchOrgNodes(orgId).catch(() => []),
        fetchOrgMembers(orgId).catch(() => []),
        privileged ? fetchOrgInvites(orgId).catch(() => []) : Promise.resolve([]),
        privileged ? fetchOrgApiKeys(orgId).catch(() => []) : Promise.resolve([]),
        fetchOrgUsage(orgId).catch(() => ({})),
        fetchOrgClients(orgId).catch(() => []),
        fetchOrgEntitlements(orgId).catch(() => null),
        privileged ? fetchOrgProfile(orgId).catch(() => null) : Promise.resolve(null),
      ]).then(([orgData, n, m, invites, keys, u, c, ent, profile]) => {
        setOrg(orgData);
        setEditName(orgData.name);
        setEditSlug(orgData.slug ?? "");
        setEditPublicProfile(orgData.public_profile_enabled ?? false);
        if (profile) {
          setOrgProfile(profile);
          setEditDisplayName(profile.display_name ?? "");
          setEditDescription(profile.description ?? "");
          setEditWebsite(profile.website_url ?? "");
        }
        setNodes(n);
        setMembers(m);
        setPendingInvites(invites as GatewayOrgInvite[]);
        setApiKeys(keys as GatewayApiKey[]);
        setUsage(u as Record<string, number>);
        setClients(c as GatewayVpnClient[]);
        setEntitlements(ent);
        if (n.length > 0) {
          setSelectedNodeId((prev) => prev ?? n[0].node_id);
          void loadNodeServices(n);
        }
      });
    });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const createRegistrationCode = async () => {
    try {
      const res = await createNodeRegistrationToken(orgId, { ttl_hours: 24 });
      setRegToken(res.token);
      toast.success("Setup code created — copy it before it expires");
    } catch {
      toast.error("Failed to create setup code");
    }
  };

  const canUseSentinelProfile =
    org?.plan === "business" ||
    org?.plan === "enterprise" ||
    (entitlements?.sentinel_licenses_included ?? 0) > 0;
  const canUseShieldProfile =
    canUseSentinelProfile ||
    org?.plan === "pro" ||
    org?.plan === "starter" ||
    (entitlements?.shield_instances_included ?? 0) > 0;

  const registrationEnvLine = regToken
    ? `EREBRUS_NODE_REGISTRATION_TOKEN=${regToken}`
    : null;

  const copyRegistrationEnv = async () => {
    if (!registrationEnvLine) return;
    await navigator.clipboard.writeText(registrationEnvLine);
    setTokenCopied(true);
    toast.success("Copied env line");
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

  const saveOrgSettings = async () => {
    if (!editName.trim() || !isPrivileged) return;
    try {
      await updateOrg(orgId, {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        public_profile_enabled: editPublicProfile,
      });
      await updateOrgProfile(orgId, {
        display_name: editDisplayName.trim() || editName.trim(),
        description: editDescription.trim() || undefined,
        website_url: editWebsite.trim() || undefined,
      });
      reload();
      toast.success("Workspace settings saved");
    } catch {
      toast.error("Failed to save workspace settings");
    }
  };

  const inviteMember = async () => {
    const value = inviteValue.trim();
    if (!value) {
      setInviteError(inviteMode === "email" ? "Enter an email address" : "Enter a wallet address");
      return;
    }
    if (inviteMode === "email") {
      if (!isValidEmail(value)) {
        setInviteError("Enter a valid email address");
        return;
      }
    } else if (!isValidWalletAddress(value, memberChain)) {
      setInviteError(
        memberChain === "evm"
          ? "Enter a valid Ethereum address (0x…)"
          : "Enter a valid Solana address"
      );
      return;
    }
    setInviteError(null);
    try {
      await inviteOrgMember(orgId, {
        wallet_address: inviteMode === "wallet" ? value : undefined,
        email: inviteMode === "email" ? value : undefined,
        chain: memberChain,
        role: "member",
      });
      setInviteValue("");
      reload();
      toast.success("Invite sent");
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to invite member");
    }
  };

  if (!org) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspace…</div>;
  }

  const online = nodes.filter((n) => n.status === "active" || n.status === "online").length;
  const selectedNode = nodes.find((n) => n.node_id === selectedNodeId) ?? null;
  const displayedPendingInvites = visiblePendingInvites(members, pendingInvites);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start">
      <aside className="space-y-4">
        <Link href="/workspace" className="inline-flex text-sm text-[var(--text-2)] hover:text-[var(--text)]">
          ← All workspaces
        </Link>

        {isPrivileged && (
          <Card className="p-4">
            <div className="font-semibold">Register a node</div>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Create a one-time setup code, then enter it on your node during install or restart to
              attach it to this workspace.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AccentButton type="button" onClick={createRegistrationCode}>
                Create setup code (24h)
              </AccentButton>
              {registrationEnvLine && (
                <ActionButton type="button" onClick={copyRegistrationEnv}>
                  {tokenCopied ? "Copied" : "Copy env line"}
                </ActionButton>
              )}
            </div>
            {registrationEnvLine && (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#08080A] px-3 py-2.5 font-mono text-[11px] break-all text-[var(--text-2)]">
                {registrationEnvLine}
              </div>
            )}
            {(canUseShieldProfile || canUseSentinelProfile) && (
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-3)]">
                Optional:
                {canUseShieldProfile && (
                  <>
                    {" "}
                    set <code className="font-mono">EREBRUS_PROFILE=shield</code> for AdGuard DNS
                  </>
                )}
                {canUseShieldProfile && canUseSentinelProfile ? " or " : ""}
                {canUseSentinelProfile && (
                  <>
                    set <code className="font-mono">EREBRUS_PROFILE=sentinel</code> for firewall
                    add-ons
                  </>
                )}
                .
              </p>
            )}
          </Card>
        )}
      </aside>

      <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-[52px] w-[52px] rounded-[14px] bg-gradient-to-br from-[var(--solana)] to-[var(--accent)]" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{org.name}</h2>
          <p className="text-sm text-[var(--text-3)]">
            {org.plan ?? org.kind} · {members.length + displayedPendingInvites.length} members · {nodes.length} nodes
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
        <StatCard label="Members" value={members.length + displayedPendingInvites.length} />
        <StatCard label="Seats (VPN)" value={planSeatTier ? `${seatsUsed}/${seatsIncluded}` : "—"} />
        <StatCard label="VPN clients" value={clients.length} />
        <StatCard label="API calls (30d)" value={usage.api_calls ?? "—"} />
      </div>

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
          {isPrivileged && (
            <TabsTrigger value="settings" className={v3TabsTriggerClass}>
              Settings
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
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--text-3)]">
                            {visibilityLabel(node.visibility)}
                          </span>
                          {node.managed_by === "erebrus" && (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-300/90">
                              Managed
                            </span>
                          )}
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
            <Card className="p-5 space-y-4">
              <div>
                <MonoLabel>Invite member</MonoLabel>
                <p className="mt-1 text-sm text-[var(--text-2)]">
                  Send an invitation by email or wallet address. They&apos;ll receive a link to join
                  this workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  type="button"
                  onClick={() => {
                    setInviteMode("email");
                    setInviteValue("");
                    setInviteError(null);
                  }}
                  className={
                    inviteMode === "email"
                      ? "border-[var(--accent)]/40 text-[var(--accent-hi)]"
                      : undefined
                  }
                >
                  Email
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() => {
                    setInviteMode("wallet");
                    setInviteValue("");
                    setInviteError(null);
                  }}
                  className={
                    inviteMode === "wallet"
                      ? "border-[var(--accent)]/40 text-[var(--accent-hi)]"
                      : undefined
                  }
                >
                  Wallet address
                </ActionButton>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {inviteMode === "wallet" && (
                  <div className="flex shrink-0 rounded-lg border border-white/10 bg-[var(--surface-2)] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMemberChain("sol")}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        memberChain === "sol"
                          ? "bg-[var(--accent)]/15 text-[var(--accent-hi)]"
                          : "text-[var(--text-2)]"
                      }`}
                    >
                      Solana
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberChain("evm")}
                      className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        memberChain === "evm"
                          ? "bg-[var(--accent)]/15 text-[var(--accent-hi)]"
                          : "text-[var(--text-2)]"
                      }`}
                    >
                      Ethereum
                    </button>
                  </div>
                )}
                <Input
                  placeholder={
                    inviteMode === "email" ? "name@company.com" : "Wallet address"
                  }
                  type={inviteMode === "email" ? "email" : "text"}
                  value={inviteValue}
                  onChange={(e) => {
                    setInviteValue(e.target.value);
                    setInviteError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                  className="border-white/10 bg-[var(--surface-2)] font-mono text-sm"
                />
              </div>
              {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
              <AccentButton onClick={inviteMember}>Send invitation</AccentButton>
            </Card>
          )}
          <Card className="overflow-hidden">
            {members.length === 0 && displayedPendingInvites.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-2)]">No members yet.</p>
            ) : (
              <>
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">{memberPrimaryLabel(m)}</div>
                      {memberSecondaryLabel(m) && (
                        <div className="font-mono text-[11px] text-[var(--text-3)]">
                          {memberSecondaryLabel(m)}
                        </div>
                      )}
                      <MonoLabel>
                        {memberRoleLabel(m.role)}
                        {m.seat_tier && m.seat_tier !== "free" ? ` · ${m.seat_tier} seat` : ""}
                        {" · "}
                        {memberStatusLabel(m.status)}
                      </MonoLabel>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isPrivileged && planSeatTier && m.role !== "owner" && m.status !== "invited" &&
                        (m.seat_tier && m.seat_tier !== "free" ? (
                          <ActionButton
                            type="button"
                            onClick={() =>
                              revokeOrgSeat(orgId, m.user_id)
                                .then(reload)
                                .catch((e) =>
                                  toast.error(
                                    e instanceof GatewayApiError ? e.message : "Failed to revoke seat"
                                  )
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
                                  toast.error(
                                    e instanceof GatewayApiError ? e.message : "No seats remaining"
                                  )
                                )
                            }
                          >
                            Assign seat
                          </ActionButton>
                        ))}
                      {isPrivileged && m.role !== "owner" && m.status !== "invited" && (
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
                          className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-1.5 text-xs"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="node_operator">Node operator</option>
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
                          Transfer ownership
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
                {displayedPendingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm">{inv.email}</div>
                      <MonoLabel>
                        {memberRoleLabel(inv.role)}
                        {inv.seat_tier && inv.seat_tier !== "free" ? ` · ${inv.seat_tier} seat` : ""}
                        {" · "}
                        {memberStatusLabel("pending")}
                      </MonoLabel>
                    </div>
                    <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300/90">
                      Awaiting sign-in
                    </span>
                  </div>
                ))}
              </>
            )}
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
          <TabsContent value="settings" className="mt-4">
            <Card className="space-y-4 p-5">
              <div>
                <MonoLabel>Workspace settings</MonoLabel>
                <p className="mt-1 text-sm text-[var(--text-2)]">
                  Name and profile shown in the dashboard; public fields appear when the workspace profile is enabled.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Workspace name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 border-white/10 bg-[var(--surface-2)]"
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="mt-1 border-white/10 bg-[var(--surface-2)] font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>Display name</Label>
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder={orgProfile?.display_name ?? org.name}
                    className="mt-1 border-white/10 bg-[var(--surface-2)]"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://"
                    className="mt-1 border-white/10 bg-[var(--surface-2)]"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 border-white/10 bg-[var(--surface-2)]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={editPublicProfile}
                  onChange={(e) => setEditPublicProfile(e.target.checked)}
                  className="rounded border-white/20"
                />
                Public workspace profile
              </label>
              <AccentButton type="button" onClick={saveOrgSettings}>
                Save settings
              </AccentButton>
            </Card>
          </TabsContent>
        )}

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
    </div>
  );
}