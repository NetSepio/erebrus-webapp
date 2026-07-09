import type { GatewayOrg } from "./types";

/** Owner, manager, or anyone with an assigned VPN seat. */
export function orgHasPaidSeat(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  if (!org) return false;
  if (org.has_paid_seat === true) return true;
  if (org.role === "owner" || org.role === "node_operator") return true;
  return Boolean(org.seat_tier && org.seat_tier !== "free");
}

export function canManageOrgNodes(
  org: Pick<GatewayOrg, "role"> | null | undefined
): boolean {
  const role = org?.role;
  return role === "owner" || role === "admin" || role === "node_operator";
}

export function canRevealShieldCredentials(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  return orgHasPaidSeat(org);
}

/** Manager slots left on the plan (manager = paid seat). */
export function managerSeatsAvailable(
  seatsUsed: number,
  seatsIncluded: number,
  hasPlanSeats: boolean
): boolean {
  return hasPlanSeats && seatsUsed < seatsIncluded;
}