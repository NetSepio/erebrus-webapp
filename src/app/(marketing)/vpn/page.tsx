import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";
import { LiveNetworkStats } from "@/components/v3/marketing/LiveNetworkStats";
import { LiveNetworkBadge } from "@/components/v3/marketing/LiveNetworkBadge";

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
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
            <span className="font-mono text-[11px] text-[var(--success)]">
              ● LIVE
            </span>
            <LiveNetworkBadge />
          </div>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            The internet,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)",
              }}
            >
              off the record.
            </span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            A no-logs VPN powered by a worldwide community of operators. Modern
            WireGuard tunnels and wallet sign-in keep your browsing private — so
            your data stays yours instead of becoming the product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <AuthModalTrigger>
              <AccentButton className="!px-6 !py-4">Launch app →</AccentButton>
            </AuthModalTrigger>
            <Link href="/#operators">
              <AccentButton variant="ghost" className="!px-6 !py-4">
                Run a node
              </AccentButton>
            </Link>
          </div>
          <p className="mt-5 font-mono text-xs text-[var(--text-3)]">
            Start free · no card required
          </p>
        </div>

        <Card
          className="flex aspect-square flex-col items-center justify-center gap-5 p-8"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(255,107,53,0.1), transparent 70%), linear-gradient(180deg, #121216, #0B0B0E)",
          }}
        >
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 animate-ping rounded-full border border-[var(--accent)]/50 opacity-30" />
            <Image
              src="/brand/erebrus-vpn.png"
              alt=""
              width={96}
              height={96}
              className="absolute inset-11 rounded-[26px] shadow-[0_0_50px_rgba(255,107,53,0.5)]"
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
            Private by design. Powered by a global community.
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

      <section id="how" className="mx-auto max-w-[1180px] px-4 pb-20 md:px-8">
        <Card className="flex flex-col items-center p-10 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Get VPN on your device</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Available on Android. iOS and desktop coming soon.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <AccentButton variant="ghost" disabled>
              iOS (soon)
            </AccentButton>
            <AccentButton variant="ghost">Android</AccentButton>
            <AccentButton variant="ghost" disabled>
              Desktop (soon)
            </AccentButton>
          </div>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}
