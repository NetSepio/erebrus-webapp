import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus Drop — local-first file sharing";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function DropOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus Drop",
    title: "Share files device-to-device",
    subtitle:
      "Turn any phone into a temporary, secure file server on local Wi-Fi. Nothing touches the cloud.",
    tags: ["Local-first", "No cloud", "erebrus.io"],
  });
}
