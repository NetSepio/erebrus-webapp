import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";
import { LiveNetworkStats } from "@/components/v3/marketing/LiveNetworkStats";
import { LandingNetworkPreview } from "@/components/v3/marketing/LandingNetworkPreview";
import { LiveNetworkBadge } from "@/components/v3/marketing/LiveNetworkBadge";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Erebrus — The sovereign internet",
  path: "/",
});

const features = [
  {
    glyph: "⬡",
    title: "Community-owned",
    desc: "No central company can log your traffic or shut you off. The network is run by operators worldwide.",
  },
  {
    glyph: "◎",
    title: "Wallet-native auth",
    desc: "Sign in with Solana or EVM wallets. No passwords stored, no accounts sold.",
  },
  {
    glyph: "◇",
    title: "WireGuard tunnels",
    desc: "Modern VPN protocol with fast, audited cryptography. Configs provisioned per device.",
  },
  {
    glyph: "↔",
    title: "Drop — local-first",
    desc: "Share files device-to-device on local Wi-Fi. Nothing touches the cloud.",
  },
  {
    glyph: "✦",
    title: "Earn as operator",
    desc: "Run a node, track uptime, earn XP. Private or public — your infrastructure, your rules.",
  },
  {
    glyph: "◈",
    title: "Workspaces",
    desc: "Group nodes into orgs with enrollment secrets, API keys, and member management.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect wallet",
    desc: "Phantom, MetaMask, or WalletConnect. Sign the EULA message — that's your login.",
  },
  {
    num: "02",
    title: "Start your trial",
    desc: "7-day free access, no card. Hold an NFT? Get 30 days automatically.",
  },
  {
    num: "03",
    title: "Connect & go",
    desc: "Pick a node, provision a WireGuard config, download to any device.",
  },
];

export default function LandingPage() {
  return (
    <>
      <MarketingNav variant="platform" />

      <section className="mx-auto max-w-[1180px] px-4 py-16 text-center md:px-8 md:py-24">
        <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
          <LiveNetworkBadge />
        </div>

        <h1 className="mx-auto max-w-[900px] text-4xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-[78px]">
          A sovereign
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)" }}
          >
            internet.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-[640px] text-base leading-relaxed text-[var(--text-2)] md:text-xl">
          Erebrus is privacy infrastructure owned by the people who run it. A decentralized VPN
          that can&apos;t log you, and Drop for sharing files device-to-device — no clouds, no
          accounts, no middlemen.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
          <AuthModalTrigger>
            <AccentButton className="!px-6 !py-4 !text-base">
              Launch app <span className="text-lg">→</span>
            </AccentButton>
          </AuthModalTrigger>
          <Link href="#products">
            <AccentButton variant="ghost" className="!px-6 !py-4 !text-base">
              Explore products
            </AccentButton>
          </Link>
        </div>

        <p className="mt-6 font-mono text-xs text-[var(--text-3)]">
          Two products live today · VPN + Drop · more on the way
        </p>

        <LandingNetworkPreview />
      </section>

      <section id="products" className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <div className="mb-12 text-center">
          <Eyebrow className="mb-4">The Erebrus suite</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight md:text-[44px]">
            One platform, sovereign tools
          </h2>
          <p className="mx-auto mt-4 max-w-[640px] text-[var(--text-2)]">
            Each product stands on its own, and shares one identity, one network, and one promise:
            your data stays yours.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/vpn" className="group">
            <Card className="h-full p-8 transition-colors hover:border-[var(--accent)]/30"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 15% 0%, rgba(255,107,53,0.12), transparent 55%), linear-gradient(180deg, #131318, #0C0B0E)",
              }}
            >
              <div className="mb-5 flex items-center gap-3.5">
                <Image src="/brand/erebrus-vpn.png" alt="" width={52} height={52} className="rounded-[14px]" />
                <div>
                  <div className="text-xl font-bold">Erebrus VPN</div>
                  <div className="font-mono text-[11px] text-[var(--success)]">● Live</div>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-[var(--text-2)]">
                A decentralized VPN backed by a global network of community nodes. Wallet login,
                WireGuard tunnels, and no logs — ever.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[var(--accent-hi)]">
                Explore VPN →
              </span>
            </Card>
          </Link>

          <Link href="/drop" className="group">
            <Card
              className="h-full p-8 transition-colors hover:border-[var(--accent)]/30"
              style={{
                background:
                  "radial-gradient(ellipse 90% 70% at 15% 0%, rgba(255,126,68,0.14), transparent 55%), linear-gradient(180deg, #131318, #0C0B0E)",
              }}
            >
              <div className="mb-5 flex items-center gap-3.5">
                <Image src="/brand/erebrus-drop.png" alt="" width={56} height={56} />
                <div>
                  <div className="text-xl font-bold">Erebrus Drop</div>
                  <div className="font-mono text-[11px] text-[var(--success)]">● Live · local-first</div>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-[var(--text-2)]">
                Turn any phone into a temporary, secure file server on your local Wi-Fi or hotspot.
                Nothing touches the cloud.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-[var(--accent-hi)]">
                Explore Drop →
              </span>
            </Card>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
        <LiveNetworkStats />
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-4 py-20 md:px-8">
        <div className="mb-14 text-center">
          <Eyebrow className="mb-4">Why Erebrus</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight md:text-[44px]">
            Privacy that doesn&apos;t ask permission
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 font-mono text-lg text-[var(--accent)]">
                {f.glyph}
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <div className="mb-14 text-center">
          <Eyebrow className="mb-4">How it works</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight md:text-[44px]">
            Connected in under a minute
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((st) => (
            <Card
              key={st.num}
              className="p-7"
              style={{ background: "linear-gradient(180deg, #131318, #0D0D11)" }}
            >
              <div className="mb-4 font-mono text-[13px] text-[var(--accent)]">{st.num}</div>
              <h3 className="text-lg font-semibold">{st.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{st.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="operators" className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <Card
          className="flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center md:p-14"
          style={{
            borderColor: "rgba(255,107,53,0.22)",
            background:
              "radial-gradient(ellipse 70% 130% at 80% 0%, rgba(255,107,53,0.14), transparent 60%), linear-gradient(180deg, #131318, #0D0D11)",
          }}
        >
          <div className="max-w-[540px]">
            <Eyebrow className="mb-4">For operators</Eyebrow>
            <h2 className="text-2xl font-bold tracking-tight md:text-[38px]">
              Run a node. Power the network. Earn.
            </h2>
            <p className="mt-4 text-[var(--text-2)]">
              Turn spare bandwidth into a node on the Erebrus network. Enroll a machine, set it
              public or private, and track uptime and rewards from your operator dashboard.
            </p>
          </div>
          <AuthModalTrigger>
            <AccentButton className="whitespace-nowrap">Become an operator →</AccentButton>
          </AuthModalTrigger>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}