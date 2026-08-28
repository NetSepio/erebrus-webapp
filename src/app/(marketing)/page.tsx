import Link from "next/link";
import {
  BrainCircuit,
  Building2,
  CheckCircle2,
  FileUp,
  Home,
  LockKeyhole,
  Plane,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { Card, Eyebrow } from "@/components/v3/ui";
import { LiveNetworkStats } from "@/components/v3/marketing/LiveNetworkStats";
import { LandingNetworkPreview } from "@/components/v3/marketing/LandingNetworkPreview";
import { pageMetadata } from "@/lib/seo";
import {
  FinalCta,
  MarketingButtonLink,
} from "@/components/v3/marketing/MarketingSections";

export const metadata = pageMetadata({
  title: "Erebrus - Private Internet, Firewall, Drop and AI",
  description:
    "Erebrus helps you browse privately, block risky sites, move files between nearby devices, and run AI on hardware you trust.",
  path: "/",
});

const quickWins = [
  {
    icon: Wifi,
    title: "Use public Wi-Fi with less worry",
    body: "Turn on a protected connection before you open work tools, banking, email, or private tabs in airports, hotels, cafes, and coworking spaces.",
  },
  {
    icon: ShieldCheck,
    title: "Block the places you do not want devices going",
    body: "Add rules that help stop malicious sites, phishing links, trackers, and unwanted categories before they reach a device.",
  },
  {
    icon: FileUp,
    title: "Move files across the room",
    body: "Create a Drop Room, scan a QR code, and send photos, files, or pasted text directly over Wi-Fi or hotspot.",
  },
  {
    icon: BrainCircuit,
    title: "Use AI without sending every thought away",
    body: "Run supported models on your computer, server, or trusted workspace so sensitive work can stay closer to you.",
  },
];

const productCards = [
  {
    icon: LockKeyhole,
    title: "Browse privately",
    body: "A protected connection for travel, home, and work. Open the app, choose where to connect, and keep more of your browsing away from prying networks.",
    href: "/vpn",
    cta: "See private browsing",
  },
  {
    icon: ShieldCheck,
    title: "Block risky traffic",
    body: "Firewall and DNS protection for devices, families, and teams that want fewer malicious links, shady domains, and unwanted categories getting through.",
    href: "/firewall",
    cta: "See protection",
  },
  {
    icon: FileUp,
    title: "Send files nearby",
    body: "Drop is for quick local transfer first. Use Wi-Fi or hotspot when devices are near each other, then use storage links only when you need them.",
    href: "/drop",
    cta: "See Drop",
  },
  {
    icon: BrainCircuit,
    title: "Run AI locally",
    body: "Download supported models, create private assistants, and use your own computer or a trusted team machine for sensitive prompts.",
    href: "/ai",
    cta: "See private AI",
  },
];

const audiences = [
  {
    icon: Plane,
    title: "For travel",
    body: "Hotel Wi-Fi, airports, cafes, and coworking spaces are easier to trust when your connection is protected first.",
    href: "/digital-nomads",
  },
  {
    icon: Home,
    title: "For home",
    body: "Help protect family devices, move photos between phones and laptops, and keep private AI work on hardware you trust.",
    href: "/families",
  },
  {
    icon: Building2,
    title: "For teams",
    body: "Give employees a safer way into company tools, add protection rules, and keep confidential AI work inside a trusted setup.",
    href: "/business",
  },
];

const plainSteps = [
  "Choose what you need today: private browsing, safer traffic, nearby file transfer, or private AI.",
  "Use the Erebrus app with your own account. No maze of passwords or enterprise setup just to get started.",
  "Upgrade later when you need team seats, a dedicated setup, stronger protection, or private AI for a workspace.",
];

export default function LandingPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-[1.02fr_.98fr] md:px-8 md:py-24">
          <div>
            <Eyebrow className="mb-5">Privacy tools people can actually use</Eyebrow>
            <h1 className="max-w-[760px] text-5xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-[76px]">
              Your internet should feel like yours.
            </h1>
            <p className="mt-6 max-w-[650px] text-lg leading-relaxed text-[var(--text-2)] md:text-xl">
              Erebrus helps you browse privately, block risky sites, move files between nearby
              devices, and run AI on hardware you trust.
            </p>
            <p className="mt-4 max-w-[600px] text-base leading-relaxed text-[var(--text-3)]">
              No surveillance-speak. No dashboard full of mystery switches. Just practical tools
              for travel, home, and work.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <MarketingButtonLink href="#app" className="!px-6 !py-4 !text-base">
                Get Erebrus
              </MarketingButtonLink>
              <MarketingButtonLink
                href="#products"
                variant="ghost"
                className="!px-6 !py-4 !text-base"
              >
                See what it does
              </MarketingButtonLink>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-sm text-[var(--text-3)]">
              {["Browse privately", "Block risky sites", "Move files nearby", "Run AI locally"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <HeroVisual />
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {quickWins.map((item) => (
              <PlainCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section id="products" className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
          <div className="mb-10 max-w-3xl">
            <Eyebrow className="mb-4">What Erebrus does</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight md:text-[44px]">
              Four useful tools. One private account.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text-2)]">
              Start with the thing you need right now. Add the rest when it becomes useful.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {productCards.map((item) => (
              <ProductCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
          <Card
            className="grid gap-8 p-7 md:grid-cols-[0.9fr_1.1fr] md:p-10"
            style={{
              borderColor: "rgba(255,107,53,0.22)",
              background:
                "radial-gradient(ellipse 70% 120% at 100% 0%, rgba(255,107,53,0.12), transparent 60%), linear-gradient(180deg, #131318, #0D0D11)",
            }}
          >
            <div>
              <Eyebrow className="mb-4">Simple start</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight md:text-[42px]">
                Start with one job. Keep the rest ready.
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--text-2)]">
                Erebrus is not trying to make you study network diagrams. Pick the outcome you
                want, turn it on, and grow into team controls only when you need them.
              </p>
            </div>
            <div className="grid gap-3">
              {plainSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 font-mono text-xs font-semibold text-[var(--accent-hi)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--text-2)]">{step}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
          <div className="mb-10 max-w-3xl">
            <Eyebrow className="mb-4">Who it helps</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight md:text-[44px]">
              Built for normal days, not just security teams.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((item) => (
              <AudienceCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-10 md:px-8">
          <div className="mb-8 max-w-3xl">
            <Eyebrow className="mb-4">The network underneath</Eyebrow>
            <h2 className="text-3xl font-bold md:text-[44px]">
              A live network, without making you think about it.
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--text-2)]">
              Behind the simple app is a network of independent operators and private workspaces.
              You can use what is available today, or run your own node when you want more control.
            </p>
          </div>
          <LiveNetworkStats />
          <LandingNetworkPreview />
          <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/dashboard" className="text-[var(--accent-hi)]">
              Explore the network
            </Link>
            <Link href="/#operators" className="text-[var(--text-2)]">
              Run a node
            </Link>
          </div>
        </section>

        <section id="operators" className="mx-auto max-w-[1180px] px-4 py-12 md:px-8">
          <Card className="p-8 md:p-12">
            <Eyebrow className="mb-4">For operators</Eyebrow>
            <h2 className="text-3xl font-bold">Run a node. Help power the network.</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-[var(--text-2)]">
              Enroll compatible hardware, choose how it is shared, and monitor it from your
              Erebrus workspace.
            </p>
          </Card>
        </section>

        <FinalCta
          title="Start with the privacy tool you need today."
          body="Use Erebrus for yourself, your family, or a team that needs simple protection without giving up control."
          primary={{ label: "Get Erebrus", href: "#app" }}
          secondary={{ label: "Explore plans", href: "/pricing" }}
        />
      </main>
      <MarketingFooter />
    </>
  );
}

function HeroVisual() {
  const rows = [
    { icon: Wifi, label: "Coffee shop Wi-Fi", state: "Protected" },
    { icon: ShieldCheck, label: "Risky domains", state: "Blocked" },
    { icon: FileUp, label: "Photos to laptop", state: "Sent nearby" },
    { icon: BrainCircuit, label: "Private AI draft", state: "Kept local" },
  ];

  return (
    <Card
      className="relative overflow-hidden p-6 md:p-8"
      style={{
        background:
          "radial-gradient(circle at 72% 18%, rgba(255,107,53,0.2), transparent 34%), linear-gradient(145deg,#15151b,#09090c)",
      }}
    >
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
      <div className="relative">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Today in Erebrus</div>
            <div className="mt-1 font-mono text-[11px] text-[var(--success)]">
              READY WHEN YOU NEED IT
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_12px_38px_rgba(255,107,53,0.32)]">
            <Sparkles size={21} />
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => {
            const Icon = row.icon;

            return (
              <div
                key={row.label}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent-hi)]">
                  <Icon size={19} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{row.label}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-3)]">
                    You choose when this runs
                  </div>
                </div>
                <div className="whitespace-nowrap rounded-full bg-[var(--success)]/10 px-2.5 py-1 font-mono text-[10px] text-[var(--success)]">
                  {row.state}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["No ads", "No resale"],
            ["Nearby", "Drop Rooms"],
            ["Local", "AI option"],
          ].map(([top, bottom]) => (
            <div key={top} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
              <div className="font-semibold">{top}</div>
              <div className="mt-1 text-xs text-[var(--text-3)]">{bottom}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function PlainCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent-hi)]">
        <Icon size={21} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{body}</p>
    </Card>
  );
}

function ProductCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="group">
      <Card
        className="flex h-full flex-col p-6 transition-colors hover:border-[var(--accent)]/30"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 15% 0%, rgba(255,107,53,0.08), transparent 55%), linear-gradient(180deg, #131318, #0C0B0E)",
        }}
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent-hi)]">
          <Icon size={23} />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-2)]">{body}</p>
        <span className="mt-5 inline-flex min-h-11 items-center font-semibold text-[var(--accent-hi)]">
          {cta}
        </span>
      </Card>
    </Link>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full p-7 transition-colors hover:border-[var(--accent)]/30">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-[var(--accent-hi)]">
            <Icon size={21} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-2)]">{body}</p>
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--accent-hi)]">
          Learn more <CheckCircle2 size={16} />
        </div>
      </Card>
    </Link>
  );
}
