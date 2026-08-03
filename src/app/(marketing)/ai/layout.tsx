import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus AI - Run Private AI Models on Trusted Hardware",
    description:
      "Download supported local AI models, run them on your computer or private server, and make them available to approved devices through Erebrus.",
    path: "/ai",
    // og + twitter images come from this route's opengraph-image/twitter-image.
    image: null,
  }),
  icons: {
    icon: [{ url: "/ai/logo.png", type: "image/png", sizes: "1024x1024" }],
    shortcut: "/ai/logo.png",
    apple: "/ai/logo.png",
  },
};

export default function AiMarketingLayout({ children }: { children: ReactNode }) {
  return children;
}
