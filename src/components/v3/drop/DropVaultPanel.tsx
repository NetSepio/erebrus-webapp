"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, AccentButton, MonoLabel } from "@/components/v3/ui";
import { ShieldCheck, ShieldAlert, Lock, Copy, Check } from "lucide-react";
import type { VaultStatus } from "@/hooks/use-drop-vault";

export function DropVaultPanel({
  status,
  onSetup,
  onUnlock,
  onLock,
}: {
  status: VaultStatus;
  onSetup: () => Promise<string>;
  onUnlock: (secret: string) => Promise<void>;
  onLock: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSetup = async () => {
    setBusy(true);
    try {
      const secret = await onSetup();
      setRevealed(secret);
      toast.success("Encryption vault created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create vault");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!secretInput.trim()) return;
    setBusy(true);
    try {
      await onUnlock(secretInput);
      setSecretInput("");
      toast.success("Vault unlocked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlock vault");
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // One-time recovery secret display shown right after creating a vault.
  if (revealed) {
    return (
      <Card className="border-[var(--accent)]/30 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[var(--accent-hi)]" />
          <MonoLabel>Save your recovery secret</MonoLabel>
        </div>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          This is the <strong>only</strong> way to recover your encrypted files on another
          device or after signing out. We cannot reset or recover it for you. Store it in a
          password manager now.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-[11px] border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-3.5 py-3">
          <code className="flex-1 break-all font-mono text-xs text-[var(--accent-hi)]">
            {revealed}
          </code>
          <button
            type="button"
            onClick={copySecret}
            aria-label="Copy recovery secret"
            className="shrink-0 rounded-md p-1.5 text-[var(--text-3)] hover:text-[var(--accent-hi)]"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
        <label className="mt-3 flex items-start gap-2 text-xs text-[var(--text-2)]">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          I have saved my recovery secret somewhere safe.
        </label>
        <AccentButton
          className="mt-3 w-full !py-2 !text-[13px]"
          disabled={!confirmed}
          onClick={() => {
            setRevealed(null);
            setConfirmed(false);
          }}
        >
          Done
        </AccentButton>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="p-5">
        <MonoLabel>Encryption vault</MonoLabel>
        <p className="mt-3 text-sm text-[var(--text-3)]">Checking vault…</p>
      </Card>
    );
  }

  if (status === "unlocked") {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--success)]" />
            <MonoLabel>Vault unlocked</MonoLabel>
          </div>
          <button
            type="button"
            onClick={onLock}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text)]"
          >
            <Lock size={13} /> Lock
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-3)]">
          Private files are encrypted in your browser before upload.
        </p>
      </Card>
    );
  }

  if (status === "absent") {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--accent-hi)]" />
          <MonoLabel>Set up encryption</MonoLabel>
        </div>
        <p className="mt-3 text-sm text-[var(--text-2)]">
          Create an encryption vault to store private files. Files are encrypted on your
          device; node operators can manage but never read them.
        </p>
        <AccentButton
          className="mt-3 w-full !py-2 !text-[13px]"
          disabled={busy}
          onClick={handleSetup}
        >
          {busy ? "Creating…" : "Create vault"}
        </AccentButton>
      </Card>
    );
  }

  // locked or error
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Lock size={16} className="text-[var(--warn)]" />
        <MonoLabel>Unlock vault</MonoLabel>
      </div>
      <p className="mt-3 text-sm text-[var(--text-2)]">
        Enter your recovery secret to decrypt and upload private files on this device.
      </p>
      <input
        type="password"
        value={secretInput}
        onChange={(e) => setSecretInput(e.target.value)}
        placeholder="Recovery secret"
        className="mt-3 w-full rounded-[11px] border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
      />
      <AccentButton
        className="mt-3 w-full !py-2 !text-[13px]"
        disabled={busy || !secretInput.trim()}
        onClick={handleUnlock}
      >
        {busy ? "Unlocking…" : "Unlock"}
      </AccentButton>
    </Card>
  );
}
