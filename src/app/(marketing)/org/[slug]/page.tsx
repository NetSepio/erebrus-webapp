import { OrgPublicPanel } from "@/components/v3/marketing/OrgPublicPanel";

export default async function OrgPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrgPublicPanel slug={slug} />;
}