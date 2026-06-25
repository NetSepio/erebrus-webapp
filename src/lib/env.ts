/** Centralized public env — only these three are required locally. */
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function gatewayUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ?? "";
  if (!raw) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_GATEWAY_URL");
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export const env = {
  get projectId() {
    return required("NEXT_PUBLIC_PROJECT_ID");
  },
  get gatewayUrl() {
    return gatewayUrl();
  },
  get heliusApiKey() {
    return required("NEXT_PUBLIC_HELIUS_API_KEY");
  },
  /** Solana + EVM mainnet only — not configurable. */
  network: "mainnet" as const,
};