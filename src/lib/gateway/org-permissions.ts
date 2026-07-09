import type { GatewayOrg, GatewayOrgMember } from "./types";

/** Owner always occupies one plan seat; managers and seated members use the rest. */
export function countSeatsUsed(members: Pick<GatewayOrgMember, "role" | "seat_tier">[]): number {
  return members.filter(
    (m) => m.role === "owner" || (m.seat_tier && m.seat_tier !== "free")
  ).length;
}

export function orgHasPaidSeat(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  if (!org) return false;
  if (org.has_paid_seat === true) return true;
  if (org.role === "owner" || org.role === "node_operator") return true;
  return Boolean(org.seat_tier && org.seat_tier !== "free");
}

export function isOrgOwner(org: Pick<GatewayOrg, "role"> | null | undefined): boolean {
  return org?.role === "owner";
}

export function canManageOrgNodes(
  org: Pick<GatewayOrg, "role"> | null | undefined
): boolean {
  const role = org?.role;
  return role === "owner" || role === "node_operator";
}

export function canRevealShieldCredentials(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  return orgHasPaidSeat(org);
}

/** Manager slots left after the owner’s seat (manager = paid seat). */
export function managerSeatsAvailable(
  seatsUsed: number,
  seatsIncluded: number,
  hasPlanSeats: boolean
): boolean {
  return hasPlanSeats && seatsUsed < seatsIncluded;
}