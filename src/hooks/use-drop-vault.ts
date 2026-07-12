"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDropVault, putDropVault } from "@/lib/drop/client";
import {
  generateRecoverySecret,
  generateVaultKeyRaw,
  unwrapVaultKey,
  wrapVaultKey,
} from "@/lib/drop/crypto";
import { useWalletAuth } from "@/context/appkit";

export type VaultStatus = "loading" | "absent" | "locked" | "unlocked" | "error";

/**
 * Manages the account Drop vault key entirely in memory. The raw key lives only
 * in a ref for the lifetime of the tab — it is never written to localStorage,
 * React state, logs, or any network request. A page refresh re-locks the vault,
 * requiring the recovery secret (or, in a future step, a session unlock) again.
 */
export function useDropVault() {
  const { isAuthenticated } = useWalletAuth();
  const keyRef = useRef<Uint8Array | null>(null);
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [hasBackup, setHasBackup] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      keyRef.current?.fill(0);
      keyRef.current = null;
      setStatus("locked");
      return;
    }
    setStatus("loading");
    try {
      const backup = await fetchDropVault();
      setHasBackup(!!backup);
      setStatus(keyRef.current ? "unlocked" : backup ? "locked" : "absent");
    } catch {
      setStatus("error");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Create a brand-new vault. Returns the one-time recovery secret to display. */
  const setupVault = useCallback(async (): Promise<string> => {
    const recoverySecret = generateRecoverySecret();
    const rawVaultKey = generateVaultKeyRaw();
    const backup = await wrapVaultKey(rawVaultKey, recoverySecret);
    try {
      await putDropVault(backup);
      keyRef.current?.fill(0);
      keyRef.current = rawVaultKey;
      setHasBackup(true);
      setStatus("unlocked");
      return recoverySecret;
    } catch (error) {
      rawVaultKey.fill(0);
      throw error;
    }
  }, []);

  const unlockVault = useCallback(async (recoverySecret: string): Promise<void> => {
    const backup = await fetchDropVault();
    if (!backup) throw new Error("No vault backup found for this account.");
    let rawVaultKey: Uint8Array;
    try {
      rawVaultKey = await unwrapVaultKey(backup, recoverySecret.trim());
    } catch {
      throw new Error("Incorrect recovery secret.");
    }
    keyRef.current?.fill(0);
    keyRef.current = rawVaultKey;
    setHasBackup(true);
    setStatus("unlocked");
  }, []);

  const lockVault = useCallback(() => {
    keyRef.current?.fill(0);
    keyRef.current = null;
    setStatus(hasBackup ? "locked" : "absent");
  }, [hasBackup]);

  const getVaultKey = useCallback(() => keyRef.current, []);

  return { status, hasBackup, setupVault, unlockVault, lockVault, getVaultKey, refresh };
}
