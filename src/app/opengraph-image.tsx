import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus — VPN, Firewall, Drop, and AI for the sovereign internet";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OgImage() {
  return ogImageResponse({
    title: "The Sovereign Internet",
    subtitle:
      "Decentralized VPN and firewall protection, local-first Drop transfer, and private AI. Infrastructure owned by the people who run it.",
  });
}
