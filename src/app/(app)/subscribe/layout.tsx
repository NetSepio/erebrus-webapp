import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Plan",
  description: "Your Erebrus entitlements, set by organization membership and seats.",
  path: "/subscribe",
});

export default function SubscribeLayout({ children }: { children: ReactNode }) {
  return children;
}