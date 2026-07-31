import {
  EREBRUS_SUITE_TAGS,
  ogImageResponse,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus Drop — local file transfer over Wi-Fi or hotspot";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function DropOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus Drop",
    title: "Move files between nearby devices",
    subtitle:
      "Create a local Drop Room, scan the QR code, and transfer over Wi-Fi or hotspot. IPFS storage is available when you need a persistent link.",
    tags: EREBRUS_SUITE_TAGS,
  });
}
