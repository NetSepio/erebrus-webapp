import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Pricing — Private internet for individuals, teams, and businesses",
    description:
      "Start free with private access and self-hosted nodes. Upgrade to Starter for more VPN devices, more Drop storage and Gateway API keys. Dedicated nodes and Shield protection are coming soon.",
    path: "/pricing",
    image: null,
    imageAlt: "Erebrus Pricing — Private Access to Sovereign Infrastructure",
    keywords: [
      "Erebrus",
      "VPN pricing",
      "private network plans",
      "agentic internet",
      "dedicated VPN nodes",
      "decentralized VPN",
      "sovereign infrastructure",
      "WireGuard VPN",
      "NetSepio",
    ],
  }),
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
