"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ErebrusNavbar from "@/components/navbar";

const APP_PREFIXES = [
  "/dashboard",
  "/connect",
  "/workspace",
  "/profile",
  "/rewards",
  "/subscribe",
];

const MARKETING_PATHS = new Set(["/", "/vpn", "/drop", "/terms", "/privacy", "/contact"]);

function usesLegacyNavbar(pathname: string): boolean {
  if (pathname === "/auth") return false;
  if (APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (MARKETING_PATHS.has(pathname)) return false;
  return true;
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNavbar = usesLegacyNavbar(pathname);

  return (
    <div className="flex flex-col">
      {showNavbar && <ErebrusNavbar />}
      {children}
    </div>
  );
}