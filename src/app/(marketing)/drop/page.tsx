import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";

// Erebrus Drop — zero-cloud file sharing with Drop Rooms + optional IPFS storage.
const features = [
  { glyph: "◎", title: "Decentralized storage & sharing", desc: "Files are stored on community-run Erebrus nodes. Share a file/folder with a link for anyone to quickly access." },
  { glyph: "◇", title: "Client-side encryption", desc: "Private files are encrypted on your device before upload. Others can't read them." },
  { glyph: "⬡", title: "Drop Rooms", desc: "Create a local room on one device and share files, photos, or text with another device over Wi-Fi or hotspot—no cloud upload." },
  { glyph: "↔", title: "QR room join", desc: "Scan the room code from a nearby device to connect quickly." },
  { glyph: "✦", title: "Wi-Fi or hotspot", desc: "Transfer over the local network you already control." },
  { glyph: "◈", title: "Browser Drop link", desc: "Use a lightweight web link for simple browser-based transfers without installing the app." },
];

export default function DropMarketingPage() {
  return (
    <>
      <MarketingNav variant="drop" />

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <Eyebrow className="mb-4">Erebrus Drop</Eyebrow>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            Zero-cloud{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)" }}
            >
              file sharing.
            </span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            Send files directly between devices over your local network with Drop Rooms, or store and share on community-run IPFS nodes when you need a permanent link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/storage" className="contents">
              <AccentButton className="!px-6 !py-4">Open Drop</AccentButton>
            </Link>
            <Link href="/vpn">
              <AccentButton variant="ghost" className="!px-6 !py-4">Explore VPN</AccentButton>
            </Link>
          </div>
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
                src="/drop/logo.png"
                alt=""
                width={96}
                height={96}
                className="relative h-24 w-24 rounded-[26px] object-contain shadow-[0_0_50px_rgba(255,107,53,0.5)]"
              />
            </div>
            <div className="mt-6 font-mono text-[11px] tracking-[0.2em] text-[var(--text-3)]">
              DROP ROOM
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-6 py-4">
              <div className="truncate font-mono text-sm font-semibold tracking-[0.15em] text-[var(--accent-hi)]">
                ROOM_ID_7xK2
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
          <h2 className="text-3xl font-bold md:text-[44px]">Share files your way</h2>
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
            <h2 className="text-2xl font-bold">How a Drop Room works</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Create a Drop Room on the sending or receiving device, scan the QR code or open the local browser link, and transfer files directly across your Wi-Fi or hotspot.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <Link href="/storage">
              <AccentButton>Open Drop</AccentButton>
            </Link>
          </div>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}