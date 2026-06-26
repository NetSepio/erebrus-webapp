"use client";

import { useEffect, useState } from "react";
import { fetchActivity } from "@/lib/gateway/client";
import type { GatewayActivity } from "@/lib/gateway/types";
import { AccentButton, Card } from "@/components/v3/ui";

export function ActivityLogPanel() {
  const [activity, setActivity] = useState<GatewayActivity[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity({ limit: 20 })
      .then((a) => {
        setActivity(a.items ?? []);
        setActivityCursor(a.next_cursor);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMoreActivity = async () => {
    if (!activityCursor) return;
    const a = await fetchActivity({ limit: 20, cursor: activityCursor });
    setActivity((prev) => [...prev, ...(a.items ?? [])]);
    setActivityCursor(a.next_cursor);
  };

  if (loading) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading activity…</div>;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <span className="font-semibold">Activity log</span>
        <span className="font-mono text-[11px] text-[var(--text-3)]">IP + device recorded</span>
      </div>
      {activity.length === 0 ? (
        <p className="px-5 py-8 text-sm text-[var(--text-2)]">No activity yet.</p>
      ) : (
        activity.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3.5 border-b border-white/[0.04] px-5 py-3.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[var(--accent)]/10 font-mono text-sm text-[var(--accent-hi)]">
              ◎
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{a.action}</div>
              <div className="font-mono text-[11px] text-[var(--text-3)]">
                {[a.ip, a.device, a.app].filter(Boolean).join(" · ")}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-[var(--text-3)]">
              {new Date(a.created_at).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
      {activityCursor && (
        <div className="border-t border-white/[0.06] px-5 py-3">
          <AccentButton
            type="button"
            variant="outline"
            className="w-full !py-2 !text-xs"
            onClick={loadMoreActivity}
          >
            Load more activity
          </AccentButton>
        </div>
      )}
    </Card>
  );
}