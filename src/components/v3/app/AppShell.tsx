"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/v3/AuroraBackground";
import { WalletMenu } from "@/components/v3/app/WalletMenu";
import { AccentButton } from "@/components/v3/ui";
import { useWalletAuth } from "@/context/appkit";
import { AuthModalProvider } from "@/components/v3/AuthModal";
import { fetchSubscription } from "@/lib/gateway/client";
import { daysRemaining, planProgress } from "@/lib/design";
import type { GatewaySubscription } from "@/lib/gateway/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", glyph: "◈" },
  { href: "/connect", label: "VPN", glyph: "◎" },
  { href: "/workspace", label: "Workspace", glyph: "⬡" },
] as const;

const SCREEN_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your network overview" },
  "/connect": { title: "VPN", subtitle: "Connect to the sovereign network" },
  "/workspace": { title: "Workspace", subtitle: "Orgs and nodes you operate" },
  "/profile": { title: "Profile", subtitle: "Account and activity" },
  "/rewards": { title: "Rewards & XP", subtitle: "Earn, claim, and climb tiers" },
  "/subscribe": { title: "Subscribe", subtitle: "Access pass and entitlements" },
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

function TrialCard({ sub }: { sub: GatewaySubscription | null }) {
  const days = daysRemaining(sub?.expires_at);
  const pct = planProgress(sub?.expires_at, sub?.source === "nft" ? 30 : 7);

  return (
    <div className="mt-auto rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-[var(--text-3)]">
          {sub?.entitled ? sub.source ?? "Plan" : "No plan"}
        </span>
        {days !== null && (
          <span className="font-mono text-[11px] text-[var(--accent-hi)]">{days}d left</span>
        )}
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${sub?.entitled ? 100 - pct : 0}%`,
            background: "linear-gradient(90deg, #FF7E44, #E0531F)",
          }}
        />
      </div>
      <Link href="/subscribe">
        <AccentButton className="w-full !py-2 !text-[13px]">Get access pass</AccentButton>
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useWalletAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sub, setSub] = useState<GatewaySubscription | null>(null);

  const orgDetail = pathname.match(/^\/workspace\/([^/]+)$/);
  const meta = orgDetail
    ? { title: "Workspace", subtitle: "Org detail and operator tools" }
    : SCREEN_META[pathname] ?? { title: "Erebrus", subtitle: "" };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSubscription()
      .then(setSub)
      .catch(() => setSub(null));
  }, [isAuthenticated, pathname]);

  return (
    <AuthModalProvider>
      <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <AuroraBackground />
        <div className="relative z-[2] flex min-h-screen">
          {/* Desktop sidebar */}
          <aside className="hidden w-[244px] shrink-0 flex-col border-r border-white/[0.06] bg-[var(--elevated)]/70 p-4 backdrop-blur-xl lg:flex sticky top-0 h-screen">
            <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-2.5 py-1.5">
              <Image
                src="/brand/erebrus-icon.png"
                alt="Erebrus"
                width={30}
                height={30}
                className="rounded-[9px] shadow-[0_4px_16px_rgba(255,107,53,0.35)]"
              />
              <span className="text-lg font-bold tracking-tight">Erebrus</span>
            </Link>
            <SidebarNav />
            <TrialCard sub={sub} />
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
                  <button type="button" onClick={() => setMobileOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <TrialCard sub={sub} />
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[var(--bg)]/70 px-4 py-4 backdrop-blur-xl md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--text-2)] lg:hidden"
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
              <WalletMenu subscription={sub} />
            </header>
            <main className="flex-1 px-4 py-6 pb-16 md:px-8">{children}</main>
          </div>
        </div>
      </div>
    </AuthModalProvider>
  );
}