import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus VPN - Private, Resilient Connectivity from Anywhere",
    description:
      "Encrypt your internet connection, use trusted Erebrus gateways, and access private resources from supported devices at home, at work, or while travelling.",
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
