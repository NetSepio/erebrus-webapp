"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/context/appkit";
import { AuthModalProvider, AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton } from "@/components/v3/ui";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isConnected, isAuthenticated, isAuthenticating } = useWalletAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected && !isAuthenticating) {
      // stay on page — show gate UI
    }
  }, [isConnected, isAuthenticating]);

  if (isAuthenticating) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthModalProvider>
        <div className="mx-auto max-w-md py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Connect to continue</h2>
          <p className="mt-3 text-sm text-[var(--text-2)]">
            Sign in with your wallet to access the Erebrus app.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <AuthModalTrigger>
              <AccentButton className="w-full">Connect wallet</AccentButton>
            </AuthModalTrigger>
            <button
              type="button"
              className="text-sm text-[var(--text-3)] hover:text-[var(--text-2)]"
              onClick={() => router.push("/")}
            >
              ← Back to home
            </button>
          </div>
        </div>
      </AuthModalProvider>
    );
  }

  return <>{children}</>;
}