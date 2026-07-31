import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus Drop — Local file transfer",
    description:
      "Move files, photos, and text between nearby devices over Wi-Fi or hotspot with Drop Rooms. IPFS storage and public links are available when you need them.",
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
