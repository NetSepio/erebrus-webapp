import type { ReactNode } from "react";
import { AuroraBackground } from "@/components/v3/AuroraBackground";
import { AuthModalProvider } from "@/components/v3/AuthModal";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <AuthModalProvider>
      <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <AuroraBackground />
        <div className="relative z-[2]">{children}</div>
      </div>
    </AuthModalProvider>
  );
}