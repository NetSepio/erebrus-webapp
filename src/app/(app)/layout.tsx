import type { ReactNode } from "react";
import { AppShell } from "@/components/v3/app/AppShell";
import { RequireAuth } from "@/components/v3/app/RequireAuth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}