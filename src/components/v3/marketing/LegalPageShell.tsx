import type { ReactNode } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { AccentButton } from "@/components/v3/ui";

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <>
      <MarketingNav variant="platform" />
      <main className="flex-1 px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div
            className="mb-10 rounded-2xl border p-6 md:p-8"
            style={{
              borderColor: "rgba(255,107,53,0.22)",
              background:
                "radial-gradient(ellipse 80% 120% at 100% 0%, rgba(255,107,53,0.1), transparent 55%), linear-gradient(180deg, #131318, #0D0D11)",
            }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--accent-hi)]">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-4 max-w-3xl leading-relaxed text-[var(--text-2)]">{summary}</p>
            <p className="mt-4 font-mono text-xs text-[var(--text-3)]">
              Effective date: {lastUpdated}
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <Link href="/privacy">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                Privacy
              </AccentButton>
            </Link>
            <Link href="/terms">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                Terms
              </AccentButton>
            </Link>
            <Link href="/vpn">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                VPN
              </AccentButton>
            </Link>
            <Link href="/drop">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                Drop
              </AccentButton>
            </Link>
            <Link href="/ai">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                AI
              </AccentButton>
            </Link>
            <Link href="/contact">
              <AccentButton variant="outline" className="!px-4 !py-2 !text-sm">
                Contact
              </AccentButton>
            </Link>
          </div>

          {children}
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}

export function LegalSection({
  title,
  body,
  items,
  subsections,
}: {
  title: string;
  body?: string[];
  items?: string[];
  subsections?: Array<{
    title: string;
    body?: string[];
    items?: string[];
  }>;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      <h2 className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      {body?.map((paragraph) => (
        <p key={paragraph} className="mb-4 leading-7 text-[var(--text-2)] last:mb-0">
          {paragraph}
        </p>
      ))}
      {items && (
        <ul className="space-y-2 pl-5 text-[var(--text-2)]">
          {items.map((item) => (
            <li key={item} className="list-disc leading-7">
              {item}
            </li>
          ))}
        </ul>
      )}
      {subsections?.map((subsection) => (
        <div
          key={subsection.title}
          className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="mb-3 text-lg font-semibold text-[var(--accent-hi)]">
            {subsection.title}
          </h3>
          {subsection.body?.map((paragraph) => (
            <p key={paragraph} className="mb-4 leading-7 text-[var(--text-2)] last:mb-0">
              {paragraph}
            </p>
          ))}
          {subsection.items && (
            <ul className="space-y-2 pl-5 text-[var(--text-2)]">
              {subsection.items.map((item) => (
                <li key={item} className="list-disc leading-7">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}