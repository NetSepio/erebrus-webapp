import type { GatewayNode } from "@/lib/gateway/types";

export type GlobeNodePoint = {
  id: string;
  lat: number;
  lng: number;
};

/**
 * Deterministic small offset (degrees) derived from the node id. Gateway nodes
 * only carry a coarse `region` (e.g. "US"), so every same-region node collapses
 * onto one coordinate. Fanning them out a few degrees keeps each node visible
 * and individually clickable on the globe without moving them off their region.
 */
function jitter(id: string): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = (h % 360) * (Math.PI / 180);
  const mag = 2.6 + (Math.abs(h >> 9) % 18) * 0.2; // ~2.6–6.2°
  return { dLat: Math.sin(a) * mag, dLng: Math.cos(a) * mag };
}

export function toGlobeNodes(nodes: GatewayNode[]): GlobeNodePoint[] {
  // Spread out only when more than one node shares the same coordinate.
  const counts = new Map<string, number>();
  for (const n of nodes) {
    if (n.latitude == null || n.longitude == null) continue;
    const key = `${n.latitude},${n.longitude}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return nodes
    .filter((n) => n.latitude != null && n.longitude != null)
    .map((n) => {
      const key = `${n.latitude},${n.longitude}`;
      const crowded = (counts.get(key) ?? 0) > 1;
      const j = crowded ? jitter(n.id) : { dLat: 0, dLng: 0 };
      return {
        id: n.id,
        lat: Math.max(-85, Math.min(85, n.latitude! + j.dLat)),
        lng: n.longitude! + j.dLng,
      };
    });
}