import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";
import { LiveNetworkStats } from "@/components/v3/marketing/LiveNetworkStats";
import { AppDownloadLinks } from "@/components/v3/marketing/AppDownloadLinks";

const vpnDownloadLinks = {
  googleHref: "https://play.google.com/store/apps/details?id=com.erebrus.vpn",
  appleHref: "https://testflight.apple.com/join/URzZf6JH",
};

const features = [
  {
    glyph: "◎",
    title: "Community-run network",
    desc: "Traffic routes through independent nodes worldwide — no single honeypot of user data to breach or sell.",
  },
  {
    glyph: "◇",
    title: "WireGuard",
    desc: "Fast, modern tunnels provisioned per device with sing-box profiles.",
  },
  {
    glyph: "⬡",
    title: "Tier-gated pools",
    desc: "Premium node pools unlock as you earn XP and climb ranks.",
  },
  {
    glyph: "↻",
    title: "Multi-protocol",
    desc: "WireGuard, VLESS REALITY, and Hysteria2 — auto or stealth groups.",
  },
  {
    glyph: "✦",
    title: "Earn as operator",
    desc: "Run a node, track peers and uptime, earn XP daily.",
  },
  {
    glyph: "◈",
    title: "Private org nodes",
    desc: "Hide nodes behind your workspace — visible only to members.",
  },
];

export default function VpnMarketingPage() {
  return (
    <>
      <MarketingNav variant="vpn" />

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <Eyebrow className="mb-4">Erebrus VPN</Eyebrow>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            Your internet connection, kept private.
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            Encrypt your traffic on home, work, and public networks. Choose an Erebrus gateway,
            connect to your organization, or deploy a private node you control.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <AuthModalTrigger>
              <AccentButton className="!px-6 !py-4">Download Erebrus VPN →</AccentButton>
            </AuthModalTrigger>
            <Link href="#how">
              <AccentButton variant="ghost" className="!px-6 !py-4">
                See How It Works
              </AccentButton>
            </Link>
          </div>
          <AppDownloadLinks
            productName="Erebrus VPN"
            className="mt-5"
            {...vpnDownloadLinks}
          />
          <p className="mt-5 font-mono text-xs text-[var(--text-3)]">
            WireGuard for fast everyday connections, with supported alternative transports for restricted networks.
          </p>
        </div>

        <Card
          className="flex aspect-square flex-col items-center justify-center gap-5 p-8"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(255,107,53,0.1), transparent 70%), linear-gradient(180deg, #121216, #0B0B0E)",
          }}
        >
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full border border-[var(--accent)]/50 opacity-30" />
            <Image
              src="/brand/erebrus-vpn.png"
              alt=""
              width={96}
              height={96}
              className="relative h-24 w-24 rounded-[26px] object-contain shadow-[0_0_50px_rgba(255,107,53,0.5)]"
            />
          </div>
          <div className="text-center">
            <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--success)]">
              ● PROTECTED
            </div>
            <div className="mt-1.5 text-xl font-semibold">Global network</div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 md:px-8">
        <LiveNetworkStats />
      </section>

      <section
        id="features"
        className="mx-auto max-w-[1180px] px-4 py-20 md:px-8"
      >
        <div className="mb-12 text-center">
          <Eyebrow className="mb-4">Why Erebrus VPN</Eyebrow>
          <h2 className="text-3xl font-bold md:text-[44px]">
            Secure access before network architecture.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 font-mono text-lg text-[var(--accent)]">
                {f.glyph}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Travelling or working remotely?", "/digital-nomads", "Explore for Digital Nomads"],
            ["Protecting family devices?", "/families", "Explore for Families"],
            ["Securing a team?", "/business", "Explore for Business"],
          ].map(([title, href, label]) => (
            <Link key={href} href={href}><Card className="h-full p-6 transition-colors hover:border-[var(--accent)]/30"><h2 className="font-semibold">{title}</h2><p className="mt-3 text-sm text-[var(--accent-hi)]">{label} →</p></Card></Link>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1180px] px-4 pb-20 md:px-8">
        <Card className="flex flex-col items-center p-10 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Get VPN on your device</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Install Erebrus VPN from Google Play or join the iOS beta on TestFlight.
            </p>
          </div>
          <AppDownloadLinks
            productName="Erebrus VPN"
            className="mt-6 justify-center md:mt-0 md:justify-end"
            {...vpnDownloadLinks}
          />
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}
