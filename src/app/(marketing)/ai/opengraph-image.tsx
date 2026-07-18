import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus AI — local LLM runner";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function AiOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus AI",
    title: "Run AI models locally on your network",
    subtitle:
      "Download quantized GGUF models, create custom personas, and turn your desktop into a private AI node.",
    tags: ["Local-first", "GGUF", "erebrus.io"],
  });
}
