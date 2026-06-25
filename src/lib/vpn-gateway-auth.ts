import axios from "axios";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import type { Provider } from "@reown/appkit-adapter-solana/react";

/** Browser → `/api/v2/auth` proxy. Server → gateway from `.env`. */
function authBase(): string {
  if (typeof window !== "undefined") return "/";
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "https://gateway.erebrus.io/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export type VpnAuthChallenge = {
  challengeId: string;
  message: string;
};

export type VpnAuthSession = {
  token: string;
  userId: string;
  role: string;
  walletAddress: string;
};

function parseChallengeResponse(body: unknown): VpnAuthChallenge {
  const record = (body ?? {}) as Record<string, unknown>;
  const challengeId = (record.flow_id ?? "").toString();
  const message = (record.message ?? "").toString();
  if (!challengeId || !message) {
    throw new Error("Gateway did not return a login challenge");
  }
  return { challengeId, message };
}

function buildCompleteBody(
  challengeId: string,
  signature: string,
  publicKey: string
): Record<string, string> {
  return {
    flow_id: challengeId,
    signature,
    public_key: publicKey,
  };
}

export async function fetchVpnAuthChallenge(
  walletAddress: string,
  chain: "sol" | "evm" = "sol"
): Promise<VpnAuthChallenge> {
  const { data } = await axios.get(`${authBase()}api/v2/auth`, {
    params: { wallet_address: walletAddress, chain },
  });
  return parseChallengeResponse(data);
}

export async function completeVpnAuth(
  challengeId: string,
  signature: string,
  publicKey: string
): Promise<VpnAuthSession> {
  const { data } = await axios.post(
    `${authBase()}api/v2/auth`,
    buildCompleteBody(challengeId, signature, publicKey)
  );

  const token = (data?.token ?? "").toString();
  const userId = (data?.user_id ?? "").toString();
  const role = (data?.role ?? "user").toString();
  if (!token || !userId) {
    throw new Error("Gateway did not return a session token");
  }

  return { token, userId, role, walletAddress: publicKey };
}

function signatureBytesToHex(signature: ArrayLike<number>): string {
  return Array.from(signature)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function authenticateSolanaVpn(
  walletAddress: string,
  walletProvider: Provider
): Promise<VpnAuthSession> {
  const { challengeId, message } = await fetchVpnAuthChallenge(
    walletAddress,
    "sol"
  );
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await walletProvider.signMessage(encodedMessage);
  return completeVpnAuth(
    challengeId,
    signatureBytesToHex(signature),
    walletAddress
  );
}

export async function authenticateEvmVpn(
  walletAddress: string,
  walletProvider: Eip1193Provider
): Promise<VpnAuthSession> {
  const { challengeId, message } = await fetchVpnAuthChallenge(
    walletAddress,
    "evm"
  );
  const provider = new BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Connected wallet address does not match the signer");
  }

  let signature = await signer.signMessage(message);
  if (signature.startsWith("0x")) signature = signature.slice(2);

  return completeVpnAuth(challengeId, signature, walletAddress);
}

export const ALLOWED_VPN_REDIRECT_URI = "erebrusvpn://auth";

export function buildVpnCallbackUrl(
  redirectUri: string,
  params: Record<string, string>
): string {
  const uri = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    uri.searchParams.set(key, value);
  }
  return uri.toString();
}