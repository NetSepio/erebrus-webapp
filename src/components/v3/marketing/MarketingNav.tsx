"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { AccentButton, iconButtonClass } from "@/components/v3/ui";
import { cn } from "@/lib/utils";
import { AuthModalTrigger } from "@/components/v3/AuthModal";

type NavVariant = "platform" | "vpn" | "drop" | "ai";

const groups = [
  {
    label: "Products",
    links: [
      { label: "VPN", href: "/vpn", description: "Private, resilient connectivity" },
      { label: "Firewall", href: "/firewall", description: "DNS and network protection" },
      { label: "Private AI", href: "/ai", description: "Models on trusted hardware" },
      { label: "Drop", href: "/drop", description: "Private file transfer", secondary: true },
    ],
  },
  {
    label: "Solutions",
    links: [
      { label: "Digital Nomads", href: "/digital-nomads", description: "Secure work from anywhere" },
      { label: "Families", href: "/families", description: "Safer connections across devices" },
      { label: "Businesses", href: "/business", description: "A private company workspace" },
    ],
  },
  {
    label: "Network",
    links: [
      { label: "Explorer", href: "/dashboard", description: "Explore Erebrus nodes" },
      { label: "Run a Node", href: "/#operators", description: "Help power the network" },
      { label: "Documentation", href: "https://docs.netsepio.com/erebrus/", description: "Technical guides", external: true },
    ],
  },
] as const;

export function MarketingNav({}: { variant?: NavVariant }) {
  const [open, setOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>("Products");

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5" aria-label="Erebrus home">
          <Image src="/brand/erebrus-logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-[10px] shadow-[0_4px_16px_rgba(255,107,53,0.35)]" priority />
          <span className="text-xl font-bold tracking-tight md:text-[22px]">Erebrus</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {groups.map((group) => (
            <div key={group.label} className="group relative">
              <button type="button" className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--text)]/80 transition-colors hover:bg-white/[0.04] hover:text-[var(--text)]" aria-haspopup="true">
                {group.label}<ChevronDown size={14} aria-hidden />
              </button>
              <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="rounded-2xl border border-white/[0.09] bg-[#101014] p-2 shadow-2xl">
                  {group.links.map((link) => {
                    const content = <><span className="font-semibold text-[var(--text)]">{link.label}</span><span className="block text-xs text-[var(--text-3)]">{link.description}</span></>;
                    const classes = cn("block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none", "secondary" in link && link.secondary && "mt-1 border-t border-white/[0.07]");
                    return "external" in link && link.external ? <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a> : <Link key={link.href} href={link.href} className={classes}>{content}</Link>;
                  })}
                </div>
              </div>
            </div>
          ))}
          <Link href="/pricing" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--text)]/80 hover:text-[var(--text)]">Pricing</Link>
          <Link href="/contact" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--text)]/80 hover:text-[var(--text)]">Contact</Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <AuthModalTrigger><AccentButton variant="ghost" className="!px-4 !py-2.5">Sign in</AccentButton></AuthModalTrigger>
          <AuthModalTrigger><AccentButton className="!px-4 !py-2.5">Get Erebrus</AccentButton></AuthModalTrigger>
        </div>

        <button type="button" className={cn(iconButtonClass, "min-h-11 min-w-11 lg:hidden")} onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-white/[0.06] px-4 py-4 lg:hidden">
          <nav className="mx-auto flex max-w-[1180px] flex-col" aria-label="Mobile navigation">
            {groups.map((group) => {
              const expanded = mobileGroup === group.label;
              return <div key={group.label} className="border-b border-white/[0.06] py-1">
                <button type="button" className="flex min-h-11 w-full items-center justify-between text-sm font-semibold" onClick={() => setMobileGroup(expanded ? null : group.label)} aria-expanded={expanded}>
                  {group.label}<ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && <div className="pb-2 pl-3">{group.links.map((link) => {
                  const classes = "block min-h-11 py-2 text-sm text-[var(--text-2)]";
                  return "external" in link && link.external ? <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={classes}>{link.label}</a> : <Link key={link.href} href={link.href} className={classes} onClick={() => setOpen(false)}>{link.label}</Link>;
                })}</div>}
              </div>;
            })}
            <Link href="/pricing" className="flex min-h-11 items-center border-b border-white/[0.06] text-sm font-semibold" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/contact" className="flex min-h-11 items-center text-sm font-semibold" onClick={() => setOpen(false)}>Contact</Link>
            <div className="sticky bottom-0 mt-3 bg-[var(--bg)] py-2"><AuthModalTrigger><AccentButton className="w-full !py-3.5">Get Erebrus</AccentButton></AuthModalTrigger></div>
          </nav>
        </div>
      )}
    </header>
  );
}
