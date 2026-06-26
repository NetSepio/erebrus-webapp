import type { Metadata } from "next";

export const SITE_URL = "https://erebrus.io";
export const SITE_NAME = "Erebrus";
export const TWITTER_HANDLE = "@NetSepio";

export const DEFAULT_DESCRIPTION =
  "Privacy infrastructure owned by the people who run it. Decentralized VPN and local-first Drop — no clouds, no accounts, no middlemen.";

/** Product-specific social preview images (absolute paths; resolved via metadataBase). */
export const OG_IMAGES = {
  default: "/brand/erebrus-lockup-horizontal.png",
  vpn: "/brand/erebrus-vpn.png",
  drop: "/brand/erebrus-drop.png",
  mark: "/brand/erebrus-mark-256.png",
} as const;

const DEFAULT_KEYWORDS = [
  "Erebrus",
  "decentralized VPN",
  "DePIN",
  "WireGuard VPN",
  "wallet login VPN",
  "local file sharing",
  "Erebrus Drop",
  "NetSepio",
  "privacy network",
  "sovereign internet",
];

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  keywords?: string[];
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  imageAlt,
  imageWidth = 1200,
  imageHeight = 630,
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes("Erebrus") ? title : `${title} | Erebrus`;

  const ogImages = image
    ? [{ url: image, width: imageWidth, height: imageHeight, alt: imageAlt ?? fullTitle }]
    : undefined;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    keywords,
    authors: [{ name: "NetSepio LLC", url: SITE_URL }],
    creator: "NetSepio LLC",
    publisher: "NetSepio LLC",
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Authenticated / utility screens — indexable title for tabs, hidden from crawlers. */
export function appPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return pageMetadata({ title, description, path, noIndex: true });
}