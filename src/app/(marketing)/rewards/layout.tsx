import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Erebrus Genesis Season",
  description: "Run what the network needs. Earn for what you contribute.",
  path: "/rewards",
});

export default function RewardsLayout({ children }: { children: ReactNode }) {
  return children;
}
