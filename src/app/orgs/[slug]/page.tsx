import { OrgJoinPanel } from "@/components/v3/workspace/OrgJoinPanel";

export default async function OrgInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrgJoinPanel slug={slug} />;
}