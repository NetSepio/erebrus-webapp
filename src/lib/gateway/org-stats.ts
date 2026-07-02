import type { GatewayOrg, GatewayOrgNode } from "./types";

/** Control-plane node heartbeat status treated as online in operator UI. */
export function isOrgNodeOnline(status: string): boolean {
  return status === "active" || status === "online";
}

export function computeOrgStats(
  members: unknown[],
  nodes: GatewayOrgNode[]
): Pick<GatewayOrg, "member_count" | "node_count" | "online_nodes"> {
  return {
    member_count: members.length,
    node_count: nodes.length,
    online_nodes: nodes.filter((n) => isOrgNodeOnline(n.status)).length,
  };
}