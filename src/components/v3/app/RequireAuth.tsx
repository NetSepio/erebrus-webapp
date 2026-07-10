"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/context/appkit";
import { AuthModalProvider, AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, ActionButton } from "@/components/v3/ui";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthenticating } = useWalletAuth();
  const router = useRouter();
  // Auth lives in cookies the server render can't see, so SSR always produces the
  // signed-out gate while a signed-in client's first render produces the app shell.
  // That mismatch makes React throw away the SSR DOM and regenerate the segment
  // client-side (logging "Encountered a script tag…" in dev). Render the same
  // loading state on the server and the first client pass, and only branch on
  // auth after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isAuthenticating) {
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
            Sign in with your wallet, email, Google, or Apple to access the Erebrus app.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <AuthModalTrigger>
              <AccentButton className="w-full">Connect wallet</AccentButton>
            </AuthModalTrigger>
            <ActionButton
              type="button"
              variant="neutral"
              className="w-full !py-2.5 !text-sm"
              onClick={() => router.push("/")}
            >
              ← Back to home
            </ActionButton>
          </div>
        </div>
      </AuthModalProvider>
    );
  }

  return <>{children}</>;
}