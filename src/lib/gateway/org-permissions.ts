import type { GatewayOrg } from "./types";

export function orgHasPaidSeat(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  if (!org) return false;
  if (org.has_paid_seat === true) return true;
  if (org.role === "owner") return true;
  return Boolean(org.seat_tier && org.seat_tier !== "free");
}

export function canManageOrgNodes(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  if (!org?.role) return false;
  if (org.role === "owner" || org.role === "admin") return true;
  if (org.role === "node_operator") return orgHasPaidSeat(org);
  return false;
}

export function canRevealShieldCredentials(
  org: Pick<GatewayOrg, "role" | "has_paid_seat" | "seat_tier"> | null | undefined
): boolean {
  return orgHasPaidSeat(org);
}