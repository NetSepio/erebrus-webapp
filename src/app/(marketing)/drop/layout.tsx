import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus Drop — Local-first file sharing",
    description:
      "Turn any phone into a temporary, secure file server on local Wi-Fi. Share files between nearby devices — nothing touches the cloud.",
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