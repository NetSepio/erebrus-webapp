"use client";

import { useEffect, useState } from "react";
import { fetchOrgs } from "@/lib/gateway/client";
import {
  resolveEffectiveEntitlement,
  type EffectiveEntitlement,
} from "@/lib/entitlements";
import { useWalletAuth } from "@/context/appkit";

/**
 * Resolve the caller's effective product tier from organization memberships.
 * Organization membership is the sole entitlement source — there is no personal
 * trial/subscription/NFT state.
 */
export function useEntitlement(): {
  entitlement: EffectiveEntitlement;
  loading: boolean;
} {
  const { isAuthenticated } = useWalletAuth();
  const [entitlement, setEntitlement] = useState<EffectiveEntitlement>(() =>
    resolveEffectiveEntitlement([])
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setEntitlement(resolveEffectiveEntitlement([]));
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchOrgs()
      .then((orgs) => {
        if (active) setEntitlement(resolveEffectiveEntitlement(orgs));
      })
      .catch(() => {
        if (active) setEntitlement(resolveEffectiveEntitlement([]));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return { entitlement, loading };
}
