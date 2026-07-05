import { truncateAddress } from "@/lib/design";
import type { GatewayProfile } from "@/lib/gateway/types";

export function emailLocalPart(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || email;
}

export function userDisplayName(
  profile: GatewayProfile | null | undefined,
  walletAddress?: string | null
): string {
  const name = profile?.name?.trim();
  if (name) return name;

  const email = profile?.email?.trim();
  if (email && profile?.email_verified) return emailLocalPart(email);

  const wallet = walletAddress?.trim() || profile?.wallet_address?.trim();
  if (wallet) return truncateAddress(wallet);

  return "Account";
}

export function responsiveWalletAddress(
  address: string,
  opts?: { mobileChars?: number; desktopMinLength?: number }
): { mobile: string; desktop: string } {
  const mobileChars = opts?.mobileChars ?? 4;
  const trimmed = address.trim();
  return {
    mobile: truncateAddress(trimmed, mobileChars),
    desktop: trimmed,
  };
}