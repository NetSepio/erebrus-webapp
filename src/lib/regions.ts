/** ISO 3166-1 alpha-2 country codes from node `region` (e.g. SG, US). */
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  sg: { lat: 1.35, lng: 103.82, label: "Singapore" },
  us: { lat: 39.83, lng: -98.58, label: "United States" },
  gb: { lat: 51.51, lng: -0.13, label: "United Kingdom" },
  uk: { lat: 51.51, lng: -0.13, label: "United Kingdom" },
  de: { lat: 50.11, lng: 8.68, label: "Germany" },
  fr: { lat: 48.86, lng: 2.35, label: "France" },
  nl: { lat: 52.37, lng: 4.9, label: "Netherlands" },
  jp: { lat: 35.68, lng: 139.69, label: "Japan" },
  kr: { lat: 37.57, lng: 126.98, label: "South Korea" },
  in: { lat: 19.08, lng: 72.88, label: "India" },
  au: { lat: -33.87, lng: 151.21, label: "Australia" },
  ca: { lat: 43.65, lng: -79.38, label: "Canada" },
  br: { lat: -23.55, lng: -46.63, label: "Brazil" },
  ae: { lat: 25.2, lng: 55.27, label: "United Arab Emirates" },
  hk: { lat: 22.32, lng: 114.17, label: "Hong Kong" },
  tw: { lat: 25.03, lng: 121.56, label: "Taiwan" },
};

/** Macro regions and cloud-style zone slugs. */
const REGION_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  us: { lat: 39.83, lng: -98.58, label: "United States" },
  eu: { lat: 50.11, lng: 8.68, label: "Europe" },
  ap: { lat: 1.35, lng: 103.82, label: "Asia Pacific" },
  sa: { lat: -23.55, lng: -46.63, label: "South America" },
  af: { lat: -1.29, lng: 36.82, label: "Africa" },
  "us-east": { lat: 40.71, lng: -74.01, label: "New York, US" },
  "us-west": { lat: 37.77, lng: -122.42, label: "San Francisco, US" },
  "eu-west": { lat: 53.35, lng: -6.26, label: "Dublin, IE" },
  "eu-central": { lat: 50.11, lng: 8.68, label: "Frankfurt, DE" },
  "eu-north": { lat: 59.33, lng: 18.07, label: "Stockholm, SE" },
  "ap-south": { lat: 19.08, lng: 72.88, label: "Mumbai, IN" },
  "ap-southeast": { lat: 1.35, lng: 103.82, label: "Singapore" },
  "ap-northeast": { lat: 35.68, lng: 139.69, label: "Tokyo, JP" },
  "sa-east": { lat: -23.55, lng: -46.63, label: "São Paulo, BR" },
  "af-south": { lat: -33.92, lng: 18.42, label: "Cape Town, ZA" },
  "me-central": { lat: 25.2, lng: 55.27, label: "Dubai, AE" },
};

function hashRegion(region: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < region.length; i++) h = (h * 31 + region.charCodeAt(i)) | 0;
  const lat = ((h % 120) - 60) + (h % 17) * 0.1;
  const lng = (((h >> 8) % 360) - 180) + (h % 13) * 0.1;
  return { lat, lng };
}

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, "-");
}

function zoneHintsCountry(base: string, zoneSlug: string): string | null {
  if (base.length === 2 && COUNTRY_COORDS[base]) return base;
  if (/^sg\d*/.test(zoneSlug) || zoneSlug.includes("singapore")) return "sg";
  if (/^us\d*/.test(zoneSlug) || zoneSlug.includes("america")) return "us";
  if (/^eu\d*/.test(zoneSlug)) return "eu";
  if (/^ap-?s(ea|outh)?/.test(zoneSlug) || zoneSlug.includes("singapore")) return "sg";
  return null;
}

export function regionCoords(
  region: string,
  zone?: string
): { lat: number; lng: number; label: string } {
  const base = slug(region);
  const zoneSlug = zone ? slug(zone) : "";
  // Prefer the precise region+zone coordinate (e.g. "us-east" → New York),
  // then ISO country code (e.g. "SG" → Singapore), then macro region, then hash.
  const combined = zoneSlug ? `${base}-${zoneSlug}` : base;
  const hit =
    REGION_COORDS[combined] ??
    REGION_COORDS[base] ??
    COUNTRY_COORDS[base] ??
    (() => {
      const hinted = zoneSlug ? zoneHintsCountry(base, zoneSlug) : null;
      return hinted ? COUNTRY_COORDS[hinted] : undefined;
    })();
  if (hit) return hit;
  const { lat, lng } = hashRegion(combined);
  return { lat, lng, label: regionZoneLabel(region, zone) };
}

// Macro/continent codes that look like ISO-2 but have no national flag.
const NON_COUNTRY = new Set(["AP", "AF", "SA", "NA", "OC", "AS", "ME", "AN"]);

/** Emoji flag for a 2-letter country region code (e.g. "US" → 🇺🇸); null otherwise. */
export function regionFlag(region?: string): string | null {
  if (!region) return null;
  const code = region.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || NON_COUNTRY.has(code)) return null;
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Compact human label for a region/zone pair, e.g. "US · East". */
export function regionZoneLabel(region: string, zone?: string): string {
  const z = zone?.trim();
  if (!z) return region;
  const cap = z.charAt(0).toUpperCase() + z.slice(1);
  return `${region} · ${cap}`;
}

/** Best human location for a node: prefers a mapped city, else region/zone. */
export function nodeGeoLabel(n: {
  city?: string;
  country?: string;
  region: string;
  zone?: string;
}): string {
  if (n.city && n.country && n.city !== n.country) return `${n.city}, ${n.country}`;
  if (n.city && n.city !== n.region) return n.city;
  return regionZoneLabel(n.region, n.zone);
}

export function uniqueCountries(nodes: Array<{ region: string }>): number {
  return new Set(nodes.map((n) => n.region.split("-")[0] || n.region)).size;
}