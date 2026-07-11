import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus Drop — decentralized IPFS storage";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function DropOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus Drop",
    title: "Store files on community IPFS nodes",
    subtitle:
      "Encrypt private files in your browser and share public files with an opaque link.",
    tags: ["IPFS", "Client-side encryption", "erebrus.io"],
  });
}
