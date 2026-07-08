"use client";

import { useCallback, useState } from "react";
import {
  fetchFirewallCredentials,
  updateFirewallCredentials,
  GatewayApiError,
  type GatewayFirewallCredentials,
} from "@/lib/gateway/client";
import { resolveShieldAdminUrl } from "@/lib/shield-access";
import { AccentButton, ActionButton, Card, MonoLabel } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ShieldCredentialsCard({
  orgId,
  nodeId,
  nodeName,
  compact = false,
  canRotate = true,
}: {
  orgId: string;
  nodeId: string;
  nodeName?: string;
  compact?: boolean;
  canRotate?: boolean;
}) {
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
        if (e.status === 403) {
          toast.error("Requires a paid seat in this workspace — ask the owner to assign one.");
        } else if (e.status === 404) {
          toast.error("This node has not reported AdGuard credentials yet.");
        } else {
          toast.error(e.message);
        }
      } else {
        toast.error("Could not load Shield credentials");
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

  const access = creds
    ? resolveShieldAdminUrl(creds.admin_url, nodeName)
    : null;

  return (
    <Card className={compact ? "space-y-2.5 p-3" : "space-y-3 p-4"}>
      <div className="flex items-center justify-between gap-2">
        <MonoLabel>Shield / AdGuard</MonoLabel>
        {!revealed && (
          <ActionButton type="button" onClick={reveal} disabled={loading}>
            {loading ? "Loading…" : "Reveal login"}
          </ActionButton>
        )}
      </div>

      {revealed && creds ? (
        <>
          <p className="text-xs leading-relaxed text-[var(--text-3)]">
            Download WireGuard below, connect, then open the AdGuard console for DNS filtering.
            {access?.note ? ` ${access.note}` : ""}
          </p>
          <div className="space-y-1.5 rounded-[11px] border border-white/[0.06] bg-white/[0.015] p-3 font-mono text-sm">
            {access?.url && (
              <div className="flex justify-between gap-3">
                <span className="text-[var(--text-3)]">Console</span>
                <a
                  href={access.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[var(--accent-hi)] hover:underline"
                >
                  {access.url}
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
          {canRotate && !compact && (
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
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--text-2)]">
          AdGuard admin login is stored encrypted on the gateway. Paid workspace seats can reveal it
          to manage DNS blocklists after connecting via WireGuard.
        </p>
      )}
    </Card>
  );
}