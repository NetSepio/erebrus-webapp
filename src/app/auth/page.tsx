"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
} from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import type { Eip1193Provider } from "ethers";
import { Check, Copy, Loader2, Shield, X } from "lucide-react";
import {
  ALLOWED_VPN_REDIRECT_URI,
  authenticateEvmVpn,
  authenticateSolanaVpn,
  buildVpnCallbackUrl,
  type VpnAuthSession,
} from "@/lib/vpn-gateway-auth";

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

function parseAuthParams(searchParams: URLSearchParams): AuthParams | null {
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (redirectUri !== ALLOWED_VPN_REDIRECT_URI) return null;
  if (!state || !platform || !clientId) return null;

  return { redirectUri, state, platform, clientId };
}

function buildSuccessCallbackUrl(
  params: AuthParams,
  session: VpnAuthSession
): string {
  return buildVpnCallbackUrl(params.redirectUri, {
    token: session.token,
    user_id: session.userId,
    wallet: session.walletAddress,
    role: session.role,
    state: params.state,
  });
}

function AuthSuccessPanel({
  session,
  callbackUrl,
  platform,
}: {
  session: VpnAuthSession;
  callbackUrl: string;
  platform: string;
}) {
  const [copied, setCopied] = useState<"token" | "url" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);

  // Redirect only after gateway auth completed and session.token is in hand.
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
      subtitle={`Return to Erebrus VPN on ${platform}`}
      status="success"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-lg border border-green-900/50 bg-green-950/30 px-3 py-2.5 text-sm text-green-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Opening the app now. If it doesn&apos;t switch automatically, copy the
            token below and paste it in the app.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            PASETO token
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
                Copy PASETO
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

function DesktopVpnAuthContent() {
  const searchParams = useSearchParams();
  const params = parseAuthParams(searchParams);

  const { isConnected, address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetworkCore();
  const { walletProvider: evmWalletProvider } =
    useAppKitProvider<Eip1193Provider>("eip155");
  const { walletProvider: solanaWalletProvider } =
    useAppKitProvider<Provider>("solana");

  const [status, setStatus] = useState<PageStatus>(
    params ? "ready" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    params ? "" : "Invalid or missing sign-in parameters."
  );
  const [session, setSession] = useState<VpnAuthSession | null>(null);

  const authStarted = useRef(false);

  const isSolanaChain = caipNetworkId?.startsWith("solana:") ?? true;
  const walletProviderReady = isSolanaChain
    ? Boolean(solanaWalletProvider)
    : Boolean(evmWalletProvider);

  const runAuth = useCallback(async () => {
    if (!params || !address || authStarted.current) return;

    const provider = isSolanaChain ? solanaWalletProvider : evmWalletProvider;
    if (!provider) return;

    authStarted.current = true;
    setStatus("signing");
    setErrorMessage("");

    try {
      const result = isSolanaChain
        ? await authenticateSolanaVpn(address, solanaWalletProvider!)
        : await authenticateEvmVpn(address, evmWalletProvider!);

      if (!result.token?.trim()) {
        throw new Error("Gateway did not return a session token");
      }

      setSession(result);
      setStatus("success");
    } catch (error) {
      authStarted.current = false;
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      setStatus("error");
      setErrorMessage(message);
    }
  }, [
    address,
    evmWalletProvider,
    isSolanaChain,
    params,
    solanaWalletProvider,
  ]);

  useEffect(() => {
    if (!isConnected) {
      authStarted.current = false;
      setStatus((current) => (current === "success" ? current : "ready"));
      setErrorMessage("");
    }
  }, [isConnected]);

  // Wait until AppKit exposes the wallet provider after connect — it lags behind
  // isConnected/address and auth must not run (or redirect) before signMessage works.
  useEffect(() => {
    if (!params || !isConnected || !address || authStarted.current) return;

    if (!walletProviderReady) {
      setStatus("waiting_provider");
      return;
    }

    void runAuth();
  }, [
    address,
    isConnected,
    params,
    runAuth,
    walletProviderReady,
  ]);

  // If the provider never becomes available, surface a clear error instead of
  // bouncing an empty callback to the desktop app.
  useEffect(() => {
    if (!isConnected || !address || walletProviderReady || authStarted.current) {
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
  }, [address, isConnected, walletProviderReady]);

  if (!params) {
    return (
      <AuthShell
        title="Sign-in unavailable"
        subtitle={errorMessage}
        status="error"
      />
    );
  }

  if (status === "success" && session) {
    return (
      <AuthSuccessPanel
        session={session}
        callbackUrl={buildSuccessCallbackUrl(params, session)}
        platform={params.platform}
      />
    );
  }

  const statusLabel =
    status === "signing"
      ? "Confirm the message in your wallet…"
      : status === "waiting_provider"
        ? "Wallet connected — preparing signature request…"
        : isConnected
          ? "Preparing wallet signature…"
          : "Connect your wallet to continue";

  return (
    <AuthShell
      title="Sign in to Erebrus VPN"
      subtitle={`Desktop sign-in for ${params.platform}`}
      status={status}
      footer={statusLabel}
    >
      <div className="flex flex-col items-center gap-4">
        <appkit-button />
        {(status === "signing" || status === "waiting_provider") && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusLabel}</span>
          </div>
        )}
        {status === "error" && errorMessage && (
          <p className="text-sm text-red-400 text-center max-w-sm">{errorMessage}</p>
        )}
      </div>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  status,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  status: PageStatus;
  footer?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#050505]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700">
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
        {children}
        {footer && !children && (
          <p className="text-center text-sm text-zinc-500">{footer}</p>
        )}
      </div>
    </div>
  );
}

export default function DesktopVpnAuthPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Sign in to Erebrus VPN"
          subtitle="Loading…"
          status="ready"
        />
      }
    >
      <DesktopVpnAuthContent />
    </Suspense>
  );
}