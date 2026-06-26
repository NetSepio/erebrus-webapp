import { NextRequest, NextResponse } from "next/server";
import { fetchSolanaNfts } from "@/lib/helius";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  try {
    const nfts = await fetchSolanaNfts(wallet);
    return NextResponse.json(nfts, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("Helius NFT fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 });
  }
}