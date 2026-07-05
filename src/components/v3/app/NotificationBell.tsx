"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  acceptAccountOrgInvite,
  declineAccountOrgInvite,
  fetchAccountOrgInvites,
  GatewayApiError,
} from "@/lib/gateway/client";
import type { GatewayUserOrgInvite } from "@/lib/gateway/types";
import { memberRoleLabel } from "@/lib/gateway/member-labels";
import {
  countUnread,
  inviteNotificationId,
  markNotificationRead,
  markNotificationsRead,
} from "@/lib/notifications";
import { ActionButton, iconButtonClass } from "@/components/v3/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<GatewayUserOrgInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [readTick, setReadTick] = useState(0);

  const notificationIds = invites.map((inv) => inviteNotificationId(inv.org_id));
  const unreadCount = countUnread(notificationIds);
  // readTick forces re-render after localStorage updates
  void readTick;

  const reload = useCallback(() => {
    setLoading(true);
    fetchAccountOrgInvites()
      .then(setInvites)
      .catch(() => setInvites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    const interval = window.setInterval(reload, 60_000);
    return () => window.clearInterval(interval);
  }, [reload]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      reload();
      if (notificationIds.length > 0) {
        markNotificationsRead(notificationIds);
        setReadTick((n) => n + 1);
      }
    }
  };

  const acceptInvite = async (inv: GatewayUserOrgInvite) => {
    try {
      await acceptAccountOrgInvite(inv.org_id);
      markNotificationRead(inviteNotificationId(inv.org_id));
      toast.success(`Joined ${inv.org_name}`);
      setInvites((prev) => prev.filter((i) => i.org_id !== inv.org_id));
      setOpen(false);
      router.push(`/workspace/${inv.org_id}`);
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to join workspace");
    }
  };

  const declineInvite = async (inv: GatewayUserOrgInvite) => {
    try {
      await declineAccountOrgInvite(inv.org_id);
      markNotificationRead(inviteNotificationId(inv.org_id));
      toast.message(`Declined invite to ${inv.org_name}`);
      setInvites((prev) => prev.filter((i) => i.org_id !== inv.org_id));
    } catch (e) {
      toast.error(e instanceof GatewayApiError ? e.message : "Failed to decline invite");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(iconButtonClass, "relative")}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--on-accent)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-[min(92vw,340px)] rounded-[14px] border border-white/10 bg-[#14110F] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <div className="border-b border-white/[0.06] px-4 py-3">
              <div className="text-sm font-semibold">Notifications</div>
              <p className="mt-0.5 text-xs text-[var(--text-3)]">
                Workspace invitations and updates
              </p>
            </div>

            <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {loading && invites.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--text-3)]">Loading…</p>
              ) : invites.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--text-2)]">
                  No pending notifications
                </p>
              ) : (
                invites.map((inv) => (
                  <div
                    key={inv.id}
                    className="mb-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="text-sm font-medium">{inv.org_name}</div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
                      You&apos;ve been invited as{" "}
                      <span className="text-[var(--text)]">{memberRoleLabel(inv.role)}</span>
                      {inv.source === "email" ? " via email" : ""}.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton
                        type="button"
                        variant="accent"
                        className="!px-3 !py-1.5 !text-xs"
                        onClick={() => acceptInvite(inv)}
                      >
                        Join
                      </ActionButton>
                      <ActionButton
                        type="button"
                        className="!px-3 !py-1.5 !text-xs"
                        onClick={() => declineInvite(inv)}
                      >
                        Decline
                      </ActionButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}