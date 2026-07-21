"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import { useAppleSignIn, useGoogleSignIn, type AppleCredential } from "@/hooks/use-social-login";
import {
  appleLogin,
  emailLoginStart,
  emailLoginVerify,
  googleLogin,
} from "@/lib/gateway-auth";
import { useAuthMethods } from "@/hooks/use-auth-methods";
import {
  captureReferralCode,
  setStoredReferralCode,
  storedReferralCode,
} from "@/lib/referral";
import axios from "axios";
import { AccentButton, ActionButton } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

function socialLoginErrorMessage(provider: "google" | "apple", error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: string } | undefined;
    if (body?.error) return body.error;
    if (error.response?.status === 503) {
      return provider === "google"
        ? "Google sign-in is not enabled on the gateway — add this web client ID to GOOGLE_CLIENT_IDS"
        : "Apple sign-in is not enabled on the gateway — add your client ID to APPLE_CLIENT_IDS";
    }
  }
  return provider === "google" ? "Google sign-in failed — try again" : "Apple sign-in failed — try again";
}

const AuthModalContext = createContext<{ open: () => void }>({ open: () => {} });

export function AuthModalProvider({
  children,
  autoOpen = false,
}: {
  children: ReactNode;
  autoOpen?: boolean;
}) {
  const [visible, setVisible] = useState(autoOpen);
  const router = useRouter();
  const { open: openAppKit } = useAppKit();
  const { isConnected, isAuthenticated, authenticate, isAuthenticating, address } =
    useWalletAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [invite, setInvite] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  // Referral attribution: remember ?ref=CODE from the URL; a code (captured or
  // typed below) rides along with whichever sign-in method completes first.
  useEffect(() => {
    captureReferralCode();
    const stored = storedReferralCode();
    if (stored) {
      setInvite(stored);
      setShowInvite(true);
    }
  }, []);

  const updateInvite = (value: string) => {
    setInvite(value.toUpperCase());
    setStoredReferralCode(value);
  };
  const { googleClientId, appleClientId, googleEnabled, appleEnabled, emailEnabled } =
    useAuthMethods();

  const completeSocialLogin = useCallback(
    async (
      provider: "google" | "apple",
      idToken: string,
      nonce?: string,
      authorizationCode?: string
    ) => {
      setSocialBusy(true);
      try {
        const session =
          provider === "google"
            ? await googleLogin(idToken)
            : await appleLogin(idToken, nonce, authorizationCode);
        setWebSession(session.token, session.userId, provider);
        setVisible(false);
        router.push("/dashboard");
      } catch (error) {
        toast.error(socialLoginErrorMessage(provider, error));
      } finally {
        setSocialBusy(false);
      }
    },
    [router]
  );

  const { ready: googleReady, signIn: signInWithGoogle, btnRef: googleBtnRef } =
    useGoogleSignIn(googleClientId, (token) => void completeSocialLogin("google", token), visible && googleEnabled);

  const { ready: appleReady, signIn: signInWithApple } = useAppleSignIn(
    appleClientId,
    ({ idToken, nonce, authorizationCode }: AppleCredential) =>
      void completeSocialLogin("apple", idToken, nonce, authorizationCode),
    visible && appleEnabled
  );

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
                src="/brand/erebrus-logo.png"
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

            {(googleEnabled && googleReady) || (appleEnabled && appleReady) ? (
              <div
                className={cn(
                  "grid gap-2",
                  googleEnabled && googleReady && appleEnabled && appleReady ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {googleEnabled && googleReady && (
                  <ActionButton
                    type="button"
                    variant="neutral"
                    className="!py-2.5"
                    disabled={socialBusy}
                    onClick={() => {
                      if (!signInWithGoogle()) {
                        toast.error("Google sign-in is not ready yet — try again in a moment");
                      }
                    }}
                  >
                    {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Google
                  </ActionButton>
                )}
                {appleEnabled && appleReady && (
                  <ActionButton
                    type="button"
                    variant="neutral"
                    className="!py-2.5"
                    disabled={socialBusy}
                    onClick={() => {
                      void signInWithApple().then((started) => {
                        if (!started) {
                          toast.error("Apple sign-in is not ready yet — try again in a moment");
                        }
                      });
                    }}
                  >
                    Apple
                  </ActionButton>
                )}
              </div>
            ) : null}
            {!showInvite ? (
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="text-center font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)]"
              >
                Have an invite code?
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Invite code (optional)"
                  value={invite}
                  onChange={(e) => updateInvite(e.target.value)}
                  className="border-white/10 bg-[var(--surface-2)] text-center font-mono uppercase tracking-widest"
                />
                <p className="text-center font-mono text-[10px] text-[var(--text-3)]">
                  Applied at sign-in — you and your inviter both earn XP.
                </p>
              </div>
            )}
            {/* GIS renders its own button here; we proxy clicks from our custom button above. */}
            {googleEnabled && (
              <div
                ref={googleBtnRef}
                className="sr-only absolute h-0 w-0 overflow-hidden"
                aria-hidden
              />
            )}
            {!emailEnabled && (
              <p className="text-center font-mono text-[10px] text-[var(--text-3)]">
                Email sign-in requires RESEND_API_KEY on the gateway
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