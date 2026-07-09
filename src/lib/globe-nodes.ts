import type { GatewayNode } from "@/lib/gateway/types";

export type GlobeNodePoint = {
  id: string;
  lat: number;
  lng: number;
  /** 0-based slot among the nodes sharing this exact coordinate. */
  groupIndex: number;
  /** How many nodes share this exact coordinate. */
  groupSize: number;
};

const coordKey = (n: GatewayNode) => `${n.latitude},${n.longitude}`;

/**
 * Gateway nodes only carry a coarse region, so every node in a region collapses
 * onto one centroid coordinate. Coordinates stay exact — nudging them by map
 * degrees moves a node hundreds of km (a "Singapore" node would render over
 * Malaysia). Instead each node gets a slot within its co-located group and the
 * renderer fans slots out a few *pixels* on screen.
 */
export function toGlobeNodes(nodes: GatewayNode[]): GlobeNodePoint[] {
  const located = nodes.filter((n) => n.latitude != null && n.longitude != null);

  // Slots are assigned in id order so a node keeps its ring position across
  // refetches regardless of how the API happens to order the list.
  const slots = new Map<string, number>();
  const byCoord = new Map<string, GatewayNode[]>();
  for (const n of located) {
    const group = byCoord.get(coordKey(n));
    if (group) group.push(n);
    else byCoord.set(coordKey(n), [n]);
  }
  for (const group of byCoord.values()) {
    [...group]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((n, i) => slots.set(n.id, i));
  }

  return located.map((n) => ({
    id: n.id,
    lat: n.latitude!,
    lng: n.longitude!,
    groupIndex: slots.get(n.id) ?? 0,
    groupSize: byCoord.get(coordKey(n))?.length ?? 1,
  }));
}

/**
 * The nodes sharing `node`'s exact map coordinate (including itself), in the
 * same order the globe rings them — feeds the detail panel's ‹ › pager.
 */
export function coLocatedNodes(nodes: GatewayNode[], node: GatewayNode): GatewayNode[] {
  if (node.latitude == null || node.longitude == null) return [node];
  const stack = nodes
    .filter((n) => n.latitude === node.latitude && n.longitude === node.longitude)
    .sort((a, b) => a.id.localeCompare(b.id));
  return stack.some((n) => n.id === node.id) ? stack : [node];
}
