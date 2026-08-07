"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminUser,
  fetchAdminUserOrgs,
  setAdminUserPlan,
  patchAdminOrg,
  fulfillAdminDeletionRequest,
  GatewayApiError,
} from "@/lib/gateway/client";
import type {
  GatewayAdminUserProfile,
  GatewayAdminOrg,
  GatewayDeletionRequest,
} from "@/lib/gateway/types";
import { truncateAddress } from "@/lib/design";
import { ORG_PLAN_IDS, orgPlanLabel } from "@/lib/org-plans";
import { Card, AccentButton, ActionButton, MonoLabel } from "@/components/v3/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";

export interface AdminUserProfileProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

function requestLabel(r: GatewayDeletionRequest | null | undefined) {
  if (!r) return "No request";
  if (r.status === "fulfilled") return `Fulfilled · ${r.fulfilled_at ? new Date(r.fulfilled_at).toLocaleDateString() : "—"}`;
  return `Pending since ${new Date(r.requested_at).toLocaleDateString()}`;
}

export function AdminUserProfile({ userId, open, onOpenChange, onChanged }: AdminUserProfileProps) {
  const [user, setUser] = useState<GatewayAdminUserProfile | null>(null);
  const [orgs, setOrgs] = useState<GatewayAdminOrg[]>([]);
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string>("");
  const [savingPlan, setSavingPlan] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [u, o] = await Promise.all([fetchAdminUser(userId), fetchAdminUserOrgs(userId)]);
      setUser(u);
      setPlanId(u.plan ?? "personal.basic");
      setOrgs(o);
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      void load();
    } else {
      setUser(null);
      setOrgs([]);
    }
  }, [open, userId, load]);

  const savePlan = async () => {
    if (!userId || !planId) return;
    setSavingPlan(true);
    try {
      await setAdminUserPlan(userId, planId);
      toast.success(`Plan set to ${planId}`);
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to set plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const toggleOrgVerified = async (org: GatewayAdminOrg) => {
    if (!org.id) return;
    const next = !org.verified;
    try {
      await patchAdminOrg(org.id, next);
      toast.success(next ? "Org verified" : "Org unverified");
      setOrgs((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, verified: next } : o))
      );
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to update org");
    }
  };

  const fulfillDeletion = async () => {
    const id = user?.deletion_request?.id;
    if (!id) return;
    if (!window.confirm("This will permanently delete the user account and any owned orgs. Continue?")) return;
    try {
      await fulfillAdminDeletionRequest(id);
      toast.success("Account deleted and confirmation email sent");
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to fulfill request");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full border-white/[0.07] bg-[var(--surface-1)] text-[var(--text)] sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>User profile</SheetTitle>
          <SheetDescription>
            {userId ? `ID ${userId.slice(0, 8)}…` : "Select a user to view details"}
          </SheetDescription>
        </SheetHeader>

        {loading && !user ? (
          <div className="mt-6 text-sm text-[var(--text-2)]">Loading user…</div>
        ) : !user ? (
          <div className="mt-6 text-sm text-[var(--text-2)]">No user selected.</div>
        ) : (
          <div className="mt-6 space-y-5">
            <Card className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Wallet</span>
                <span className="font-mono text-xs">
                  {user.wallet_address ? truncateAddress(user.wallet_address) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Name</span>
                <span className="text-sm">{user.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Email</span>
                <span className="text-sm">{user.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Role</span>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Joined</span>
                <span className="text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </Card>

            <Card className="space-y-3 p-5">
              <MonoLabel className="text-[var(--accent-hi)]">Plan</MonoLabel>
              <div className="flex items-center gap-2">
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="flex-1 rounded-md border border-white/10 bg-[var(--surface-2)] px-2 py-1.5 text-xs capitalize text-[var(--text)]"
                >
                  {ORG_PLAN_IDS.map((p) => (
                    <option key={p} value={p}>
                      {orgPlanLabel(p)}
                    </option>
                  ))}
                </select>
                <ActionButton onClick={savePlan} disabled={savingPlan || planId === (user.plan ?? "personal.basic")}>
                  {savingPlan ? "Saving…" : "Save"}
                </ActionButton>
              </div>
              <p className="text-xs text-[var(--text-3)]">Current plan: {user.plan ? orgPlanLabel(user.plan) : "—"}</p>
            </Card>

            <Card className="space-y-3 p-5">
              <MonoLabel className="text-[var(--accent-hi)]">Organizations</MonoLabel>
              {orgs.length === 0 ? (
                <p className="text-sm text-[var(--text-2)]">No organizations.</p>
              ) : (
                <div className="space-y-2">
                  {orgs.map((o) => (
                    <div
                      key={o.id ?? o.name}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{o.name}</div>
                        <div className="text-xs text-[var(--text-3)]">
                          {o.plan ? orgPlanLabel(o.plan) : o.kind} · {o.verified ? "verified" : "unverified"}
                        </div>
                      </div>
                      {o.id && (
                        <ActionButton
                          variant={o.verified ? "neutral" : "accent"}
                          onClick={() => toggleOrgVerified(o)}
                        >
                          {o.verified ? "Unverify" : "Verify"}
                        </ActionButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-3 p-5">
              <MonoLabel className="text-[var(--accent-hi)]">Account deletion</MonoLabel>
              <p className="text-sm text-[var(--text-2)]">{requestLabel(user.deletion_request)}</p>
              {user.deletion_request?.status === "pending" && (
                <AccentButton
                  type="button"
                  variant="danger"
                  className="w-full"
                  onClick={fulfillDeletion}
                >
                  Delete account
                </AccentButton>
              )}
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
