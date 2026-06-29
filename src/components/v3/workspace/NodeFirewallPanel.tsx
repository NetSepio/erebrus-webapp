"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createFirewallRule,
  deleteFirewallRule,
  fetchFirewallRules,
  fetchFirewallService,
  fetchFirewallStatus,
  restartFirewall,
  syncFirewall,
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