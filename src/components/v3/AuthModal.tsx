"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppKit } from "@reown/appkit/react";
import { useWalletAuth } from "@/context/appkit";
import { AccentButton } from "@/components/v3/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AuthModalContext = createContext<{ open: () => void }>({ open: () => {} });

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { open: openAppKit } = useAppKit();
  const { isConnected, isAuthenticated, authenticate, isAuthenticating, address } =
    useWalletAuth();

  const handleLaunch = useCallback(async () => {
    if (!isConnected) {
      openAppKit();
      return;
    }
    const ok = await authenticate();
    if (ok) {
      setVisible(false);
      router.push("/dashboard");
    }
  }, [isConnected, authenticate, openAppKit, router]);

  const open = useCallback(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    setVisible(true);
  }, [isAuthenticated, router]);

  return (
    <AuthModalContext.Provider value={{ open }}>
      {children}
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="max-w-md border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Image
                src="/brand/erebrus-icon.png"
                alt=""
                width={36}
                height={36}
                className="rounded-[10px]"
              />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Sign in to Erebrus
              </DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-[var(--text-2)] leading-relaxed">
            Connect with Phantom, MetaMask, or WalletConnect. Sign the EULA message to get your
            session — no passwords, no middlemen.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <AccentButton
              className="w-full"
              onClick={handleLaunch}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing…
                </>
              ) : isConnected ? (
                <>Sign message{address ? ` · ${address.slice(0, 6)}…` : ""}</>
              ) : (
                <>Connect wallet</>
              )}
            </AccentButton>
            <p className="text-center font-mono text-[11px] text-[var(--text-3)]">
              EVM + Solana supported · Email verification available after login
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function AuthModalTrigger({
  children,
}: {
  children: ReactNode;
}) {
  const { open } = useContext(AuthModalContext);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      className="inline-flex cursor-pointer"
    >
      {children}
    </span>
  );
}