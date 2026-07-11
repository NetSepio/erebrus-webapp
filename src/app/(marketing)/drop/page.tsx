import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";

// Erebrus Drop is decentralized IPFS storage on community nodes — not a
// local-network transfer tool.
const features = [
  { glyph: "◎", title: "Decentralized storage", desc: "Files are stored on IPFS across community-run Erebrus nodes — not a corporate cloud." },
  { glyph: "◇", title: "Content-addressed", desc: "Every file gets a CID. Fetch it from any node that has it pinned." },
  { glyph: "⬡", title: "Your nodes", desc: "Store on the public network or on private nodes your organization operates." },
  { glyph: "↔", title: "Cross-device", desc: "Upload from one device, download on another — your storage follows your account." },
  { glyph: "✦", title: "Client-side encryption", desc: "Private files are encrypted in your browser before upload. Operators can't read them." },
  { glyph: "◈", title: "Public sharing", desc: "Share a file with an opaque link, or copy its CID for anyone with IPFS access." },
];

export default function DropMarketingPage() {
  return (
    <>
      <MarketingNav variant="drop" />

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <Eyebrow className="mb-4">Erebrus Drop</Eyebrow>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            Storage you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)" }}
            >
              actually own.
            </span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            Decentralized file storage on IPFS, powered by community-run Erebrus nodes.
            Encrypt private files in your browser, or share public files by link or CID.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/drop" className="contents">
              <AccentButton className="!px-6 !py-4">Open Drop</AccentButton>
            </Link>
            <Link href="/vpn">
              <AccentButton variant="ghost" className="!px-6 !py-4">Explore VPN</AccentButton>
            </Link>
          </div>
        </div>

        <Card
          className="p-8"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,126,68,0.12), transparent 60%), linear-gradient(180deg, #131318, #0B0B0E)",
          }}
        >
          <div className="text-center">
            <Image
              src="/drop/logo.png"
              alt=""
              width={72}
              height={72}
              className="mx-auto h-[72px] w-[72px] object-contain"
            />
            <div className="mt-6 font-mono text-[11px] tracking-[0.2em] text-[var(--text-3)]">
              CONTENT ID
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-6 py-4">
              <div className="truncate font-mono text-sm font-semibold tracking-[0.15em] text-[var(--accent-hi)]">
                bafybeigdyr…q4hey
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full w-[68%] rounded-full"
                style={{ background: "linear-gradient(90deg, #FF7E44, #E0531F)" }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--text-2)]">photo_batch.zip · 68%</p>
          </div>
        </Card>
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <div className="mb-12 text-center">
          <Eyebrow className="mb-4">Why Drop</Eyebrow>
          <h2 className="text-3xl font-bold md:text-[44px]">Your files, your nodes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 font-mono text-lg text-[var(--accent)]">
                {f.glyph}
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1180px] px-4 pb-20 md:px-8">
        <Card className="flex flex-col items-center p-10 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Start storing on Drop</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Sign in with your wallet and upload from the Drop dashboard. Public storage is free;
              paid workspace plans unlock more.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <Link href="/drop">
              <AccentButton>Open Drop</AccentButton>
            </Link>
          </div>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}