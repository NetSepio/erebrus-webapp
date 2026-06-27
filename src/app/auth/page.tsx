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
  ALLOWED_DESKTOP_AUTH_REDIRECT_URI,
  AUTH_CALLBACK_FIELDS,
  authenticateEvm,
  authenticateSolana,
  buildAuthCallbackUrl,
  type AuthSession,
} from "@/lib/gateway-auth";

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

const AUTH_FLOW_STEPS = [
  "Connect your Solana or EVM wallet in this browser tab.",
  "Sign a one-time message — this proves you control the wallet. No transaction is sent and no funds move.",
  "Erebrus issues a session token through the gateway.",
  "You are sent back to the requesting app with only the fields listed below.",
] as const;

function formatClientName(platform: string): string {
  const trimmed = platform.trim();
  if (!trimmed) return "the requesting app";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseAuthParams(searchParams: URLSearchParams): AuthParams | null {
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (redirectUri !== ALLOWED_DESKTOP_AUTH_REDIRECT_URI) return null;
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

function AuthFlowExplainer({ clientName }: { clientName: string }) {
  return (
    <div className="mb-6 space-y-4 text-left">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          What happens
        </p>
        <ol className="mt-2 space-y-2 text-sm text-zinc-300">
          {AUTH_FLOW_STEPS.map((step, index) => (
            <li key={step} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                {index + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Shared with {clientName} after redirect
        </p>
        <ul className="mt-2 space-y-2.5">
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
      </div>

      <p className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
        Your private keys and seed phrase never leave your wallet. Erebrus does not
        receive your keys — only a signature and the public wallet address.
      </p>
    </div>
  );
}

function AuthSuccessPanel({
  session,
  callbackUrl,
  platform,
}: {
  session: AuthSession;
  callbackUrl: string;
  platform: string;
}) {
  const clientName = formatClientName(platform);
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
      subtitle={`Returning to ${clientName}`}
      status="success"
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
            Sent to {clientName}
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
  const clientName = params ? formatClientName(params.platform) : "the app";

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
  const [session, setSession] = useState<AuthSession | null>(null);

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
        ? await authenticateSolana(address, solanaWalletProvider!)
        : await authenticateEvm(address, evmWalletProvider!);

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
          : "Connect your wallet below to continue";

  return (
    <AuthShell
      title={`Authorize ${clientName}`}
      subtitle="Wallet sign-in for an external Erebrus client"
      status={status}
    >
      <AuthFlowExplainer clientName={clientName} />

      <div className="flex flex-col items-center gap-4 border-t border-zinc-800 pt-6">
        <p className="text-center text-sm text-zinc-400">
          By connecting and signing, you allow {clientName} to receive the session
          data described above.
        </p>
        <appkit-button />
        {(status === "signing" || status === "waiting_provider") && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusLabel}</span>
          </div>
        )}
        {status === "error" && errorMessage && (
          <p className="max-w-sm text-center text-sm text-red-400">{errorMessage}</p>
        )}
      </div>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status: PageStatus;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
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