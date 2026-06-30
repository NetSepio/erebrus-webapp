"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppKit } from "@reown/appkit/react";
import { useWalletAuth, setWebSession } from "@/context/appkit";
import { emailLoginStart, emailLoginVerify } from "@/lib/gateway-auth";
import { AccentButton, ActionButton } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

const AuthModalContext = createContext<{ open: () => void }>({ open: () => {} });

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { open: openAppKit } = useAppKit();
  const { isConnected, isAuthenticated, authenticate, isAuthenticating, address } =
    useWalletAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);

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

  const sendCode = useCallback(async () => {
    const addr = email.trim();
    if (!addr) return;
    setEmailBusy(true);
    try {
      await emailLoginStart(addr);
      setCodeSent(true);
      toast.success("We sent you a 6-digit code");
    } catch {
      toast.error("Could not send the code — check the address and try again");
    } finally {
      setEmailBusy(false);
    }
  }, [email]);

  const verifyCode = useCallback(async () => {
    setEmailBusy(true);
    try {
      const session = await emailLoginVerify(email.trim(), code.trim());
      setWebSession(session.token, session.userId, "email");
      setVisible(false);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid or expired code");
    } finally {
      setEmailBusy(false);
    }
  }, [email, code, router]);

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
            Sign in with your wallet, email, or a social account — one Erebrus account, however
            you connect.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <AccentButton className="w-full" onClick={handleLaunch} disabled={isAuthenticating}>
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

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-white/[0.08]" />
              <span className="font-mono text-[11px] text-[var(--text-3)]">OR</span>
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            {!codeSent ? (
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  className="border-white/10 bg-[var(--surface-2)]"
                />
                <ActionButton
                  type="button"
                  variant="neutral"
                  className="w-full !py-2.5"
                  onClick={sendCode}
                  disabled={emailBusy || !email.trim()}
                >
                  {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail size={15} />}
                  Continue with email
                </ActionButton>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  className="border-white/10 bg-[var(--surface-2)] tracking-[0.3em]"
                />
                <ActionButton
                  type="button"
                  variant="accent"
                  className="w-full !py-2.5"
                  onClick={verifyCode}
                  disabled={emailBusy || code.trim().length < 4}
                >
                  {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify &amp; sign in
                </ActionButton>
                <button
                  type="button"
                  className="text-center font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)]"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                  }}
                >
                  ← use a different email
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                type="button"
                variant="neutral"
                className="!py-2.5"
                disabled={!GOOGLE_CLIENT_ID}
                onClick={() => toast.message("Google sign-in is being set up")}
              >
                Google
              </ActionButton>
              <ActionButton
                type="button"
                variant="neutral"
                className="!py-2.5"
                disabled={!APPLE_CLIENT_ID}
                onClick={() => toast.message("Apple sign-in is being set up")}
              >
                Apple
              </ActionButton>
            </div>
            {(!GOOGLE_CLIENT_ID || !APPLE_CLIENT_ID) && (
              <p className="text-center font-mono text-[10px] text-[var(--text-3)]">
                Google / Apple unlock once their client IDs are configured
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function AuthModalTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open } = useContext(AuthModalContext);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      className={cn("inline-flex cursor-pointer", className)}
    >
      {children}
    </span>
  );
}