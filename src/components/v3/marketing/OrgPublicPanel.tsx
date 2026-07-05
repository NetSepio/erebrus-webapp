import Image from "next/image";
import Link from "next/link";
import { fetchNodes, fetchPublicOrgProfile } from "@/lib/gateway/client";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton, Card, Eyebrow, MonoLabel } from "@/components/v3/ui";
import { notFound } from "next/navigation";

export async function OrgPublicPanel({ slug }: { slug: string }) {
  let profile;
  try {
    profile = await fetchPublicOrgProfile(slug);
  } catch {
    notFound();
  }

  const [onlineNodes, offlineNodes] = await Promise.all([
    fetchNodes({ status: "online" }).catch(() => []),
    fetchNodes({ status: "offline" }).catch(() => []),
  ]);
  const orgNodes = [...onlineNodes, ...offlineNodes].filter((n) => n.org?.slug === slug);
  const online = orgNodes.filter((n) => n.status === "online").length;
  const displayName = profile.display_name?.trim() || profile.name;

  return (
    <>
      <MarketingNav variant="platform" />

      <section className="mx-auto max-w-[1180px] px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex shrink-0 items-start gap-5">
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt=""
                width={88}
                height={88}
                unoptimized
                className="h-[88px] w-[88px] rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--solana)] to-[var(--accent)] text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pt-1">
              <Eyebrow className="mb-2">Organization</Eyebrow>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{displayName}</h1>
              {profile.slug && (
                <p className="mt-2 font-mono text-sm text-[var(--text-3)]">@{profile.slug}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:ml-auto md:pt-2">
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                <AccentButton variant="ghost">Website</AccentButton>
              </a>
            )}
            <Link href="/workspace">
              <AccentButton>Join Erebrus</AccentButton>
            </Link>
          </div>
        </div>

        {profile.description && (
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[var(--text-2)]">
            {profile.description}
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <MonoLabel>Public nodes</MonoLabel>
            <div className="mt-2 text-3xl font-bold">{orgNodes.length}</div>
          </Card>
          <Card className="p-5">
            <MonoLabel>Online now</MonoLabel>
            <div className="mt-2 text-3xl font-bold text-[var(--success)]">{online}</div>
          </Card>
          <Card className="p-5">
            <MonoLabel>Region</MonoLabel>
            <div className="mt-2 text-lg font-semibold capitalize">
              {profile.country?.trim() || "Global"}
            </div>
          </Card>
        </div>

        {(profile.public_email || profile.country) && (
          <Card className="mt-6 p-5">
            <MonoLabel>Contact</MonoLabel>
            <div className="mt-3 flex flex-wrap gap-6 text-sm text-[var(--text-2)]">
              {profile.public_email && (
                <a
                  href={`mailto:${profile.public_email}`}
                  className="hover:text-[var(--text)]"
                >
                  {profile.public_email}
                </a>
              )}
              {profile.country && <span>{profile.country}</span>}
            </div>
          </Card>
        )}

        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <Eyebrow className="mb-2">Network</Eyebrow>
              <h2 className="text-2xl font-bold">Public nodes</h2>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Discoverable nodes operated by this organization on the Erebrus network.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden">
            {orgNodes.length === 0 ? (
              <p className="px-5 py-10 text-sm text-[var(--text-2)]">
                No public nodes are listed for this organization yet.
              </p>
            ) : (
              orgNodes.map((node) => (
                <div
                  key={node.id}
                  className="flex flex-col gap-2 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: node.status === "online" ? "var(--success)" : "var(--text-3)",
                        boxShadow:
                          node.status === "online" ? "0 0 8px var(--success)" : undefined,
                      }}
                    />
                    <div>
                      <div className="font-semibold">{node.name}</div>
                      <div className="font-mono text-[11px] text-[var(--text-3)]">
                        {node.region}
                        {node.zone ? ` · ${node.zone}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="capitalize text-[var(--text-2)]">{node.status}</span>
                    {node.protocols && node.protocols.length > 0 && (
                      <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--text-3)]">
                        {node.protocols.join(" · ")}
                      </span>
                    )}
                    {typeof node.load_pct === "number" && (
                      <span className="font-mono text-[11px] text-[var(--text-3)]">
                        {Math.round(node.load_pct)}% load
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}