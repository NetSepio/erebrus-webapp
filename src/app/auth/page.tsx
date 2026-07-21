"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
} from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import type { Eip1193Provider } from "ethers";
import { Check, Copy, Loader2, Mail, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AccentButton, ActionButton } from "@/components/v3/ui";
import {
  AUTH_CALLBACK_FIELDS,
  authenticateEvm,
  authenticateSolana,
  buildAuthCallbackUrl,
  emailLoginStart,
  emailLoginVerify,
  getAllowedDesktopAuthRedirectUris,
  googleLogin,
  appleLogin,
  type AuthSession,
} from "@/lib/gateway-auth";
import { useAuthMethods } from "@/hooks/use-auth-methods";
import { useGoogleSignIn, useAppleSignIn, type AppleCredential } from "@/hooks/use-social-login";

type AuthParams = {
  redirectUri: string;
  state: string;
  platform: string;
  clientId: string;
};

type PageStatus =
  | "ready"
  | "waiting_provider"
  | "signing"
  | "success"
  | "error";

const AUTO_CLOSE_SECONDS = 30;

type ClientInfo = {
  name: string;
  product: string;
  logo: string;
};

function getClientInfo(clientId: string, platform: string): ClientInfo {
  const id = clientId.trim().toLowerCase();
  let product = "Erebrus";
  let logo = "/brand/erebrus-logo.png";

  if (id.includes("ai")) {
    product = "Erebrus AI";
    logo = "/brand/erebrus-ai.png";
  } else if (id.includes("drop")) {
    product = "Erebrus Drop";
    logo = "/brand/erebrus-drop.png";
  } else if (id.includes("vpn")) {
    product = "Erebrus VPN";
    logo = "/brand/erebrus-vpn.png";
  }

  const platformLabel = platform.trim()
    ? platform.trim().charAt(0).toUpperCase() + platform.trim().slice(1)
    : "";
  const name = platformLabel ? `${product} ${platformLabel}` : product;

  return { name, product, logo };
}

function parseAuthParams(searchParams: URLSearchParams): AuthParams | null {
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (!getAllowedDesktopAuthRedirectUris().includes(redirectUri)) return null;
  if (!state || !platform || !clientId) return null;

  return { redirectUri, state, platform, clientId };
}

function buildSuccessCallbackUrl(
  params: AuthParams,
  session: AuthSession
): string {
  return buildAuthCallbackUrl(params.redirectUri, {
    token: session.token,
    user_id: session.userId,
    wallet: session.walletAddress,
    role: session.role,
    state: params.state,
  });
}

function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function SignInNotice({ clientInfo }: { clientInfo: ClientInfo }) {
  return (
    <div className="mb-6 space-y-4 text-left">
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
        <Image
          src={clientInfo.logo}
          alt=""
          width={44}
          height={44}
          className="rounded-xl"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-200">{clientInfo.name}</p>
          <p className="text-xs text-zinc-500">
            Will receive only the data listed below after you sign in.
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {AUTH_CALLBACK_FIELDS.map((field) => (
          <li
            key={field.key}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs text-[#FF7E44]">{field.key}</code>
              <span className="text-sm font-medium text-zinc-200">{field.label}</span>
              {field.sensitive && (
                <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300/90">
                  Sensitive
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {field.description}
            </p>
          </li>
        ))}
      </ul>

      <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
        Your credentials are handled by the provider you choose. Erebrus does not receive
        your private keys or seed phrase.
      </p>
    </div>
  );
}

function AuthSuccessPanel({
  session,
  callbackUrl,
  clientInfo,
}: {
  session: AuthSession;
  callbackUrl: string;
  clientInfo: ClientInfo;
}) {
  const [copied, setCopied] = useState<"token" | "url" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);

  useEffect(() => {
    if (!session.token?.trim()) return;
    window.location.href = callbackUrl;
  }, [callbackUrl, session.token]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(interval);
          window.close();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const copy = async (text: string, kind: "token" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AuthShell
      title="Signed in"
      subtitle={`Returning to ${clientInfo.name}`}
      status="success"
      logo={clientInfo.logo}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-lg border border-green-900/50 bg-green-950/30 px-3 py-2.5 text-sm text-green-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Opening the app now. If it doesn&apos;t switch automatically, copy the
            session token below and paste it in the app.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Sent to {clientInfo.name}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">wallet</dt>
              <dd className="font-mono text-zinc-300">
                {truncateMiddle(session.walletAddress)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">user_id</dt>
              <dd className="font-mono text-zinc-300">
                {truncateMiddle(session.userId)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">role</dt>
              <dd className="text-zinc-300">{session.role}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">token</dt>
              <dd className="font-mono text-zinc-300">PASETO (session)</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Session token
          </p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="break-all font-mono text-xs leading-relaxed text-zinc-300">
              {session.token}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copy(session.token, "token")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {copied === "token" ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy session token
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void copy(callbackUrl, "url")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
        >
          {copied === "url" ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              Callback URL copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy full callback URL
            </>
          )}
        </button>

        <p className="text-center text-xs text-zinc-500">
          This tab will close in {secondsLeft}s — or close it manually once
          you&apos;re done.
        </p>

        <button
          type="button"
          onClick={() => window.close()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
          Close tab
        </button>
      </div>
    </AuthShell>
  );
}

function DesktopAuthContent() {
  const searchParams = useSearchParams();
  const params = parseAuthParams(searchParams);
  const clientInfo = params
    ? getClientInfo(params.clientId, params.platform)
    : null;

  const { isConnected, address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetworkCore();
  const { open: openAppKit } = useAppKit();
  const { walletProvider: evmWalletProvider } =
    useAppKitProvider<Eip1193Provider>("eip155");
  const { walletProvider: solanaWalletProvider } =
    useAppKitProvider<Provider>("solana");

  const {
    googleClientId,
    appleClientId,
    googleEnabled,
    appleEnabled,
    emailEnabled,
  } = useAuthMethods();

  const [status, setStatus] = useState<PageStatus>(
    params ? "ready" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    params ? "" : "Invalid or missing sign-in parameters."
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [walletStarted, setWalletStarted] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);

  const authStarted = useRef(false);

  const isSolanaChain = caipNetworkId?.startsWith("solana:") ?? true;
  const walletProviderReady = isSolanaChain
    ? Boolean(solanaWalletProvider)
    : Boolean(evmWalletProvider);

  const completeAuth = useCallback((result: AuthSession) => {
    if (!result.token?.trim()) {
      throw new Error("Gateway did not return a session token");
    }
    setSession(result);
    setStatus("success");
  }, []);

  const runWalletAuth = useCallback(async () => {
    if (!params || !address || authStarted.current) return;

    const provider = isSolanaChain ? solanaWalletProvider : evmWalletProvider;
    if (!provider) return;

    authStarted.current = true;
    setStatus("signing");
    setErrorMessage("");

    try {
      const result = isSolanaChain
        ? await authenticateSolana(address, solanaWalletProvider!)
        : await authenticateEvm(address, evmWalletProvider!);
      completeAuth(result);
    } catch (error) {
      authStarted.current = false;
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      setStatus("error");
      setErrorMessage(message);
    }
  }, [
    address,
    completeAuth,
    evmWalletProvider,
    isSolanaChain,
    params,
    solanaWalletProvider,
  ]);

  useEffect(() => {
    if (!isConnected) {
      authStarted.current = false;
      setWalletStarted(false);
      setStatus((current) => (current === "success" ? current : "ready"));
      setErrorMessage("");
    }
  }, [isConnected]);

  useEffect(() => {
    if (
      !walletStarted ||
      !params ||
      !isConnected ||
      !address ||
      authStarted.current
    )
      return;

    if (!walletProviderReady) {
      setStatus("waiting_provider");
      return;
    }

    void runWalletAuth();
  }, [
    address,
    isConnected,
    params,
    runWalletAuth,
    walletProviderReady,
    walletStarted,
  ]);

  useEffect(() => {
    if (
      !walletStarted ||
      !isConnected ||
      !address ||
      walletProviderReady ||
      authStarted.current
    ) {
      return;
    }

    setStatus("waiting_provider");
    const timeout = window.setTimeout(() => {
      if (authStarted.current || walletProviderReady) return;
      setStatus("error");
      setErrorMessage(
        "Wallet connected but signing is not ready yet — disconnect, reconnect, and try again."
      );
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [address, isConnected, walletProviderReady, walletStarted]);

  const handleWalletLaunch = useCallback(() => {
    setErrorMessage("");
    if (!isConnected) {
      setWalletStarted(true);
      openAppKit();
      return;
    }
    if (!walletProviderReady) {
      setStatus("waiting_provider");
      return;
    }
    void runWalletAuth();
  }, [isConnected, openAppKit, runWalletAuth, walletProviderReady]);

  const completeSocialLogin = useCallback(
    async (
      provider: "google" | "apple",
      idToken: string,
      nonce?: string,
      authorizationCode?: string
    ) => {
      if (!params) return;
      setSocialBusy(true);
      setStatus("signing");
      setErrorMessage("");
      try {
        const result =
          provider === "google"
            ? await googleLogin(idToken)
            : await appleLogin(idToken, nonce, authorizationCode);
        setSocialBusy(false);
        completeAuth(result);
      } catch (error) {
        setSocialBusy(false);
        const message =
          error instanceof Error
            ? error.message
            : `${provider} sign-in failed`;
        setStatus("error");
        setErrorMessage(message);
      }
    },
    [completeAuth, params]
  );

  const { ready: googleReady, signIn: signInWithGoogle, btnRef: googleBtnRef } =
    useGoogleSignIn(
      googleClientId,
      (token) => void completeSocialLogin("google", token),
      googleEnabled
    );

  const { ready: appleReady, signIn: signInWithApple } = useAppleSignIn(
    appleClientId,
    ({ idToken, nonce, authorizationCode }: AppleCredential) =>
      void completeSocialLogin("apple", idToken, nonce, authorizationCode),
    appleEnabled
  );

  const sendCode = useCallback(async () => {
    const addr = email.trim();
    if (!addr || !emailEnabled) return;
    setEmailBusy(true);
    setErrorMessage("");
    try {
      await emailLoginStart(addr);
      setCodeSent(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not send the code — check the address and try again";
      setStatus("error");
      setErrorMessage(message);
    } finally {
      setEmailBusy(false);
    }
  }, [email, emailEnabled]);

  const verifyCode = useCallback(async () => {
    if (!params) return;
    setEmailBusy(true);
    setStatus("signing");
    setErrorMessage("");
    try {
      const result = await emailLoginVerify(email.trim(), code.trim());
      setEmailBusy(false);
      completeAuth(result);
    } catch (error) {
      setEmailBusy(false);
      const message =
        error instanceof Error ? error.message : "Invalid or expired code";
      setStatus("error");
      setErrorMessage(message);
    }
  }, [code, completeAuth, email, params]);

  if (!params || !clientInfo) {
    return (
      <AuthShell
        title="Sign-in unavailable"
        subtitle="Invalid or missing sign-in parameters."
        status="error"
      />
    );
  }

  if (status === "success" && session) {
    return (
      <AuthSuccessPanel
        session={session}
        callbackUrl={buildSuccessCallbackUrl(params, session)}
        clientInfo={clientInfo}
      />
    );
  }

  const statusLabel =
    status === "signing"
      ? "Signing you in…"
      : status === "waiting_provider"
        ? "Preparing wallet…"
        : "";

  const showDivider =
    emailEnabled ||
    (googleEnabled && googleReady) ||
    (appleEnabled && appleReady);

  return (
    <AuthShell
      title={`Sign in to ${clientInfo.name}`}
      subtitle="Choose how you want to sign in"
      status={status}
      logo={clientInfo.logo}
    >
      <SignInNotice clientInfo={clientInfo} />

      <div className="space-y-4">
        {emailEnabled && (
          <div className="flex flex-col gap-2">
            {!codeSent ? (
              <>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  className="border-white/10 bg-zinc-900"
                />
                <ActionButton
                  type="button"
                  variant="neutral"
                  className="w-full !py-2.5"
                  onClick={sendCode}
                  disabled={emailBusy || !email.trim()}
                >
                  {emailBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail size={15} />
                  )}
                  Continue with email
                </ActionButton>
              </>
            ) : (
              <>
                <Input
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  className="border-white/10 bg-zinc-900 tracking-[0.3em]"
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
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                  }}
                  className="text-center font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  ← use a different email
                </button>
              </>
            )}
          </div>
        )}

        {(googleEnabled && googleReady) || (appleEnabled && appleReady) ? (
          <div
            className={cn(
              "grid gap-2",
              googleEnabled && googleReady && appleEnabled && appleReady
                ? "grid-cols-2"
                : "grid-cols-1"
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
                    setErrorMessage(
                      "Google sign-in is not ready yet — try again in a moment"
                    );
                  }
                }}
              >
                {socialBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
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
                      setErrorMessage(
                        "Apple sign-in is not ready yet — try again in a moment"
                      );
                    }
                  });
                }}
              >
                Apple
              </ActionButton>
            )}
          </div>
        ) : null}

        {showDivider && (
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="font-mono text-[11px] text-zinc-500">OR</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
        )}

        <AccentButton
          className="w-full"
          onClick={handleWalletLaunch}
          disabled={status === "signing" || status === "waiting_provider"}
        >
          {status === "signing" || status === "waiting_provider" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {isConnected ? "Sign with wallet" : "Connect wallet"}
        </AccentButton>

        {isConnected && address && (
          <p className="text-center text-xs text-zinc-500">
            {truncateMiddle(address)}
          </p>
        )}

        {statusLabel && (
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusLabel}</span>
          </div>
        )}

        {status === "error" && errorMessage && (
          <p className="max-w-sm text-center text-sm text-red-400">
            {errorMessage}
          </p>
        )}
      </div>

      {googleEnabled && (
        <div
          ref={googleBtnRef}
          className="sr-only absolute h-0 w-0 overflow-hidden"
          aria-hidden
        />
      )}
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  status,
  logo,
  children,
}: {
  title: string;
  subtitle: string;
  status: PageStatus;
  logo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={56}
              height={56}
              className="rounded-2xl"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <Shield
                className={`h-6 w-6 ${
                  status === "error"
                    ? "text-red-400"
                    : status === "success"
                      ? "text-green-400"
                      : "text-white"
                }`}
              />
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ExternalAuthPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Authorize app"
          subtitle="Loading…"
          status="ready"
        />
      }
    >
      <DesktopAuthContent />
    </Suspense>
  );
}