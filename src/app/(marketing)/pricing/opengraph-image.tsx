import {
  EREBRUS_SUITE_TAGS,
  ogImageResponse,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og";

export const runtime = "edge";
export const alt = "Erebrus Pricing — Private internet for every scale";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function PricingOgImage() {
  return ogImageResponse({
    eyebrow: "Erebrus Pricing",
    title: "Private internet for every scale",
    subtitle:
      "Free private access → Builder plans from $3.99/mo → dedicated nodes, firewall, and sovereign infrastructure for teams and enterprises.",
    tags: EREBRUS_SUITE_TAGS,
  });
}
