import {
  EREBRUS_SUITE_TAGS,
  ogImageResponse,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og";

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
    tags: EREBRUS_SUITE_TAGS,
  });
}
