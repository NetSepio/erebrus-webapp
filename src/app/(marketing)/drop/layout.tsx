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
    icon: [{ url: "/brand/erebrus-drop.png", type: "image/png" }],
    shortcut: "/brand/erebrus-drop.png",
    apple: "/brand/erebrus-drop.png",
  },
};

export default function DropMarketingLayout({ children }: { children: ReactNode }) {
  return children;
}