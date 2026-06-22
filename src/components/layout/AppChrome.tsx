"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ErebrusNavbar from "@/components/navbar";

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/auth";

  return (
    <div className="flex flex-col">
      {!hideNavbar && <ErebrusNavbar />}
      {children}
    </div>
  );
}