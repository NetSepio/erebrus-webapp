import type { GatewayOrg, GatewayOrgNode } from "./types";

/** Runtime connectivity — used for VPN/public discovery and globe online counts. */
export function isRuntimeNodeOnline(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "online" || s === "active";
}

/** Org workspace node list: prefer runtime_status over enrollment status. */
export function isOrgNodeOnline(node: Pick<GatewayOrgNode, "status" | "runtime_status">): boolean {
  if (node.runtime_status) {
    return isRuntimeNodeOnline(node.runtime_status);
  }
  // Legacy rows before runtime_status was exposed: only explicit online counts.
  return node.status === "online";
}

/** Human label for org node list — separates enrollment vs connectivity. */
export function orgNodeStatusLabel(node: Pick<GatewayOrgNode, "status" | "runtime_status">): string {
  const runtime = node.runtime_status?.trim();
  if (runtime) {
    if (isRuntimeNodeOnline(runtime)) return "Online";
    if (runtime === "draining") return "Draining";
    return "Offline";
  }
  switch (node.status) {
    case "active":
      return "Enrolled";
    case "degraded":
      return "Degraded";
    case "disabled":
      return "Disabled";
    case "pending":
      return "Pending";
    case "provisioning":
      return "Provisioning";
    default:
      return node.status || "Unknown";
  }
}

export function computeOrgStats(
  members: unknown[],
  nodes: GatewayOrgNode[]
): Pick<GatewayOrg, "member_count" | "node_count" | "online_nodes"> {
  return {
    member_count: members.length,
    node_count: nodes.length,
    online_nodes: nodes.filter((n) => isOrgNodeOnline(n)).length,
  };
}