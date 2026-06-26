import { env } from "@/lib/env";

export type HeliusNft = {
  id: string;
  name: string;
  image?: string;
  collection?: string;
};

type DasAsset = {
  id: string;
  content?: {
    metadata?: { name?: string };
    links?: { image?: string };
    json_uri?: string;
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
};

export async function fetchSolanaNfts(wallet: string): Promise<HeliusNft[]> {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${env.heliusApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "erebrus-nfts",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: wallet,
        page: 1,
        limit: 48,
        displayOptions: { showFungible: false },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Helius request failed");

  const json = await res.json();
  const items: DasAsset[] = json?.result?.items ?? [];

  return items.map((asset) => ({
    id: asset.id,
    name: asset.content?.metadata?.name ?? "Unnamed NFT",
    image: asset.content?.links?.image,
    collection: asset.grouping?.find((g) => g.group_key === "collection")?.group_value,
  }));
}