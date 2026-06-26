import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Subscribe",
  description: "Get an Erebrus access pass — trials, NFT gating, and subscription plans.",
  path: "/subscribe",
});

export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return children;
}