import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Rewards & XP",
  description: "Earn XP, claim rewards, and track your Erebrus operator tier.",
  path: "/rewards",
});

export default function RewardsLayout({ children }: { children: ReactNode }) {
  return children;
}