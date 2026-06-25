"use client";

import { useEffect, useState } from "react";
import { fetchProfile } from "@/lib/gateway/client";
import { useWalletAuth } from "@/context/appkit";

export function usePlatformAdmin() {
  const { isAuthenticated } = useWalletAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile()
      .then((p) => setIsAdmin(p.role === "admin"))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return { isAdmin, loading };
}