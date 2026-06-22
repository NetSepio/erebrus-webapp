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
import { Loader2, Shield } from "lucide-react";
import {
  ALLOWED_VPN_REDIRECT_URI,
  authenticateEvmVpn,
  authenticateSolanaVpn,
  buildVpnCallbackUrl,
} from "@/lib/vpn-gateway-auth";

type AuthParams = {
  redirectUri: string;
  state: string;
  platform: string;
  clientId: string;
};

type PageStatus = "ready" | "signing" | "redirecting" | "error";

function parseAuthParams(searchParams: URLSearchParams): AuthParams | null {
  const redirectUri = searchParams.get("redirect_uri") ?? "";
  const state = searchParams.get("state") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const clientId = searchParams.get("client_id") ?? "";

  if (redirectUri !== ALLOWED_VPN_REDIRECT_URI) return null;
  if (!state || !platform || !clientId) return null;

  return { redirectUri, state, platform, clientId };
}

function redirectWithError(redirectUri: string, state: string, message: string) {
  window.location.href = buildVpnCallbackUrl(redirectUri, {
    error: message,
    state,
  });
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

  const authStarted = useRef(false);

  const runAuth = useCallback(async () => {
    if (!params || !address || authStarted.current) return;
    authStarted.current = true;
    setStatus("signing");
    setErrorMessage("");

    try {
      const isSolanaChain = caipNetworkId?.startsWith("solana:") ?? true;
      let session;
      if (isSolanaChain) {
        if (!solanaWalletProvider) {
          throw new Error("Solana wallet provider is not available");
        }
        session = await authenticateSolanaVpn(address, solanaWalletProvider);
      } else {
        if (!evmWalletProvider) {
          throw new Error("EVM wallet provider is not available");
        }
        session = await authenticateEvmVpn(address, evmWalletProvider);
      }

      setStatus("redirecting");
      window.location.href = buildVpnCallbackUrl(params.redirectUri, {
        token: session.token,
        user_id: session.userId,
        wallet: session.walletAddress,
        role: session.role,
        state: params.state,
      });
    } catch (error) {
      authStarted.current = false;
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      setStatus("error");
      setErrorMessage(message);
      redirectWithError(params.redirectUri, params.state, message);
    }
  }, [
    address,
    caipNetworkId,
    evmWalletProvider,
    params,
    solanaWalletProvider,
  ]);

  useEffect(() => {
    if (!params || !isConnected || !address || authStarted.current) return;
    void runAuth();
  }, [address, isConnected, params, runAuth]);

  if (!params) {
    return (
      <AuthShell
        title="Sign-in unavailable"
        subtitle={errorMessage}
        status="error"
      />
    );
  }

  const statusLabel =
    status === "signing"
      ? "Confirm the message in your wallet…"
      : status === "redirecting"
        ? "Opening Erebrus VPN…"
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
        {(status === "signing" || status === "redirecting") && (
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
                status === "error" ? "text-red-400" : "text-white"
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