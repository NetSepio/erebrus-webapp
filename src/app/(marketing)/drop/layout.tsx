import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus Drop — Decentralized IPFS storage",
    description:
      "Store files on community-run IPFS nodes, encrypt private files in your browser, and share public files by opaque link.",
    path: "/drop",
    // og + twitter images come from this route's opengraph-image/twitter-image.
    image: null,
  }),
  icons: {
    icon: [{ url: "/drop/logo.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: "/drop/logo.png",
    apple: "/drop/logo.png",
  },
};

export default function DropMarketingLayout({ children }: { children: ReactNode }) {
  return children;
}