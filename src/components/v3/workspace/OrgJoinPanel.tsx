"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  AccentButton,
  ActionButton,
  Card,
} from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWalletAuth, setWebSession } from "@/context/appkit";
import { useAppleSignIn, useGoogleSignIn } from "@/hooks/use-social-login";
import {
  appleLogin,
  emailLoginStart,
  emailLoginVerify,
  googleLogin,
} from "@/lib/gateway-auth";
import { fetchOrgInvitePreview, fetchOrgs } from "@/lib/gateway/client";
import type { GatewayOrgInvitePreview } from "@/lib/gateway/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

export function OrgJoinPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const { open: openAppKit } = useAppKit();
  const { isConnected, isAuthenticated, authenticate, isAuthenticating, address } =
    useWalletAuth();

  const [preview, setPreview] = useState<GatewayOrgInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);

  const redirectToWorkspace = useCallback(
    async (orgId: string) => {
      setJoining(true);
      try {
        router.push(`/workspace/${orgId}`);
      } finally {
        setJoining(false);
      }
    },
    [router]
  );

  const tryJoinWorkspace = useCallback(async () => {
    if (!preview) return false;
    const orgs = await fetchOrgs().catch(() => []);
    const joined = orgs.find((o) => o.id === preview.org_id || o.slug === preview.slug);
    if (joined) {
      await redirectToWorkspace(joined.id);
      return true;
    }
    return false;
  }, [preview, redirectToWorkspace]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetchOrgInvitePreview(slug)
      .then((data) => {
        setPreview(data);
        setModalOpen(true);
      })
      .catch(() => setLoadError("This invitation link is invalid or the workspace no longer exists."))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!isAuthenticated || !preview) return;
    void tryJoinWorkspace().then((joined) => {
      if (!joined) {
        toast.message("Sign in with the invited email or wallet to join this workspace.");
      }
    });
  }, [isAuthenticated, preview, tryJoinWorkspace]);

  const completeSocialLogin = useCallback(
    async (provider: "google" | "apple", idToken: string) => {
      setSocialBusy(true);
      try {
        const session =
          provider === "google"
            ? await googleLogin(idToken)
            : await appleLogin(idToken);
        setWebSession(session.token, session.userId, provider);
        setModalOpen(false);
        const joined = await tryJoinWorkspace();
        if (!joined) {
          toast.message("Your account is signed in. Verify the invited email if you have not joined yet.");
          router.push("/workspace");
        }
      } catch {
        toast.error(
          provider === "google"
            ? "Google sign-in failed — try again"
            : "Apple sign-in failed — try again"
        );
      } finally {
        setSocialBusy(false);
      }
    },
    [router, tryJoinWorkspace]
  );

  const { ready: googleReady, signIn: signInWithGoogle, btnRef: googleBtnRef } =
    useGoogleSignIn(GOOGLE_CLIENT_ID, (token) => void completeSocialLogin("google", token), modalOpen);

  const { ready: appleReady, signIn: signInWithApple } = useAppleSignIn(
    APPLE_CLIENT_ID,
    (token) => void completeSocialLogin("apple", token),
    modalOpen
  );

  const handleWalletSignIn = useCallback(async () => {
    if (!isConnected) {
      openAppKit();
      return;
    }
    const ok = await authenticate();
    if (!ok) return;
    setModalOpen(false);
    const joined = await tryJoinWorkspace();
    if (!joined) {
      toast.message("Signed in. Use the wallet or email address that received the invite.");
      router.push("/workspace");
    }
  }, [authenticate, isConnected, openAppKit, router, tryJoinWorkspace]);

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
      setModalOpen(false);
      const joined = await tryJoinWorkspace();
      if (!joined) {
        toast.message("Signed in. If this email was invited, refresh your workspaces in a moment.");
        router.push("/workspace");
      }
    } catch {
      toast.error("Invalid or expired code");
    } finally {
      setEmailBusy(false);
    }
  }, [code, email, router, tryJoinWorkspace]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-[var(--text-2)]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading invitation…
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invitation unavailable</h1>
        <p className="text-sm text-[var(--text-2)]">{loadError}</p>
        <Link href="/workspace" className="text-sm font-semibold text-[var(--accent-hi)]">
          Go to workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-12">
      <Card className="w-full p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--solana)] to-[var(--accent)]">
          <Image src="/brand/erebrus-mark.png" alt="" width={28} height={28} className="rounded-lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Join workspace</h1>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          You&apos;ve been invited to <span className="font-semibold text-[var(--text)]">{preview.name}</span>.
          Sign in with the invited email or wallet to accept.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <AccentButton type="button" onClick={() => setModalOpen(true)} disabled={joining}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Accept invitation
          </AccentButton>
          <ActionButton type="button" onClick={() => void tryJoinWorkspace()} disabled={!isAuthenticated || joining}>
            I&apos;m already signed in
          </ActionButton>
        </div>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border-white/10 bg-[var(--elevated)] text-[var(--text)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Join {preview.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-2)] leading-relaxed">
            Sign in with the email or wallet that received this invitation. After verification,
            you&apos;ll be added to the workspace automatically.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <AccentButton className="w-full" onClick={handleWalletSignIn} disabled={isAuthenticating || joining}>
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
                  placeholder="Invited email address"
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
                  Verify &amp; join
                </ActionButton>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                type="button"
                variant="neutral"
                className="!py-2.5"
                disabled={!GOOGLE_CLIENT_ID || !googleReady || socialBusy}
                onClick={() => {
                  if (!signInWithGoogle()) {
                    toast.error("Google sign-in is not ready yet — try again in a moment");
                  }
                }}
              >
                Google
              </ActionButton>
              <ActionButton
                type="button"
                variant="neutral"
                className="!py-2.5"
                disabled={!APPLE_CLIENT_ID || !appleReady || socialBusy}
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
            </div>
            <div ref={googleBtnRef} className="sr-only absolute h-0 w-0 overflow-hidden" aria-hidden />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}