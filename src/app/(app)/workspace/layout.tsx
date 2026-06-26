import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "Workspace",
  description: "Manage Erebrus orgs, operator nodes, API keys, and team members.",
  path: "/workspace",
});

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return children;
}