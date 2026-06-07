import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import axios from "axios";
import { monadNftAbi } from "@/contracts/monadNftAbi";

// Use the complete Monad NFT ABI for proper contract interaction
const ERC721_ABI = monadNftAbi;

// Known Monad NFT contracts - add real Monad testnet contract addresses here
const KNOWN_CONTRACTS = [
  "0x35ec701d9d99c34417378742ba0aa568c65ec016", // Your Erebrus NFT contract
  // Add more actual Monad testnet contract addresses here as needed
];

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface NFTToken {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  type: string;
}

async function fetchMetadata(uri: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URLs
    if (uri.startsWith("ipfs://")) {
      uri = uri.replace("ipfs://", "https://ipfs.erebrus.io/ipfs/");
    }

    // Handle data URLs
    if (uri.startsWith("data:application/json")) {
      const jsonString = uri.split(",")[1];
      const decoded = Buffer.from(jsonString, "base64").toString();
      return JSON.parse(decoded);
    }

    const response = await axios.get(uri, {
      timeout: 10000,
      headers: {
        "User-Agent": "Erebrus-NFT-Fetcher/1.0",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch metadata from:", uri, error);
    return null;
  }
}

async function fetchNFTsFromContract(
  provider: ethers.JsonRpcProvider,
  contractAddress: string,
  ownerAddress: string
): Promise<NFTToken[]> {
  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    const nfts: NFTToken[] = [];

    // Get the balance of NFTs for this owner
    const balance = await contract.balanceOf(ownerAddress);
    const balanceNum = Number(balance);

    if (balanceNum === 0) {
      return [];
    }

    // Get contract name
    let contractName = "Unknown Collection";
    try {
      contractName = await contract.name();
    } catch (e) {
      console.warn("Could not fetch contract name for", contractAddress);
    }

    console.log(
      `Contract ${contractAddress} has balance ${balanceNum} for owner ${ownerAddress}`
    );

    let nftsFetched = false;

    // Method 1: Try tokenOfOwnerByIndex (ERC721Enumerable)
    try {
      for (let i = 0; i < Math.min(balanceNum, 50); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
        const tokenIdStr = tokenId.toString();
        console.log(`Found token ID: ${tokenIdStr} at index ${i}`);

        let tokenURI = "";
        try {
          tokenURI = await contract.tokenURI(tokenId);
          console.log(`Token URI for ${tokenIdStr}: ${tokenURI}`);
        } catch (e) {
          console.warn(`Could not fetch tokenURI for token ${tokenIdStr}`);
          continue;
        }

        const metadata = await fetchMetadata(tokenURI);
        const nft: NFTToken = {
          contractAddress,
          tokenId: tokenIdStr,
          name: metadata?.name || `${contractName} #${tokenIdStr}`,
          description: metadata?.description || "",
          image: metadata?.image || "",
          attributes: metadata?.attributes || [],
          type: "MONAD-NFT",
        };

        nfts.push(nft);
        nftsFetched = true;
      }
    } catch (enumerableError) {
      console.log(
        `Contract doesn't support tokenOfOwnerByIndex, using alternative method`
      );

      // Method 2: Check token IDs sequentially
      console.log(`Checking token IDs 0-2000 for ${balanceNum} expected NFTs`);

      for (
        let tokenId = 0;
        tokenId <= 2000 && nfts.length < balanceNum;
        tokenId++
      ) {
        try {
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
            console.log(`Found owned token ID: ${tokenId}`);

            let tokenURI = "";
            let metadata = null;

            try {
              tokenURI = await contract.tokenURI(tokenId);
              if (tokenURI) {
                metadata = await fetchMetadata(tokenURI);
              }
            } catch (e) {
              console.warn(`Could not fetch metadata for token ${tokenId}`);
            }

            const nft: NFTToken = {
              contractAddress,
              tokenId: tokenId.toString(),
              name: metadata?.name || `${contractName} #${tokenId}`,
              description: metadata?.description || `NFT from ${contractName}`,
              image: metadata?.image || "/NFT_Icon.png",
              attributes: metadata?.attributes || [],
              type: "MONAD-NFT",
            };

            nfts.push(nft);
            nftsFetched = true;
            console.log(`Added NFT: ${nft.name}`);
          }
        } catch (ownerError) {
          // Token doesn't exist, continue
          if (tokenId % 500 === 0) {
            console.log(`Checked up to token ID ${tokenId}...`);
          }
          continue;
        }
      }
    }

    if (!nftsFetched && balanceNum > 0) {
      console.warn(
        `Could not fetch any NFTs from contract ${contractAddress} despite balance of ${balanceNum}`
      );
    }

    return nfts;
  } catch (error) {
    console.error(
      `Error fetching NFTs from contract ${contractAddress}:`,
      error
    );
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(address)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    // Connect to Monad testnet
    const provider = new ethers.JsonRpcProvider(
      "https://testnet-rpc.monad.xyz"
    );

    const allNFTs: NFTToken[] = [];

    console.log(
      `Checking ${KNOWN_CONTRACTS.length} contracts for address: ${address}`
    );

    // Fetch NFTs from each known contract
    for (const contractAddress of KNOWN_CONTRACTS) {
      try {
        console.log(`Checking contract: ${contractAddress}`);
        const contractNFTs = await fetchNFTsFromContract(
          provider,
          contractAddress,
          address
        );
        console.log(
          `Found ${contractNFTs.length} NFTs in contract ${contractAddress}`
        );
        allNFTs.push(...contractNFTs);
      } catch (error) {
        console.error(
          `Failed to fetch NFTs from contract ${contractAddress}:`,
          error
        );
        continue;
      }
    }

    console.log(`Total NFTs found: ${allNFTs.length}`);

    return NextResponse.json({
      nfts: allNFTs,
      total: allNFTs.length,
      address: address,
      network: "monad-testnet",
    });
  } catch (error) {
    console.error("Error in Monad NFT API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Monad NFTs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
