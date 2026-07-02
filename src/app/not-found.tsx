import Link from "next/link";
import { AuroraBackground } from "@/components/v3/AuroraBackground";
import { AuthModalProvider } from "@/components/v3/AuthModal";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { AccentButton, Card, Eyebrow } from "@/components/v3/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Page not found",
  description: "The page you requested is not on Erebrus. Head home or explore VPN, Drop, and the network.",
  path: "/404",
  noIndex: true,
});

const shortcuts = [
  { href: "/", label: "Home" },
  { href: "/connect", label: "Connect" },
  { href: "/vpn", label: "VPN" },
  { href: "/drop", label: "Drop" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <AuthModalProvider>
      <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <AuroraBackground />
        <div className="relative z-[2] flex min-h-screen flex-col">
          <MarketingNav variant="platform" />

          <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 md:px-8">
            <Card
              className="w-full max-w-xl p-8 text-center md:p-10"
              style={{
                background:
                  "radial-gradient(ellipse 80% 120% at 100% 0%, rgba(255,107,53,0.1), transparent 55%), linear-gradient(180deg, #131318, #0D0D11)",
                borderColor: "rgba(255,107,53,0.22)",
              }}
            >
              <Eyebrow>Off the grid</Eyebrow>
              <p
                className="mt-4 font-mono text-7xl font-bold tracking-tighter md:text-8xl"
                style={{
                  background: "linear-gradient(150deg, #FF7E44, #E0531F)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                404
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                Page not found
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-2)]">
                This URL isn&apos;t wired into Erebrus yet — or it moved. Pick a destination below
                and we&apos;ll get you back on the sovereign internet.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Link href="/">
                  <AccentButton>Back to home</AccentButton>
                </Link>
                <Link href="/connect">
                  <AccentButton variant="ghost">Open network</AccentButton>
                </Link>
              </div>
            </Card>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {shortcuts.map((link) => (
                <Link key={link.href} href={link.href}>
                  <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                    {link.label}
                  </AccentButton>
                </Link>
              ))}
            </div>
          </main>

          <MarketingFooter />
        </div>
      </div>
    </AuthModalProvider>
  );
}