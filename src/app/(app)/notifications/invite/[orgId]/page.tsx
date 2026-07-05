"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchAccountOrgInvite } from "@/lib/gateway/client";
import type { GatewayUserOrgInvite } from "@/lib/gateway/types";
import { OrgInviteDetailPanel } from "@/components/v3/app/OrgInviteDetailPanel";
import { Card } from "@/components/v3/ui";

export default function OrgInviteNotificationPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const [invite, setInvite] = useState<GatewayUserOrgInvite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchAccountOrgInvite(orgId)
      .then(setInvite)
      .catch(() => setError("This invitation is no longer available."));
  }, [orgId]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/workspace" className="inline-flex text-sm text-[var(--text-2)] hover:text-[var(--text)]">
        ← Back to workspaces
      </Link>

      <Card className="p-6">
        {error ? (
          <p className="text-sm text-[var(--text-2)]">{error}</p>
        ) : invite ? (
          <OrgInviteDetailPanel invite={invite} />
        ) : (
          <p className="text-sm text-[var(--text-3)]">Loading invitation…</p>
        )}
      </Card>
    </div>
  );
}