import axios from "axios";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import type { Provider } from "@reown/appkit-adapter-solana/react";

const VPN_GATEWAY_BASE =
  process.env.NEXT_PUBLIC_EREBRUS_BASE_URL ||
  process.env.NEXT_PUBLIC_VPN_GATEWAY_URL ||
  "http://212.147.232.36:8080";

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export type VpnAuthChallenge = {
  flowId: string;
  message: string;
};

export type VpnAuthSession = {
  token: string;
  userId: string;
  role: string;
  walletAddress: string;
};

export async function fetchVpnAuthChallenge(
  walletAddress: string,
  chain: "sol" | "evm" = "sol"
): Promise<VpnAuthChallenge> {
  const base = normalizeBase(VPN_GATEWAY_BASE);
  const { data } = await axios.get(`${base}api/v2/auth`, {
    params: {
      wallet_address: walletAddress,
      chain,
    },
  });

  const flowId = (data?.flow_id ?? "").toString();
  const message = (data?.message ?? "").toString();
  if (!flowId || !message) {
    throw new Error("Gateway did not return a login challenge");
  }

  return { flowId, message };
}

export async function completeVpnAuth(
  flowId: string,
  signature: string,
  publicKey: string
): Promise<VpnAuthSession> {
  const base = normalizeBase(VPN_GATEWAY_BASE);
  const { data } = await axios.post(`${base}api/v2/auth`, {
    flow_id: flowId,
    signature,
    public_key: publicKey,
  });

  const token = (data?.token ?? "").toString();
  const userId = (data?.user_id ?? "").toString();
  const role = (data?.role ?? "user").toString();
  if (!token || !userId) {
    throw new Error("Gateway did not return a session token");
  }

  return {
    token,
    userId,
    role,
    walletAddress: publicKey,
  };
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
  const { flowId, message } = await fetchVpnAuthChallenge(walletAddress, "sol");
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await walletProvider.signMessage(encodedMessage);
  const signatureHex = signatureBytesToHex(signature);
  return completeVpnAuth(flowId, signatureHex, walletAddress);
}

export async function authenticateEvmVpn(
  walletAddress: string,
  walletProvider: Eip1193Provider
): Promise<VpnAuthSession> {
  const { flowId, message } = await fetchVpnAuthChallenge(walletAddress, "evm");
  const provider = new BrowserProvider(walletProvider);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Connected wallet address does not match the signer");
  }

  let signature = await signer.signMessage(message);
  if (signature.startsWith("0x")) {
    signature = signature.slice(2);
  }

  return completeVpnAuth(flowId, signature, walletAddress);
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