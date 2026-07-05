"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAccountOrgInvites } from "@/lib/gateway/client";
import type { GatewayUserOrgInvite } from "@/lib/gateway/types";
import {
  countUnread,
  inviteNotificationId,
  markNotificationsRead,
} from "@/lib/notifications";
import { invitePreviewLine, invitePreviewSubline } from "@/lib/invite-notifications";
import { OrgInviteDetailPanel } from "@/components/v3/app/OrgInviteDetailPanel";
import { iconButtonClass } from "@/components/v3/ui";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [detailInvite, setDetailInvite] = useState<GatewayUserOrgInvite | null>(null);
  const [invites, setInvites] = useState<GatewayUserOrgInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [readTick, setReadTick] = useState(0);

  const notificationIds = invites.map((inv) => inviteNotificationId(inv.org_id));
  const unreadCount = countUnread(notificationIds);
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

  const openDetail = (inv: GatewayUserOrgInvite) => {
    setDetailInvite(inv);
    setOpen(false);
  };

  return (
    <>
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
            <div className="absolute right-0 top-12 z-40 w-[min(92vw,380px)] rounded-[14px] border border-white/10 bg-[#14110F] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <div className="text-sm font-semibold">Notifications</div>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">
                  Tap an invite for full details and actions
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
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => openDetail(inv)}
                      className="mb-1 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-[var(--accent)]/25 hover:bg-white/[0.04]"
                    >
                      <div className="text-sm font-semibold leading-snug">
                        {invitePreviewLine(inv)}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-3)]">
                        {invitePreviewSubline(inv)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!detailInvite} onOpenChange={(v) => !v && setDetailInvite(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <DialogHeader>
            <DialogTitle className="sr-only">Workspace invitation</DialogTitle>
          </DialogHeader>
          {detailInvite && (
            <OrgInviteDetailPanel
              invite={detailInvite}
              onClose={() => setDetailInvite(null)}
              onResolved={() => {
                reload();
                setDetailInvite(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}