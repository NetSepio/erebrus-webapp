import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Activity",
  description: "Your Erebrus account activity log.",
  path: "/profile/activity",
});

export default function ActivityLayout({ children }: { children: ReactNode }) {
  return children;
}