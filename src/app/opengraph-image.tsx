import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus — The sovereign internet";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OgImage() {
  return ogImageResponse({
    title: "The sovereign internet",
    subtitle:
      "Decentralized VPN + local-first Drop. Privacy infrastructure owned by the people who run it.",
  });
}
