"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/v3/AuroraBackground";
import { NotificationBell } from "@/components/v3/app/NotificationBell";
import { WalletMenu } from "@/components/v3/app/WalletMenu";
import { AccentButton, iconButtonClass } from "@/components/v3/ui";
import { AuthModalProvider } from "@/components/v3/AuthModal";
import { useEntitlement } from "@/hooks/use-entitlement";
import { tierLabel } from "@/lib/entitlements";
import type { EffectiveEntitlement } from "@/lib/entitlements";

const NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "◈" },
  { href: "/connect", label: "VPN", glyph: "◎" },
  { href: "/storage", label: "Drop", glyph: "⇲" },
  { href: "/workspace", label: "Workspace", glyph: "⬡" },
] as const;

const SCREEN_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your network overview" },
  "/connect": { title: "VPN", subtitle: "Connect to the sovereign network" },
  "/workspace": { title: "Workspace", subtitle: "Orgs and nodes you operate" },
  "/profile": { title: "Profile", subtitle: "Account settings" },
  "/profile/activity": { title: "Activity", subtitle: "Your account activity log" },
  "/rewards": { title: "Rewards & XP", subtitle: "Earn, claim, and climb tiers" },
  "/storage": { title: "Drop", subtitle: "Decentralized IPFS storage" },
  "/subscribe": { title: "Plan", subtitle: "Your organization entitlements" },
  "/admin": { title: "Admin Console", subtitle: "Platform administration" },
};

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--accent)]/15 text-[var(--accent-hi)]"
                : "text-[var(--text-2)] hover:bg-white/[0.04] hover:text-[var(--text)]"
            )}
          >
            <span className="w-[18px] text-center font-mono text-sm">{item.glyph}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PlanCard({ entitlement }: { entitlement: EffectiveEntitlement }) {
  const isFree = entitlement.tier === "free";
  return (
    <div className="mt-auto rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-[var(--text-3)]">
          Plan
        </span>
        <span className="font-mono text-[11px] text-[var(--accent-hi)]">
          {tierLabel(entitlement.tier)}
        </span>
      </div>
      {entitlement.org?.name && (
        <p className="mb-3 truncate text-[11px] text-[var(--text-3)]">
          via {entitlement.org.name}
        </p>
      )}
      <Link href={isFree ? "/subscribe" : "/workspace"}>
        <AccentButton className="w-full !py-2 !text-[13px]">
          {isFree ? "Upgrade plan" : "Manage plan"}
        </AccentButton>
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { entitlement } = useEntitlement();

  const orgDetail = pathname.match(/^\/workspace\/([^/]+)$/);
  const meta = orgDetail
    ? { title: "Workspace", subtitle: "Org detail and operator tools" }
    : SCREEN_META[pathname] ?? { title: "Erebrus", subtitle: "" };

  return (
    <AuthModalProvider>
      <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <AuroraBackground />
        <div className="relative z-[2] flex min-h-screen">
          {/* Desktop sidebar */}
          <aside className="hidden w-[244px] shrink-0 flex-col border-r border-white/[0.06] bg-[var(--elevated)]/70 p-4 backdrop-blur-xl lg:flex sticky top-0 h-screen">
            <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-2.5 py-1.5">
              <Image
                src="/brand/erebrus-mark.png"
                alt="Erebrus"
                width={30}
                height={30}
                className="rounded-[9px] shadow-[0_4px_16px_rgba(255,107,53,0.35)]"
              />
              <span className="text-lg font-bold tracking-tight">Erebrus</span>
            </Link>
            <SidebarNav />
            <PlanCard entitlement={entitlement} />
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col border-r border-white/[0.06] bg-[var(--elevated)] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold">Erebrus</span>
                  <button
                    type="button"
                    className={iconButtonClass}
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <PlanCard entitlement={entitlement} />
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[var(--bg)]/70 px-4 py-4 backdrop-blur-xl md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={cn(iconButtonClass, "lg:hidden")}
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight md:text-xl">{meta.title}</h1>
                  {meta.subtitle && (
                    <p className="text-[13px] text-[var(--text-3)]">{meta.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <WalletMenu entitlement={entitlement} />
              </div>
            </header>
            <main className="flex-1 px-4 py-6 pb-16 md:px-8">{children}</main>
          </div>
        </div>
      </div>
    </AuthModalProvider>
  );
}