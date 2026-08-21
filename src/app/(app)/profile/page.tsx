"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchProfile,
  fetchRank,
  fetchReferrals,
  fetchSocialAccounts,
  redeemReferralCode,
  requestAccountDeletion,
  sendEmailOtp,
  verifyEmailOtp,
  updateProfile,
  GatewayApiError,
} from "@/lib/gateway/client";
import type {
  GatewayProfile,
  GatewayRank,
  GatewayReferral,
  GatewaySocialAccount,
} from "@/lib/gateway/types";
import { responsiveWalletAddress, userDisplayName } from "@/lib/display-name";
import { AccentButton, ActionButton, Card } from "@/components/v3/ui";
import { ChainBadge } from "@/components/v3/app/ChainBadge";
import { PROFILE_UPDATED_EVENT } from "@/components/v3/app/WalletMenu";
import { ipfsImageUrl, MAX_PROFILE_IMAGE_BYTES } from "@/lib/ipfs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppKit, useAppKitAccount, useAppKitNetworkCore } from "@reown/appkit/react";
import { useWalletAuth } from "@/context/appkit";
import { Camera, Check, Loader2, Pencil, X } from "lucide-react";
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
  const { open: openAppKit } = useAppKit();
  const { isAuthenticating, linkWallet } = useWalletAuth();
  const [profile, setProfile] = useState<GatewayProfile | null>(null);
  const [referral, setReferral] = useState<GatewayReferral | null>(null);
  const [rank, setRank] = useState<GatewayRank | null>(null);
  const [nfts, setNfts] = useState<HeliusNft[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [socials, setSocials] = useState<GatewaySocialAccount[]>([]);
  const [deletingAccount, setDeletingAccount] = useState(false);
  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchRank().catch(() => null),
      fetchReferrals().catch(() => null),
      fetchSocialAccounts().catch(() => []),
    ]).then(([p, xp, r, s]) => {
      setProfile(p);
      setRank(xp);
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

  const startEditName = () => {
    setName(profile?.name ?? "");
    setEditingName(true);
  };

  const saveName = async () => {
    const next = name.trim();
    if (!next) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateProfile({ name: next });
      setProfile(updated);
      setEditingName(false);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile-image", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { cid?: string; error?: string };
      if (!res.ok || !data.cid) throw new Error(data.error || "Upload failed");
      const updated = await updateProfile({ profile_picture: data.cid });
      // Keep the fresh CID even if the gateway echoes an older profile shape.
      setProfile({ ...updated, profile_picture: updated.profile_picture ?? data.cid });
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Attach a wallet to THIS account: connect via AppKit, then one signature
  // links it on the gateway (never a separate wallet login).
  const connectWallet = async () => {
    if (!address) {
      openAppKit();
      return;
    }
    if (await linkWallet()) {
      const p = await fetchProfile().catch(() => null);
      if (p) setProfile(p);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
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

  const redeemInvite = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setRedeeming(true);
    try {
      const updated = await redeemReferralCode(code);
      setReferral(updated);
      setInviteCode("");
      toast.success("Invite code applied — you both earn XP");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : "Could not apply that code"
      );
    } finally {
      setRedeeming(false);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm("Request account deletion? This will schedule your account for deletion; an admin will process it.")) return;
    setDeletingAccount(true);
    try {
      const res = await requestAccountDeletion();
      toast.success(res.message || "Account deletion request submitted");
    } catch (err) {
      toast.error(
        err instanceof GatewayApiError ? err.message : "Failed to request account deletion"
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // Gateway truth: only a wallet attached to the account counts as linked.
  const walletAddress = (profile ? profile.wallet_address : address || "").trim();
  const walletDisplay = walletAddress
    ? responsiveWalletAddress(walletAddress)
    : null;
  const needsLink = !!profile && !profile.wallet_address && !!address;
  const avatarUrl = ipfsImageUrl(profile?.profile_picture);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change profile photo (max 5MB)"
              aria-label="Change profile photo"
              className="group relative block h-14 w-14 shrink-0 overflow-hidden rounded-[15px]"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 object-cover"
                />
              ) : (
                <div
                  className="h-14 w-14"
                  style={{ background: "linear-gradient(135deg, #9945FF, #FF6B35)" }}
                />
              )}
              <span
                className={`absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity ${
                  uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
            <div className="min-w-0 flex-1">
              {!editingName ? (
                <button
                  type="button"
                  onClick={startEditName}
                  title="Edit name"
                  className="group flex min-w-0 max-w-full items-center gap-2 text-left"
                >
                  <span className="truncate text-lg font-semibold">
                    {userDisplayName(profile, walletAddress)}
                  </span>
                  <Pencil
                    size={13}
                    className="shrink-0 text-[var(--text-3)] opacity-60 transition-opacity group-hover:opacity-100"
                  />
                </button>
              ) : (
                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveName();
                  }}
                >
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingName(false)}
                    placeholder="Your name"
                    className="h-8 w-44 border-white/10 bg-[var(--surface-2)] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    aria-label="Save name"
                    className="rounded-md p-1.5 text-[var(--success)] transition-colors hover:bg-white/[0.06] disabled:opacity-60"
                  >
                    {savingName ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    aria-label="Cancel name edit"
                    className="rounded-md p-1.5 text-[var(--text-3)] transition-colors hover:bg-white/[0.06]"
                  >
                    <X size={14} />
                  </button>
                </form>
              )}
              <div className="mt-1">
                <ChainBadge chain={profile?.chain} size="md" />
              </div>
              <div className="mt-1 font-mono text-xs text-[var(--text-3)]">
                Joined{" "}
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
            <div className="rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <span className="text-sm text-[var(--text-2)]">Wallet</span>
              {walletDisplay ? (
                <div className="mt-2 space-y-1">
                  <div className="hidden break-all font-mono text-sm md:block">
                    {walletDisplay.desktop}
                  </div>
                  <div className="font-mono text-sm md:hidden">{walletDisplay.mobile}</div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    Linked
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--text-3)]">Not linked</span>
                  <AccentButton
                    className="!px-3 !py-1.5 !text-xs"
                    onClick={connectWallet}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating
                      ? "Signing…"
                      : needsLink
                        ? "Sign to link"
                        : "Connect wallet"}
                  </AccentButton>
                </div>
              )}
            </div>
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

            <div className="rounded-[11px] border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <span className="text-sm text-[var(--text-2)]">Account deletion</span>
              <p className="mt-1 text-xs text-[var(--text-3)]">
                Request your account be deleted. You must have a verified email and no active org ownership or memberships.
              </p>
              <ActionButton
                variant="danger"
                className="mt-2"
                onClick={requestDeletion}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Requesting…" : "Request account deletion"}
              </ActionButton>
            </div>
          </div>
        </Card>

        {nfts.length > 0 && (
          <Card className="p-6">
            <div className="font-semibold">Solana NFTs</div>
            <p className="mt-1 text-xs text-[var(--text-2)]">
              NFTs held by your connected wallet.
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

        {rank && (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">Lifetime XP</div>
                <p className="mt-1 text-xs text-[var(--text-2)]">
                  Account rank XP from qualified referrals, node uptime, and other platform activity.
                  This is separate from Genesis Season cash rewards.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--accent-hi)]">
                  {rank.xp_earned.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                  XP earned
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-lg font-semibold">{rank.tier_name}</div>
                <div className="text-[11px] text-[var(--text-3)]">Tier {rank.tier}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-lg font-semibold">{rank.xp_claimable.toLocaleString()}</div>
                <div className="text-[11px] text-[var(--text-3)]">Claimable XP</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-lg font-semibold">
                  {(rank.breakdown_by_kind?.referral_qualified ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[var(--text-3)]">Referral XP</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-lg font-semibold">
                  {(rank.breakdown_by_kind?.operator_uptime_day ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[var(--text-3)]">Node uptime XP</div>
              </div>
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
            <div className="font-semibold">Invite friends, earn XP</div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-2)]">
              Share your code — when a friend creates their workspace, you both earn lifetime XP
              toward account rank and perks.
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
                <div className="text-xl font-bold">{referral.referred_count ?? 0}</div>
                <div className="text-[var(--text-3)]">invited</div>
              </div>
              <div>
                <div className="text-xl font-bold">
                  {referral.recent?.filter((r) => r.qualified).length ?? 0}
                </div>
                <div className="text-[var(--text-3)]">qualified</div>
              </div>
            </div>
            {referral.referral_bound ? (
              <p className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-[var(--text-3)]">
                {referral.referred_by ? `Invited by ${referral.referred_by}` : "Invite code applied"}
              </p>
            ) : (
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <span className="text-xs text-[var(--text-2)]">
                  Were you invited? Enter the code — you both earn XP.
                </span>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && redeemInvite()}
                    className="h-8 border-white/10 bg-[var(--surface-2)] font-mono text-sm uppercase tracking-widest"
                  />
                  <AccentButton
                    className="!px-3 !py-1.5 !text-xs"
                    onClick={redeemInvite}
                    disabled={redeeming || !inviteCode.trim()}
                  >
                    {redeeming ? "Applying…" : "Apply"}
                  </AccentButton>
                </div>
              </div>
            )}
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
