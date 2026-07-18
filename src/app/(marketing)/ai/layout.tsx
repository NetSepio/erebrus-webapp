import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Erebrus AI — Local LLM runner",
    description:
      "Run AI models locally and chat with them from any device on your network. Download quantized GGUF models, create custom personas, and turn your desktop into a private AI node.",
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
