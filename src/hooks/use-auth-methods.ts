"use client";

import { useEffect, useState } from "react";
import { fetchAuthMethods, type AuthMethods } from "@/lib/gateway-auth";

const DEFAULT_METHODS: AuthMethods = {
  wallet: true,
  email: false,
  google: false,
  apple: false,
};

export function useAuthMethods() {
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  useEffect(() => {
    fetchAuthMethods()
      .then(setMethods)
      .catch(() => setMethods(DEFAULT_METHODS));
  }, []);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
  const resolved = methods ?? DEFAULT_METHODS;

  return {
    methods: resolved,
    loading: methods === null,
    googleClientId,
    appleClientId,
    googleEnabled: Boolean(googleClientId && resolved.google),
    appleEnabled: Boolean(appleClientId && resolved.apple),
    emailEnabled: resolved.email,
  };
}