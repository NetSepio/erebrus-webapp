"use client";

import type { ReactNode } from "react";

export default function AppChrome({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}