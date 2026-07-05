"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDisconnect, useAppKitAccount, useAppKitNetworkCore } from "@reown/appkit/react";
import { truncateAddress, daysRemaining, subscriptionEndDate } from "@/lib/design";
import { userDisplayName } from "@/lib/display-name";
import { fetchProfile } from "@/lib/gateway/client";
import type { GatewayProfile, GatewaySubscription } from "@/lib/gateway/types";
import Cookies from "js-cookie";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { ChainBadge } from "@/components/v3/app/ChainBadge";

export function WalletMenu({ subscription }: { subscription: GatewaySubscription | null }) {
  const { isAdmin } = usePlatformAdmin();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<GatewayProfile | null>(null);
  const { address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetworkCore();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const chain = caipNetworkId?.startsWith("solana:") ? "sol" : "evm";
  const days = daysRemaining(subscriptionEndDate(subscription ?? undefined));
  const wallet = address || profile?.wallet_address || "";
  const title = userDisplayName(profile, wallet);
  const subtitle = wallet ? truncateAddress(wallet) : profile?.email_verified ? profile.email : "";

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const logout = async () => {
    ["solana", "evm"].forEach((chainType) => {
      Cookies.remove(`erebrus_token_${chainType}`, { path: "/" });
      Cookies.remove(`erebrus_wallet_${chainType}`, { path: "/" });
      Cookies.remove(`erebrus_userid_${chainType}`, { path: "/" });
    });
    Cookies.remove("erebrus_token", { path: "/" });
    Cookies.remove("erebrus_wallet", { path: "/" });
    Cookies.remove("erebrus_userid", { path: "/" });
    await disconnect();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-[11px] border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-left"
      >
        <div
          className="h-7 w-7 shrink-0 rounded-lg"
          style={{ background: "linear-gradient(135deg, #9945FF, #FF6B35)" }}
        />
        <div className="hidden min-w-0 sm:block">
          <div className="max-w-[10rem] truncate text-[13px] font-semibold">{title}</div>
          <div className="max-w-[10rem] truncate font-mono text-[10px] text-[var(--text-3)]">
            {subtitle || <ChainBadge chain={profile?.chain ?? chain} />}
          </div>
        </div>
        <span className="text-[10px] text-[var(--text-3)]">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-[230px] rounded-[14px] border border-white/10 bg-[#14110F] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <div className="border-b border-white/[0.06] px-3 py-3 mb-1">
              <div className="text-[13.5px] font-semibold">{title}</div>
              {wallet && (
                <div className="mt-1 font-mono text-[11px] text-[var(--text-3)]">
                  {truncateAddress(wallet)}
                </div>
              )}
              <div className="mt-1.5">
                <ChainBadge chain={profile?.chain ?? chain} size="md" />
              </div>
              {subscription?.entitled && days !== null && (
                <div className="mt-2 font-mono text-[11px] text-[var(--accent-hi)]">
                  {subscription.source ?? "Trial"} · {days} days left
                </div>
              )}
            </div>
            <MenuLink href="/profile" glyph="◆" onClick={() => setOpen(false)}>
              Profile
            </MenuLink>
            <MenuLink href="/profile/activity" glyph="◎" onClick={() => setOpen(false)}>
              Activity
            </MenuLink>
            <MenuLink href="/rewards" glyph="✦" onClick={() => setOpen(false)}>
              Rewards & XP
            </MenuLink>
            {isAdmin && (
              <MenuLink href="/admin" glyph="⬢" onClick={() => setOpen(false)}>
                Admin Console
              </MenuLink>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-[9px] border border-transparent px-3 py-2.5 text-left text-[13.5px] text-[var(--danger)] transition-colors hover:border-[var(--danger)]/20 hover:bg-[var(--danger)]/8"
            >
              <span className="font-mono">⏻</span>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  glyph,
  children,
  onClick,
}: {
  href: string;
  glyph: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--text)] transition-colors hover:bg-white/[0.06]"
    >
      <span className="font-mono text-[var(--text-2)]">{glyph}</span>
      {children}
    </Link>
  );
}