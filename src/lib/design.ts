export const colors = {
  bg: "#0A0A0C",
  bgDeep: "#050507",
  surface: "#131318",
  surface2: "#16161B",
  elevated: "#0D0D11",
  stroke: "rgba(255,255,255,0.07)",
  text: "#F4F3F0",
  text2: "#9A9AA2",
  text3: "#6A6A72",
  accent: "#FF6B35",
  accentHi: "#FF7E44",
  accentDeep: "#E0531F",
  onAccent: "#0A0A0C",
  success: "#36D399",
  warn: "#E6A13C",
  danger: "#E35D5D",
  solana: "#9945FF",
  ethereum: "#627EEA",
} as const;

export const auroraBg =
  "radial-gradient(ellipse 95% 55% at 50% -12%, rgba(255,107,53,0.2), transparent 55%)";

export const accentGradient = "linear-gradient(150deg, #FF7E44, #E0531F)";

export function truncateAddress(addr: string, chars = 4): string {
  if (!addr || addr.length < chars * 2 + 3) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function subscriptionEndDate(sub?: {
  current_period_end?: string;
  expires_at?: string;
}): string | undefined {
  return sub?.current_period_end ?? sub?.expires_at;
}

export function daysRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function planProgress(expiresAt?: string, totalDays = 7): number {
  const remaining = daysRemaining(expiresAt);
  if (remaining === null) return 0;
  return Math.min(100, Math.max(0, ((totalDays - remaining) / totalDays) * 100));
}

export function trialTotalDays(source?: string): number {
  if (source === "nft") return 30;
  if (source === "rank") return 7;
  return 7;
}