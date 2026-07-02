import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus VPN — Decentralized, no-logs VPN",
    description:
      "A no-logs, privacy-first VPN powered by a worldwide community of node operators. Modern WireGuard encryption and wallet sign-in keep your traffic private — your data stays yours, never sold.",
    path: "/vpn",
    // og + twitter images come from this route's opengraph-image/twitter-image.
    image: null,
  }),
  icons: {
    icon: [{ url: "/vpn/logo.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: "/vpn/logo.png",
    apple: "/vpn/logo.png",
  },
};

export default function VpnMarketingLayout({ children }: { children: ReactNode }) {
  return children;
}