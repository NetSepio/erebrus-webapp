"use client";

import { useEffect, useState } from "react";
import {
  fetchProfile,
  fetchReferrals,
  fetchSocialAccounts,
  sendEmailOtp,
  verifyEmailOtp,
  updateProfile,
} from "@/lib/gateway/client";
import type {
  GatewayProfile,
  GatewayReferral,
  GatewaySocialAccount,
} from "@/lib/gateway/types";
import { truncateAddress } from "@/lib/design";
import { AccentButton, Card } from "@/components/v3/ui";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitNetworkCore } from "@reown/appkit/react";
import Image from "next/image";
import type { HeliusNft } from "@/lib/helius";

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  x: "X",
  telegram: "Telegram",
};

export default function ProfilePage() {
  const { address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetworkCore();
  const [profile, setProfile] = useState<GatewayProfile | null>(null);
  const [referral, setReferral] = useState<GatewayReferral | null>(null);
  const [nfts, setNfts] = useState<HeliusNft[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [socials, setSocials] = useState<GatewaySocialAccount[]>([]);
  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchReferrals().catch(() => null),
      fetchSocialAccounts().catch(() => []),
    ]).then(([p, r, s]) => {
      setProfile(p);
      setName(p.name ?? "");
      setReferral(r);
      setSocials(s);
    });
  }, []);

  useEffect(() => {
    if (!address || !caipNetworkId?.startsWith("solana:")) {
      setNfts([]);
      return;
    }
    fetch(`/api/nfts?wallet=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => setNfts(Array.isArray(data) ? data : []))
      .catch(() => setNfts([]));
  }, [address, caipNetworkId]);

  const saveName = async () => {
    try {
      const updated = await updateProfile({ name });
      setProfile(updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const sendOtp = async () => {
    if (!email) return;
    try {
      await sendEmailOtp(email);
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      await verifyEmailOtp(email, otp);
      toast.success("Email verified");
      const p = await fetchProfile();
      setProfile(p);
    } catch {
      toast.error("Invalid OTP");
    }
  };

  const copyRef = async () => {
    if (!referral?.code) return;
    await navigator.clipboard.writeText(referral.code);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-3.5">
            <div
              className="h-14 w-14 rounded-[15px]"
              style={{ background: "linear-gradient(135deg, #9945FF, #FF6B35)" }}
            />
            <div>
              <div className="text-lg font-semibold">
                {truncateAddress(address ?? profile?.wallet_address ?? "")}
              </div>
              <div className="font-mono text-xs capitalize text-[var(--text-3)]">
                {profile?.chain ?? "wallet"} · joined{" "}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <Row
              label="Wallet"
              value={address || profile?.wallet_address ? "Connected" : "Not linked"}
              ok={!!(address || profile?.wallet_address)}
            />
            {profile?.role === "admin" && <Row label="Platform role" value="Admin" ok />}
            <div className="rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <span className="text-sm text-[var(--text-2)]">Connections</span>
              <div className="mt-2 space-y-1.5">
                {(["google", "apple", "x", "telegram"] as const).map((p) => {
                  const s = socials.find((acct) => acct.provider === p);
                  return (
                    <div key={p} className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-[var(--text-2)]">
                        {PROVIDER_LABEL[p]}
                      </span>
                      {s ? (
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--success)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                          {s.handle ? `@${s.handle}` : "connected"}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-[var(--text-3)]">
                          not connected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 font-mono text-[10px] text-[var(--text-3)]">
                Sign in with Google/Apple using a verified email to auto-link it here.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <span className="text-sm text-[var(--text-2)]">Display name</span>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-32 border-white/10 bg-[var(--surface-2)] text-sm"
                />
                <AccentButton
                  type="button"
                  onClick={saveName}
                  className="!px-3 !py-1.5 !text-xs"
                >
                  Save
                </AccentButton>
              </div>
            </div>
            <div className="rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)]">Email</span>
                {profile?.email_verified ? (
                  <span className="text-sm">{profile.email}</span>
                ) : (
                  <AccentButton className="!px-3 !py-1.5 !text-xs" onClick={() => setOtpSent(false)}>
                    Verify
                  </AccentButton>
                )}
              </div>
              {!profile?.email_verified && (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-white/10 bg-[var(--surface-2)]"
                  />
                  {!otpSent ? (
                    <AccentButton className="w-full !py-2 !text-xs" onClick={sendOtp}>
                      Send OTP
                    </AccentButton>
                  ) : (
                    <>
                      <Input
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="border-white/10 bg-[var(--surface-2)]"
                      />
                      <AccentButton className="w-full !py-2 !text-xs" onClick={verifyOtp}>
                        Verify code
                      </AccentButton>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {nfts.length > 0 && (
          <Card className="p-6">
            <div className="font-semibold">Solana NFTs</div>
            <p className="mt-1 text-xs text-[var(--text-2)]">
              Holding a gating NFT? Refresh entitlement on Subscribe.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {nfts.slice(0, 8).map((nft) => (
                <div
                  key={nft.id}
                  className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]"
                >
                  {nft.image ? (
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      width={120}
                      height={120}
                      className="aspect-square w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center font-mono text-[10px] text-[var(--text-3)]">
                      NFT
                    </div>
                  )}
                  <p className="truncate px-2 py-1 text-[10px]">{nft.name}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {referral?.code && (
          <Card
            className="p-6"
            style={{
              borderColor: "rgba(255,107,53,0.18)",
              background:
                "radial-gradient(ellipse 90% 120% at 0% 0%, rgba(255,107,53,0.1), transparent 55%)",
            }}
          >
            <div className="font-semibold">Invite friends</div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
              Share your code — you both get bonus access when they start a trial.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-[11px] border border-dashed border-[var(--accent)]/35 bg-[var(--accent)]/5 px-3.5 py-3">
              <span className="flex-1 font-mono text-sm tracking-wide text-[var(--accent-hi)]">
                {referral.code}
              </span>
              <AccentButton className="!px-3 !py-1.5 !text-xs" onClick={copyRef}>
                {refCopied ? "Copied" : "Copy"}
              </AccentButton>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <div className="text-xl font-bold">{referral.referees?.length ?? 0}</div>
                <div className="text-[var(--text-3)]">invited</div>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
      <span className="text-sm text-[var(--text-2)]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm">
        {ok && (
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
        )}
        {value}
      </span>
    </div>
  );
}