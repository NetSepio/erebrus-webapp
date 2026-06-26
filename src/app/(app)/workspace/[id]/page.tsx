"use client";

import { useParams } from "next/navigation";
import { OrgDetailPanel } from "@/components/v3/workspace/OrgDetailPanel";

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <OrgDetailPanel orgId={id} />;
}