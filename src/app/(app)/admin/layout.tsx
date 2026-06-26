import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Admin Console",
  description: "Erebrus platform administration.",
  path: "/admin",
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}