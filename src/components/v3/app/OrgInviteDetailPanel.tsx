"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  acceptAccountOrgInvite,
  declineAccountOrgInvite,
  GatewayApiError,
} from "@/lib/gateway/client";
import type { GatewayUserOrgInvite } from "@/lib/gateway/types";
import { memberRoleLabel } from "@/lib/gateway/member-labels";
import {
  formatInviteDate,
  inviteOrgTitle,
  invitePreviewSubline,
} from "@/lib/invite-notifications";
import { inviteNotificationId, markNotificationRead } from "@/lib/notifications";
import { orgPlanLabel } from "@/lib/org-plans";
import { AccentButton, ActionButton, Card, MonoLabel } from "@/components/v3/ui";
import { toast } from "sonner";

export function OrgInviteDetailPanel({
  invite,
  onClose,
  onResolved,
}: {
  invite: GatewayUserOrgInvite;
  onClose?: () => void;
  onResolved?: () => void;
}) {
  const router = useRouter();
  const title = inviteOrgTitle(invite);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      await acceptAccountOrgInvite(invite.org_id);
      markNotificationRead(inviteNotificationId(invite.org_id));
      toast.success(`Joined ${title}`);
      onResolved?.();
      onClose?.();
      router.push(`/workspace/${invite.org_id}`);
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to join workspace");
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await declineAccountOrgInvite(invite.org_id);
      markNotificationRead(inviteNotificationId(invite.org_id));
      toast.message(`Declined invite to ${title}`);
      onResolved?.();
      onClose?.();
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to decline invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        {invite.org_logo_url ? (
          <Image
            src={invite.org_logo_url}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--solana)] to-[var(--accent)] text-2xl font-bold">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <MonoLabel>Workspace invitation</MonoLabel>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
          {invite.org_name !== title && (
            <p className="mt-0.5 text-sm text-[var(--text-3)]">{invite.org_name}</p>
          )}
          <p className="mt-2 text-sm text-[var(--text-2)]">{invitePreviewSubline(invite)}</p>
        </div>
      </div>

      <Card className="grid gap-3 p-4 sm:grid-cols-2">
        <DetailItem label="Your role" value={memberRoleLabel(invite.role)} />
        <DetailItem
          label="Plan"
          value={invite.org_plan ? orgPlanLabel(invite.org_plan) : "Workspace"}
        />
        <DetailItem label="Team size" value={`${invite.member_count ?? 0} members`} />
        <DetailItem label="Nodes" value={`${invite.node_count ?? 0} enrolled`} />
        {invite.seat_tier && invite.seat_tier !== "free" && (
          <DetailItem label="VPN seat" value={invite.seat_tier} />
        )}
        {invite.invited_by_name && (
          <DetailItem label="Invited by" value={invite.invited_by_name} />
        )}
        <DetailItem
          label="Sent"
          value={formatInviteDate(invite.created_at)}
          className="sm:col-span-2"
        />
      </Card>

      {invite.org_description?.trim() && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <MonoLabel>About this workspace</MonoLabel>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
            {invite.org_description.trim()}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[var(--accent)]/5 px-4 py-3 text-sm leading-relaxed text-[var(--text-2)]">
        Accepting adds you to <span className="text-[var(--text)]">{title}</span> with{" "}
        <span className="text-[var(--text)]">{memberRoleLabel(invite.role)}</span> access.
        Declining notifies the workspace team and removes this invite.
      </div>

      <div className="flex flex-wrap gap-3">
        <AccentButton type="button" onClick={accept} disabled={busy}>
          Accept & join workspace
        </AccentButton>
        <ActionButton type="button" variant="danger" onClick={decline} disabled={busy}>
          Decline invitation
        </ActionButton>
        {onClose && (
          <ActionButton type="button" onClick={onClose} disabled={busy}>
            Close
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-3)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-[var(--text)]">{value}</div>
    </div>
  );
}