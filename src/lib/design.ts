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
