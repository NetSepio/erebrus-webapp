"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createFirewallRule,
  deleteFirewallRule,
  fetchFirewallRules,
  fetchFirewallService,
  fetchFirewallStatus,
  fetchFirewallCredentials,
  updateFirewallCredentials,
  restartFirewall,
  syncFirewall,
  GatewayApiError,
  type GatewayFirewallCredentials,
} from "@/lib/gateway/client";
import type { GatewayFirewallRule, GatewayOrgNode } from "@/lib/gateway/types";
import { profileLabel, serviceStatusLabel } from "@/lib/gateway/profiles";
import { AccentButton, ActionButton, Card, MonoLabel } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const RULE_TYPES = [
  { value: "domain_block", label: "Block domain" },
  { value: "wildcard_domain_block", label: "Block wildcard" },
  { value: "domain_allow", label: "Allow domain" },
  { value: "dns_rewrite", label: "DNS rewrite" },
  { value: "upstream_resolver_config", label: "Upstream resolver" },
] as const;

export function NodeFirewallPanel({
  orgId,
  node,
  canManage,
}: {
  orgId: string;
  node: GatewayOrgNode;
  canManage: boolean;
}) {
  const [kind, setKind] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [rules, setRules] = useState<GatewayFirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleType, setRuleType] = useState("domain_block");
  const [target, setTarget] = useState("");
  const [rewriteValue, setRewriteValue] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchFirewallService(orgId, node.node_id).catch(() => null),
      fetchFirewallStatus(orgId, node.node_id).catch(() => null),
      fetchFirewallRules(orgId, node.node_id).catch(() => []),
    ])
      .then(([svc, st, r]) => {
        setKind(svc?.service_kind ?? st?.service_kind ?? "");
        setStatus(svc?.service.service_status ?? st?.service_status ?? "");
        setRules(r);
      })
      .finally(() => setLoading(false));
  }, [orgId, node.node_id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onSync = async () => {
    try {
      const res = await syncFirewall(orgId, node.node_id);
      toast.success(
        res.node_notified
          ? `Policy synced (${res.rules ?? 0} rules pushed to node)`
          : "Policy saved — node offline, sync queued until reconnect"
      );
      reload();
    } catch {
      toast.error("Firewall sync failed");
    }
  };

  const onRestart = async () => {
    try {
      await restartFirewall(orgId, node.node_id);
      toast.success("Restart requested");
      reload();
    } catch {
      toast.error("Restart failed");
    }
  };

  const onAddRule = async () => {
    if (!target.trim()) return;
    try {
      const body: {
        rule_type: string;
        target: string;
        action?: string;
        enabled: boolean;
      } = {
        rule_type: ruleType,
        target: target.trim(),
        enabled: true,
      };
      if (ruleType === "dns_rewrite") {
        body.action = rewriteValue.trim();
      }
      await createFirewallRule(orgId, node.node_id, body);
      setTarget("");
      setRewriteValue("");
      reload();
      toast.success("Rule added — sync to apply on node");
    } catch {
      toast.error("Failed to add rule");
    }
  };

  const onDeleteRule = async (ruleId: string) => {
    try {
      await deleteFirewallRule(orgId, node.node_id, ruleId);
      reload();
      toast.success("Rule removed");
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--text-2)]">Loading firewall…</p>;
  }

  if (!kind) {
    return (
      <Card className="p-5">
        <p className="text-sm text-[var(--text-2)]">
          No firewall service on this node. Deploy with profile{" "}
          <strong>shield</strong> or <strong>sentinel</strong> and register with{" "}
          <code className="font-mono text-xs">deployment_profile</code>.
        </p>
        <p className="mt-2 text-xs text-[var(--text-3)]">
          Current profile: {profileLabel(node.deployment_profile)}
        </p>
      </Card>
    );
  }

  const isSentinel = kind === "sentinel";

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="font-semibold capitalize">{kind} firewall</div>
          <div className="text-sm text-[var(--text-2)]">
            Status: {serviceStatusLabel(status)}
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <AccentButton type="button" onClick={onSync}>
              Sync to node
            </AccentButton>
            <ActionButton type="button" onClick={onRestart}>
              Restart
            </ActionButton>
          </div>
        )}
      </Card>

      {kind === "shield" && <ShieldCredentialsCard orgId={orgId} nodeId={node.node_id} />}

      {isSentinel ? (
        <>
          {canManage && (
            <Card className="space-y-3 p-4">
              <MonoLabel>Add Sentinel rule</MonoLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--surface-2)] px-3 py-2 text-sm"
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="ads.example.com or *.tracker.com"
                    className="mt-1 border-white/10 bg-[var(--surface-2)]"
                  />
                </div>
                {ruleType === "dns_rewrite" && (
                  <div className="sm:col-span-2">
                    <Label>Rewrite to (IP)</Label>
                    <Input
                      value={rewriteValue}
                      onChange={(e) => setRewriteValue(e.target.value)}
                      placeholder="10.0.0.5"
                      className="mt-1 border-white/10 bg-[var(--surface-2)]"
                    />
                  </div>
                )}
              </div>
              <AccentButton type="button" onClick={onAddRule}>
                Add rule
              </AccentButton>
            </Card>
          )}

          <Card className="overflow-hidden">
            {rules.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--text-2)]">No rules yet.</p>
            ) : (
              rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm">{r.target}</div>
                    <div className="text-xs text-[var(--text-3)]">
                      {r.rule_type}
                      {r.action ? ` · ${r.action}` : ""}
                    </div>
                  </div>
                  {canManage && (
                    <ActionButton type="button" variant="danger" onClick={() => onDeleteRule(r.id)}>
                      Delete
                    </ActionButton>
                  )}
                </div>
              ))
            )}
          </Card>
        </>
      ) : (
        <Card className="p-5 text-sm text-[var(--text-2)]">
          Shield uses AdGuard Home for DNS filtering. Sync pushes cache refresh to the node;
          manage blocklists in the Shield admin UI when deployed.
        </Card>
      )}
    </div>
  );
}

function ShieldCredentialsCard({ orgId, nodeId }: { orgId: string; nodeId: string }) {
  const [creds, setCreds] = useState<GatewayFirewallCredentials | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const reveal = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchFirewallCredentials(orgId, nodeId);
      setCreds(c);
      setRevealed(true);
    } catch (e) {
      if (e instanceof GatewayApiError) {
        if (e.status === 403) toast.error("Requires a paid seat in this org");
        else if (e.status === 404) toast.error("The node hasn't reported an admin login yet");
        else toast.error(e.message);
      } else {
        toast.error("Could not load credentials");
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, nodeId]);

  const rotate = async () => {
    if (newPassword.trim().length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }
    setUpdating(true);
    try {
      await updateFirewallCredentials(orgId, nodeId, newPassword.trim());
      toast.success("Password updated — the node will apply it");
      setNewPassword("");
      await reveal();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Could not update password");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <MonoLabel>AdGuard admin login</MonoLabel>
        {!revealed && (
          <ActionButton type="button" onClick={reveal} disabled={loading}>
            {loading ? "Loading…" : "Reveal"}
          </ActionButton>
        )}
      </div>
      {revealed && creds ? (
        <>
          <div className="space-y-1.5 rounded-[11px] border border-white/[0.06] bg-white/[0.015] p-3 font-mono text-sm">
            {creds.admin_url && (
              <div className="flex justify-between gap-3">
                <span className="text-[var(--text-3)]">Console</span>
                <a
                  href={creds.admin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[var(--accent-hi)] hover:underline"
                >
                  {creds.admin_url}
                </a>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-[var(--text-3)]">User</span>
              <span>{creds.admin_user}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--text-3)]">Password</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(creds.admin_password);
                  toast.success("Password copied");
                }}
                className="truncate text-left hover:text-[var(--accent-hi)]"
                title="Click to copy"
              >
                {creds.admin_password}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1">
              <Label>New password</Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Rotate the admin password"
                className="mt-1 border-white/10 bg-[var(--surface-2)]"
              />
            </div>
            <AccentButton type="button" onClick={rotate} disabled={updating || !newPassword.trim()}>
              {updating ? "Updating…" : "Update"}
            </AccentButton>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-2)]">
          The Shield node&apos;s AdGuard admin login is stored encrypted. Org paid seats can reveal and
          rotate it here.
        </p>
      )}
    </Card>
  );
}