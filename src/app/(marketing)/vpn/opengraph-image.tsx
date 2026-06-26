import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus VPN — a no-logs VPN powered by a global community";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function VpnOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus VPN",
    title: "Privacy, powered by a global community",
    subtitle:
      "A no-logs VPN on community-run nodes with modern WireGuard encryption. Sign in with your wallet — your data stays yours, never sold.",
    tags: ["No-logs", "WireGuard", "erebrus.io"],
  });
}
