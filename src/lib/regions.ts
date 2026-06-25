/** Approximate map coordinates for gateway node `region` strings. */
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

export function regionCoords(region: string): { lat: number; lng: number; label: string } {
  const key = region.toLowerCase().replace(/\s+/g, "-");
  const hit = REGION_COORDS[key];
  if (hit) return hit;
  const { lat, lng } = hashRegion(region);
  return { lat, lng, label: region };
}

export function uniqueCountries(nodes: Array<{ region: string }>): number {
  return new Set(nodes.map((n) => n.region.split("-")[0] || n.region)).size;
}