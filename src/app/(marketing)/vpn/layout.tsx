import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus VPN — Decentralized, no-logs VPN",
    description:
      "A decentralized VPN run by a global community, not a company. Wallet login, WireGuard tunnels, and a network with no central operator.",
    path: "/vpn",
    image: "/brand/erebrus-vpn.png",
    imageAlt: "Erebrus VPN",
    imageWidth: 512,
    imageHeight: 512,
  }),
  icons: {
    icon: [{ url: "/brand/erebrus-vpn.png", type: "image/png" }],
    shortcut: "/brand/erebrus-vpn.png",
    apple: "/brand/erebrus-vpn.png",
  },
};

export default function VpnMarketingLayout({ children }: { children: ReactNode }) {
  return children;
}