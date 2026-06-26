import type { ReactNode } from "react";
import { appPageMetadata } from "@/lib/seo";

export const metadata = appPageMetadata({
  title: "VPN Connect",
  description: "Connect to the Erebrus decentralized VPN network and provision WireGuard configs.",
  path: "/connect",
});

export default function ConnectLayout({ children }: { children: ReactNode }) {
  return children;
}