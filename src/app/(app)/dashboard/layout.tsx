import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Dashboard",
  description: "Your Erebrus network overview — VPN clients, nodes, and organization plan status.",
  path: "/dashboard",
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}