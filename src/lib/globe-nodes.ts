import type { GatewayNode } from "@/lib/gateway/types";

export type GlobeNodePoint = {
  id: string;
  lat: number;
  lng: number;
};

export function toGlobeNodes(nodes: GatewayNode[]): GlobeNodePoint[] {
  return nodes
    .filter((n) => n.latitude != null && n.longitude != null)
    .map((n) => ({
      id: n.id,
      lat: n.latitude!,
      lng: n.longitude!,
    }));
}