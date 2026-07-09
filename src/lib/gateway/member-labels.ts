import type { OrgMemberRole } from "./types";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  node_operator: "Manager",
  viewer: "Viewer",
};

export function memberRoleLabel(role: OrgMemberRole | string | undefined): string {
  if (!role) return "Member";
  return ROLE_LABELS[role] ?? role;
}

export function memberStatusLabel(status: string | undefined): string {
  if (!status || status === "active") return "Active";
  if (status === "invited") return "Invite pending — awaiting first sign-in";
  if (status === "pending") return "Awaiting sign-in";
  return status;
}