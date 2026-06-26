import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Profile",
  description: "Erebrus account settings, wallet profile, and verification.",
  path: "/profile",
});

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}