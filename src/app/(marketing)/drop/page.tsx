import Image from "next/image";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton, Eyebrow, Card } from "@/components/v3/ui";

const features = [
  { glyph: "◎", title: "Local-first", desc: "Files move over your Wi-Fi or hotspot. No upload queues, no cloud storage." },
  { glyph: "◇", title: "QR join", desc: "Scan a code or enter a room ID to join a Drop room instantly." },
  { glyph: "⬡", title: "Temporary server", desc: "Your phone becomes a secure file server for the session — then it's gone." },
  { glyph: "↔", title: "Cross-device", desc: "Phone to laptop, tablet to desktop — any device on the same network." },
  { glyph: "✦", title: "No account", desc: "No sign-up required for local transfers. Privacy by design." },
  { glyph: "◈", title: "Encrypted transit", desc: "Transfers are secured on the local link — nothing leaves your network." },
];

export default function DropMarketingPage() {
  return (
    <>
      <MarketingNav variant="drop" />

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        <div>
          <Eyebrow className="mb-4">Erebrus Drop</Eyebrow>
          <h1 className="text-4xl font-bold leading-none tracking-tight md:text-[64px]">
            Share files{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(120deg, #FF7E44, #E0531F)" }}
            >
              without the cloud.
            </span>
          </h1>
          <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-[var(--text-2)]">
            Turn any phone into a temporary, secure file server on your local Wi-Fi or hotspot.
            Share files, photos and text between nearby devices — nothing touches the cloud.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <AccentButton className="!px-6 !py-4" disabled>
              App Store (soon)
            </AccentButton>
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
              DROP ROOM
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-6 py-4">
              <div className="font-mono text-2xl font-semibold tracking-[0.3em] text-[var(--accent-hi)]">
                A7K-29F
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
          <h2 className="text-3xl font-bold md:text-[44px]">Your files, your network</h2>
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
            <h2 className="text-2xl font-bold">Get Drop on your device</h2>
            <p className="mt-3 text-[var(--text-2)]">
              Available on iOS, Android, and desktop. Download links coming soon.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <AccentButton variant="ghost">iOS</AccentButton>
            <AccentButton variant="ghost">Android</AccentButton>
            <AccentButton variant="ghost">Desktop</AccentButton>
          </div>
        </Card>
      </section>

      <MarketingFooter />
    </>
  );
}