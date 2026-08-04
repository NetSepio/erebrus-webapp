"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  revokeOrgInvite,
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
  canManageOrgNodes,
  canRevealShieldCredentials,
  countSeatsUsed,
  isOrgOwner,
  managerSeatsAvailable,
} from "@/lib/gateway/org-permissions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUpgradeablePlan, orgPlanLabel } from "@/lib/org-plans";
import { orgEntitlementBadges } from "@/lib/org-entitlements";
import { isOrgNodeOnline, orgNodeStatusLabel } from "@/lib/gateway/org-stats";
import { toast } from "sonner";

const INVITE_ROLES = [
  { value: "member", label: "Member" },
  { value: "node_operator", label: "Manager" },
] as const;

type InviteRole = (typeof INVITE_ROLES)[number]["value"];

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
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [memberChain, setMemberChain] = useState<"sol" | "evm">("sol");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [clients, setClients] = useState<GatewayVpnClient[]>([]);
  const [orgProfile, setOrgProfile] = useState<GatewayOrgProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editPublicEmail, setEditPublicEmail] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPublicProfile, setEditPublicProfile] = useState(false);
  const [regToken, setRegToken] = useState<string | null>(null);
  const [expandedFirewallNodeId, setExpandedFirewallNodeId] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = isOrgOwner(org);
  const isPrivileged = isOwner;
  const canManageNodes = canManageOrgNodes(org);
  const canRevealShield = canRevealShieldCredentials(org);

  // Seats: a paid plan's tier is also the seat tier to assign. Seats used = the
  // owner + members holding a non-free seat (== VPN-entitled members).
  const PLAN_SEAT_TIER: Record<string, string> = {
    "personal.starter": "starter",
    "personal.pro": "pro",
    "business.launch": "pro",
    "business.scale": "business",
    "business.enterprise": "enterprise",
  };
  const planSeatTier = org?.plan ? PLAN_SEAT_TIER[org.plan] : undefined;
  const seatsUsed = countSeatsUsed(members);
  const seatsIncluded = entitlements?.paid_seats_included ?? 0;
  const seatsAvailable = managerSeatsAvailable(seatsUsed, seatsIncluded, Boolean(planSeatTier));
  const inviteRoles = INVITE_ROLES.filter(
    (r) => r.value !== "node_operator" || seatsAvailable
  );

  useEffect(() => {
    if (inviteRole === "node_operator" && !seatsAvailable) {
      setInviteRole("member");
    }
  }, [inviteRole, seatsAvailable]);

  const handleDeleteOrg = async () => {
    if (deleteConfirmName.trim() !== org?.name) return;
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
    setLoading(true);
    setLoadError(null);
    fetchOrg(orgId)
      .then((o) => {
        const privileged = o.role === "owner";
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
            setEditLogoUrl(profile.logo_url ?? "");
            setEditPublicEmail(profile.public_email ?? "");
            setEditCountry(profile.country ?? "");
          }
          setNodes(n);
          setMembers(m);
          setPendingInvites(invites as GatewayOrgInvite[]);
          setApiKeys(keys as GatewayApiKey[]);
          setUsage(u as Record<string, number>);
          setClients(c as GatewayVpnClient[]);
          setEntitlements(ent);
          if (n.length > 0) {
            void loadNodeServices(n);
          }
        });
      })
      .catch((e) => {
        setOrg(null);
        const message =
          e instanceof GatewayApiError
            ? e.status === 403
              ? "You don't have access to this workspace. Accept the invite with the same account you signed in with, or ask the owner to re-invite you."
              : e.message
            : "Could not load this workspace";
        setLoadError(message);
      })
      .finally(() => setLoading(false));
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
    org?.plan === "business.scale" ||
    org?.plan === "business.enterprise" ||
    (entitlements?.sentinel_licenses_included ?? 0) > 0;
  const canUseShieldProfile =
    canUseSentinelProfile ||
    org?.plan === "personal.pro" ||
    org?.plan === "personal.starter" ||
    org?.plan === "business.launch" ||
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
    const trimmedSlug = editSlug.trim();
    const slugChanged = trimmedSlug !== (org?.slug ?? "");
    try {
      await updateOrg(orgId, {
        name: editName.trim(),
        ...(slugChanged && trimmedSlug ? { slug: trimmedSlug } : {}),
        public_profile_enabled: editPublicProfile,
      });
      const profile = await updateOrgProfile(orgId, {
        display_name: editDisplayName.trim() || editName.trim(),
        description: editDescription.trim() || undefined,
        logo_url: editLogoUrl.trim() || undefined,
        website_url: editWebsite.trim() || undefined,
        public_email: editPublicEmail.trim() || undefined,
        country: editCountry.trim() || undefined,
      });
      setOrgProfile(profile);
      setEditWebsite(profile.website_url ?? "");
      setEditPublicEmail(profile.public_email ?? "");
      setEditLogoUrl(profile.logo_url ?? "");
      setEditCountry(profile.country ?? "");
      setEditDisplayName(profile.display_name ?? "");
      setEditDescription(profile.description ?? "");
      fetchOrg(orgId).then((o) => {
        setOrg(o);
        setEditName(o.name);
        setEditSlug(o.slug ?? "");
        setEditPublicProfile(o.public_profile_enabled ?? false);
      });
      toast.success("Workspace settings saved");
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to save workspace settings");
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
        role: inviteRole,
      });
      setInviteValue("");
      reload();
      toast.success("Invite sent");
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to invite member");
    }
  };

  if (loading && !org) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspace…</div>;
  }

  if (loadError || !org) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h2 className="text-xl font-bold tracking-tight">Workspace unavailable</h2>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          {loadError ?? "This workspace could not be loaded."}
        </p>
        <Link
          href="/workspace"
          className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-hi)]"
        >
          ← Back to workspaces
        </Link>
      </div>
    );
  }

  const online = nodes.filter((n) => isOrgNodeOnline(n)).length;
  const displayedPendingInvites = visiblePendingInvites(members, pendingInvites);
  const orgAvatarUrl = editLogoUrl.trim() || orgProfile?.logo_url?.trim();
  const publicProfileUrl = editSlug.trim() || org.slug;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start">
      <aside className="space-y-4">
        <Link href="/workspace" className="inline-flex text-sm text-[var(--text-2)] hover:text-[var(--text)]">
          ← All workspaces
        </Link>

        {canManageNodes && (
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
        {orgAvatarUrl ? (
          <Image
            src={orgAvatarUrl}
            alt=""
            width={52}
            height={52}
            unoptimized
            className="h-[52px] w-[52px] rounded-[14px] border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--solana)] to-[var(--accent)] text-lg font-bold">
            {org.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">{org.name}</h2>
        </div>
        {org.role && (
          <span className="rounded-lg bg-[var(--accent)]/12 px-3 py-1 font-mono text-xs uppercase text-[var(--accent-hi)]">
            {org.role}
          </span>
        )}
      </div>

      <Card
        className="overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 100% 0%, rgba(255,107,53,0.14), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        }}
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/12 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent-hi)]">
              {orgPlanLabel(org.plan ?? org.kind)}
            </span>
            <div className="flex flex-wrap gap-2 text-sm text-[var(--text-2)]">
              {orgEntitlementBadges(org.plan, entitlements).map((badge) => (
                <span key={badge.key} className="rounded-lg bg-white/[0.04] px-2.5 py-1">
                  <span className="font-semibold text-[var(--text)]">{badge.count}</span>{" "}
                  {badge.label}
                </span>
              ))}
              <span className="rounded-lg bg-white/[0.04] px-2.5 py-1">
                <span className="font-semibold text-[var(--text)]">
                  {members.length + displayedPendingInvites.length}
                </span>{" "}
                members
              </span>
            </div>
          </div>
          {isUpgradeablePlan(org.plan) && (
            <a href="/pricing" target="_blank" rel="noopener noreferrer">
              <AccentButton type="button" variant="ghost" className="!px-4 !py-2.5">
                Upgrade plan ↗
              </AccentButton>
            </a>
          )}
        </div>
      </Card>

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
                const isShield = node.deployment_profile === "shield";
                const firewallOpen = expandedFirewallNodeId === node.node_id;
                return (
                  <div key={node.id} className="border-b border-white/[0.04]">
                    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: isOrgNodeOnline(node)
                              ? "var(--success)"
                              : "var(--text-3)",
                            boxShadow: isOrgNodeOnline(node)
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
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-col gap-1 text-sm text-[var(--text-2)]">
                          <span>{orgNodeStatusLabel(node)}</span>
                          {node.access_mode && (
                            <span className="font-mono text-[10px] text-[var(--text-3)]">
                              {node.access_mode} · {node.runtime_status ?? node.status}
                            </span>
                          )}
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
                        {canManageNodes && isShield && (
                          <ActionButton
                            type="button"
                            onClick={() =>
                              setExpandedFirewallNodeId((prev) =>
                                prev === node.node_id ? null : node.node_id
                              )
                            }
                            className={
                              firewallOpen
                                ? "border-[var(--accent)]/40 text-[var(--accent-hi)]"
                                : undefined
                            }
                          >
                            {firewallOpen ? "Hide firewall" : "Firewall"}
                          </ActionButton>
                        )}
                      </div>
                    </div>
                    {canManageNodes && isShield && firewallOpen && (
                      <div className="border-t border-white/[0.04] bg-[#08080A]/60 px-5 py-4">
                        <NodeFirewallPanel
                          orgId={orgId}
                          node={node}
                          canManage={canManageNodes}
                          canRevealShield={canRevealShield}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </TabsContent>

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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Label className="shrink-0 text-[var(--text-2)]">Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                  className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-2 text-sm"
                >
                  {inviteRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
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
                      {isPrivileged && m.role !== "owner" && (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            patchOrgMember(
                              orgId,
                              m.user_id,
                              e.target.value as "member" | "node_operator"
                            )
                              .then(reload)
                              .catch(() => toast.error("Failed to update role"))
                          }
                          className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-1.5 text-xs"
                        >
                          <option value="member">Member</option>
                          {(seatsAvailable || m.role === "node_operator") && (
                            <option value="node_operator">Manager</option>
                          )}
                        </select>
                      )}
                      {isPrivileged && m.role !== "owner" && m.status === "invited" && (
                        <ActionButton
                          type="button"
                          variant="danger"
                          onClick={() =>
                            removeOrgMember(orgId, m.user_id)
                              .then(reload)
                              .then(() => toast.success("Invitation revoked"))
                              .catch(() => toast.error("Failed to revoke invitation"))
                          }
                        >
                          Revoke invite
                        </ActionButton>
                      )}
                      {isOwner && m.role === "node_operator" && (
                        <ActionButton
                          type="button"
                          onClick={() =>
                            transferOrgOwnership(orgId, m.user_id)
                              .then(reload)
                              .catch(() => toast.error("Transfer failed — target must be a manager"))
                          }
                        >
                          Transfer ownership
                        </ActionButton>
                      )}
                      {isPrivileged && m.role !== "owner" && m.status !== "invited" && (
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
                    className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">{inv.email}</div>
                      <MonoLabel>
                        {memberRoleLabel(inv.role)}
                        {inv.seat_tier && inv.seat_tier !== "free" ? ` · ${inv.seat_tier} seat` : ""}
                        {" · "}
                        {memberStatusLabel("pending")}
                      </MonoLabel>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300/90">
                        Awaiting sign-in
                      </span>
                      {isPrivileged && (
                        <>
                          <select
                            value={inv.role}
                            onChange={(e) =>
                              inviteOrgMember(orgId, {
                                email: inv.email,
                                role: e.target.value,
                              })
                                .then(reload)
                                .then(() => toast.success("Invite role updated"))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof GatewayApiError
                                      ? err.message
                                      : "Failed to update invite role"
                                  )
                                )
                            }
                            className="rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-1.5 text-xs"
                          >
                            <option value="member">Member</option>
                            {seatsAvailable && <option value="node_operator">Manager</option>}
                          </select>
                          <ActionButton
                            type="button"
                            variant="danger"
                            onClick={() =>
                              revokeOrgInvite(orgId, inv.id)
                                .then(reload)
                                .then(() => toast.success("Invitation revoked"))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof GatewayApiError
                                      ? err.message
                                      : "Failed to revoke invitation"
                                  )
                                )
                            }
                          >
                            Revoke
                          </ActionButton>
                        </>
                      )}
                    </div>
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
          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card
              className="overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 0% 0%, rgba(255,107,53,0.08), transparent 55%), var(--surface)",
              }}
            >
              <div className="border-b border-white/[0.06] px-6 py-5">
                <MonoLabel>Workspace settings</MonoLabel>
                <p className="mt-1 max-w-2xl text-sm text-[var(--text-2)]">
                  Configure how this workspace appears in the dashboard and on its public profile page.
                </p>
              </div>

              <div className="space-y-8 px-6 py-6">
                <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="shrink-0">
                    {editLogoUrl.trim() ? (
                      <Image
                        src={editLogoUrl.trim()}
                        alt=""
                        width={80}
                        height={80}
                        unoptimized
                        className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--solana)] to-[var(--accent)] text-2xl font-bold">
                        {(editDisplayName || editName).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={editLogoUrl}
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        placeholder="https://…/logo.png"
                        className="mt-1 border-white/10 bg-[var(--surface-2)] font-mono text-sm"
                      />
                      <p className="mt-1.5 text-xs text-[var(--text-3)]">
                        Stored in your org profile via the gateway. Use a square image with a transparent background.
                      </p>
                    </div>
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
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1 border-white/10 bg-[var(--surface-2)]"
                      />
                    </div>
                    <div>
                      <Label>Public email</Label>
                      <Input
                        value={editPublicEmail}
                        onChange={(e) => setEditPublicEmail(e.target.value)}
                        placeholder="contact@company.com"
                        className="mt-1 border-white/10 bg-[var(--surface-2)]"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={editCountry}
                        onChange={(e) => setEditCountry(e.target.value)}
                        placeholder="United States"
                        className="mt-1 border-white/10 bg-[var(--surface-2)]"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-white/[0.06] bg-[var(--surface-2)]/40 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">Public profile</div>
                      <p className="mt-1 text-sm text-[var(--text-2)]">
                        When enabled, your org is listed at{" "}
                        <span className="font-mono text-[var(--text)]">
                          erebrus.io/org/{publicProfileUrl || "your-slug"}
                        </span>
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
                      <input
                        type="checkbox"
                        checked={editPublicProfile}
                        onChange={(e) => setEditPublicProfile(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      Enable public page
                    </label>
                  </div>
                  {editPublicProfile && publicProfileUrl && (
                    <Link
                      href={`/org/${publicProfileUrl}`}
                      className="mt-3 inline-flex text-sm text-[var(--accent-hi)] hover:underline"
                      target="_blank"
                    >
                      Preview public page →
                    </Link>
                  )}
                </section>

                <div className="flex flex-wrap gap-3">
                  <AccentButton type="button" onClick={saveOrgSettings}>
                    Save settings
                  </AccentButton>
                </div>
              </div>
            </Card>

            {isOwner && (
              <Card className="border-red-500/20 bg-red-500/[0.03] p-6">
                <MonoLabel className="text-red-300/90">Danger zone</MonoLabel>
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">
                  Deleting this workspace removes members, seats, and API keys. Enrolled nodes are
                  detached and keep running. This action cannot be undone.
                </p>
                <ActionButton
                  type="button"
                  variant="danger"
                  className="mt-4"
                  onClick={() => {
                    setDeleteConfirmName("");
                    setDeleteDialogOpen(true);
                  }}
                >
                  Delete organization
                </ActionButton>
              </Card>
            )}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {org.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-2)]">
              This permanently removes the workspace, its members, seats, and API keys. Nodes are
              detached and keep running. Type the workspace name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={org.name}
            className="border-white/10 bg-[var(--surface-2)]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-[var(--text)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmName.trim() !== org.name}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteOrg();
              }}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
