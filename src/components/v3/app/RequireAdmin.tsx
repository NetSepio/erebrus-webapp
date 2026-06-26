"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { Card } from "@/components/v3/ui";
import { Loader2 } from "lucide-react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = usePlatformAdmin();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-bold">Admin access required</h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          This area is limited to platform administrators.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-[10px] border border-[var(--accent)]/30 bg-[var(--accent)]/14 px-4 py-2 text-sm font-semibold text-[var(--accent-hi)]"
        >
          ← Back to dashboard
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}