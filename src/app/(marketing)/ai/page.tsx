import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";
import { AuthModalTrigger } from "@/components/v3/AuthModal";

// Erebrus AI is a cross-platform local LLM runner. Features are drawn from the
// mobile / desktop app in ~/Projects/NetSepio/erebrus-ai.
const features = [
  {
    glyph: "◎",
    title: "Local-first inference",
    desc: "Download quantized GGUF models and run them on your own hardware — your prompts never leave the device.",
  },
  {
    glyph: "◇",
    title: "Model hub",
    desc: "Browse a curated catalog from edge-friendly 0.5B models up to desktop-class 32B parameter models.",
  },
  {
    glyph: "⬡",
    title: "Custom personas",
    desc: "Build system prompts, tune temperature, top-P, max tokens, and stop sequences for repeatable outputs.",
  },
  {
    glyph: "↔",
    title: "LAN node discovery",
    desc: "Your desktop broadcasts _erebrus-ai._tcp over mDNS so phones and other computers find it instantly.",
  },
  {
    glyph: "✦",
    title: "Network model sharing",
    desc: "Use models served by nearby devices, or access private models shared by your workspace.",
  },
  {
    glyph: "◈",
    title: "Wallet sign-in",
    desc: "One Erebrus account across VPN, Drop, and AI — authenticate with your existing wallet.",
  },
];

export default function AiMarketingPage() {
  return (
    <>
      <MarketingNav variant="ai" />

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <Eyebrow className="mb-4">Erebrus AI</Eyebrow>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            Intelligence{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)",
              }}
            >
              on your terms.
            </span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            Run AI models locally and chat with them from any device on your
            network. Download quantized models, create custom personas, and turn
            your desktop into a private AI node.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <AuthModalTrigger>
              <AccentButton className="!px-6 !py-4">Launch app →</AccentButton>
            </AuthModalTrigger>
            <Link href="/vpn">
              <AccentButton variant="ghost" className="!px-6 !py-4">
                Explore VPN
              </AccentButton>
            </Link>
          </div>
          <p className="mt-5 font-mono text-xs text-[var(--text-3)]">
            Private by default · nothing leaves your device
          </p>
        </div>

        <Card
          className="flex aspect-square flex-col items-center justify-center gap-5 p-8"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,126,68,0.12), transparent 60%), linear-gradient(180deg, #131318, #0B0B0E)",
          }}
        >
          <div className="text-center">
            <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border border-[var(--accent)]/50 opacity-30" />
              <Image
                src="/ai/logo.png"
                alt=""
                width={96}
                height={96}
                className="relative h-24 w-24 rounded-[26px] object-contain shadow-[0_0_50px_rgba(255,107,53,0.5)]"
              />
            </div>
            <div className="mt-6 font-mono text-[11px] tracking-[0.2em] text-[var(--text-3)]">
              LOCAL NODE
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-6 py-4">
              <div className="truncate font-mono text-sm font-semibold tracking-[0.15em] text-[var(--accent-hi)]">
                _EREBRUS-AI._TCP
              </div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--success)]/25 bg-[var(--success)]/10 px-3 py-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: "var(--success)",
                  boxShadow: "0 0 8px var(--success)",
                }}
              />
              <span className="font-mono text-[11px] text-[var(--success)]">
                READY
              </span>
            </div>
          </div>
        </Card>
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-4 py-20 md:px-8">
        <div className="mb-12 text-center">
          <Eyebrow className="mb-4">Why Erebrus AI</Eyebrow>
          <h2 className="text-3xl font-bold md:text-[44px]">
            Your models. Your hardware. Your network.
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
            <h2 className="text-2xl font-bold">Get Erebrus AI on your device</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Available on macOS, Windows, Linux, Android, and iOS. Download a
              model, pick a persona, and start chatting.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <AccentButton variant="ghost">Desktop</AccentButton>
            <AccentButton variant="ghost">Android</AccentButton>
            <AccentButton variant="ghost">iOS</AccentButton>
          </div>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}
