"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadScript } from "@/lib/load-script";

const GOOGLE_GSI_URL = "https://accounts.google.com/gsi/client";
const APPLE_AUTH_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

function generateAppleNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type AppleCredential = {
  idToken: string;
  nonce: string;
  authorizationCode?: string;
};

/**
 * Loads GIS, renders a hidden official button, and proxies clicks to our custom UI.
 * GIS only returns an ID token through the credential callback — not via oauth2 token client.
 */
export function useGoogleSignIn(
  clientId: string | undefined,
  onCredential: (idToken: string) => void,
  enabled: boolean
) {
  const [ready, setReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId || !enabled) return;

    let cancelled = false;
    setReady(false);

    loadScript(GOOGLE_GSI_URL, "google-gsi")
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const token = response.credential?.trim();
            if (token) callbackRef.current(token);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          ux_mode: "popup",
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel?.();
    };
  }, [clientId, enabled]);

  useEffect(() => {
    if (!ready || !btnRef.current || !clientId) return;

    btnRef.current.replaceChildren();
    window.google!.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      width: 280,
    });
  }, [ready, clientId]);

  const signIn = useCallback(() => {
    if (!ready || !btnRef.current) return false;
    const btn = btnRef.current.querySelector('[role="button"]') as HTMLElement | null;
    if (!btn) return false;
    btn.click();
    return true;
  }, [ready]);

  return { ready: ready && !!clientId, signIn, btnRef };
}

/** Loads Apple JS and opens the popup sign-in flow (usePopup: true). */
export function useAppleSignIn(
  clientId: string | undefined,
  onCredential: (credential: AppleCredential) => void,
  enabled: boolean
) {
  const [ready, setReady] = useState(false);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId || !enabled) return;

    let cancelled = false;
    setReady(false);

    loadScript(APPLE_AUTH_URL, "apple-auth-js")
      .then(() => {
        if (cancelled || !window.AppleID?.auth) return;
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
    };
  }, [clientId, enabled]);

  const signIn = useCallback(async () => {
    if (!ready || !clientId || !window.AppleID?.auth) return false;

    const nonce = generateAppleNonce();
    try {
      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI: window.location.origin,
        nonce,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization?.id_token?.trim();
      const authorizationCode = response.authorization?.code?.trim();
      if (!idToken) return false;
      callbackRef.current({ idToken, nonce, authorizationCode });
      return true;
    } catch {
      // User dismissed the popup or Apple returned an error.
      return false;
    }
  }, [ready, clientId]);

  return { ready: ready && !!clientId, signIn };
}