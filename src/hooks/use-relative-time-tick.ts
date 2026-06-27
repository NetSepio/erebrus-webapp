"use client";

import { useEffect, useState } from "react";
import { NODE_POLL_INTERVAL_MS } from "@/hooks/use-online-nodes";

/** Re-render on an interval so formatRelativeTime() stays current between fetches. */
export function useRelativeTimeTick(intervalMs = NODE_POLL_INTERVAL_MS) {
  const [, bump] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => bump((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}