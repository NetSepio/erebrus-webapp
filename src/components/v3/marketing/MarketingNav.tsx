"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AccentButton, iconButtonClass } from "@/components/v3/ui";
import { cn } from "@/lib/utils";
import { AuthModalTrigger } from "@/components/v3/AuthModal";

type NavVariant = "platform" | "vpn" | "drop" | "ai";

const navLinks: Record<NavVariant, Array<{ label: string; href: string; external?: boolean }>> = {
  platform: [
    { label: "VPN", href: "/vpn" },
    { label: "Drop", href: "/drop" },
    { label: "AI", href: "/ai" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "https://docs.netsepio.com/erebrus/", external: true },
  ],
  vpn: [
    { label: "Features", href: "/vpn#features" },
    { label: "How it works", href: "/vpn#how" },
    { label: "Drop", href: "/drop" },
    { label: "AI", href: "/ai" },
  ],
  drop: [
    { label: "Features", href: "/drop#features" },
    { label: "How it works", href: "/drop#how" },
    { label: "VPN", href: "/vpn" },
    { label: "AI", href: "/ai" },
  ],
  ai: [
    { label: "Features", href: "/ai#features" },
    { label: "How it works", href: "/ai#how" },
    { label: "VPN", href: "/vpn" },
    { label: "Drop", href: "/drop" },
  ],
};

const brand: Record<
  NavVariant,
  { icon: string; title: string; subtitle?: string; back?: string }
> = {
  platform: { icon: "/brand/erebrus-logo.png", title: "Erebrus" },
  vpn: { icon: "/brand/erebrus-vpn.png", title: "Erebrus", subtitle: "VPN", back: "/" },
  drop: { icon: "/drop/logo.png", title: "Erebrus", subtitle: "Drop", back: "/" },
  ai: { icon: "/ai/logo.png", title: "Erebrus", subtitle: "AI", back: "/" },
};

export function MarketingNav({ variant = "platform" }: { variant?: NavVariant }) {
  const [open, setOpen] = useState(false);
  const links = navLinks[variant];
  const b = brand[variant];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[var(--bg)]/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          {b.back && (
            <Link href={b.back} className="text-[var(--text-2)] hover:text-[var(--text)] text-sm">
              ←
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={b.icon}
              alt=""
              width={40}
              height={40}
              className={
                variant === "drop" || variant === "ai"
                  ? "h-10 w-10 shrink-0 object-contain"
                  : "h-10 w-10 shrink-0 rounded-[10px] shadow-[0_4px_16px_rgba(255,107,53,0.35)]"
              }
              priority
            />
            <span className="text-xl font-bold tracking-tight md:text-[22px]">
              {b.title}
              {b.subtitle && (
                <span className="ml-1.5 font-medium text-[var(--text-2)]">{b.subtitle}</span>
              )}
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--text)]/80 hover:text-[var(--text)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text)]/80 hover:text-[var(--text)]"
              >
                {link.label}
              </Link>
            )
          )}
          <AuthModalTrigger>
            <AccentButton className="!px-4 !py-2.5 !text-sm">Launch app</AccentButton>
          </AuthModalTrigger>
        </nav>

        <button
          type="button"
          className={cn(iconButtonClass, "md:hidden")}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-sm font-medium text-[var(--text-2)]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 text-sm font-medium text-[var(--text-2)]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <AuthModalTrigger>
              <AccentButton className="w-full">Launch app</AccentButton>
            </AuthModalTrigger>
          </nav>
        </div>
      )}
    </header>
  );
}