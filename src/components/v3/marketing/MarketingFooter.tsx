import Link from "next/link";
import type { ReactNode } from "react";
import { Facebook, Github, Mail } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-[var(--text-3)] transition-colors hover:text-[var(--text)]"
    >
      {children}
    </a>
  );
}

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-5 sm:grid-cols-3">
        {/* Left: social icons */}
        <div className="flex items-center justify-center gap-4 sm:justify-start">
          <Social href="https://x.com/NetSepio" label="NetSepio on X">
            <XIcon className="h-[17px] w-[17px]" />
          </Social>
          <Social href="https://facebook.com/netsepio" label="NetSepio on Facebook">
            <Facebook className="h-[18px] w-[18px]" />
          </Social>
          <Social href="https://github.com/NetSepio" label="NetSepio on GitHub">
            <Github className="h-[18px] w-[18px]" />
          </Social>
          <Social href="mailto:support@netsepio.com" label="Email support@netsepio.com">
            <Mail className="h-[18px] w-[18px]" />
          </Social>
        </div>

        {/* Center: copyright */}
        <div className="text-center text-[13px] text-[var(--text-3)]">
          Erebrus © {year} NetSepio LLC. All rights reserved.
        </div>

        {/* Right: legal links */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
          {legalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] text-[var(--text-3)] transition-colors hover:text-[var(--text-2)]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
