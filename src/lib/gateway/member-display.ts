import type { GatewayOrgInvite, GatewayOrgMember } from "./types";

export function memberPrimaryLabel(member: GatewayOrgMember): string {
  if (member.name?.trim()) return member.name.trim();
  if (member.email?.trim()) return member.email.trim();
  if (member.wallet_address?.trim()) {
    const w = member.wallet_address;
    return w.length > 16 ? `${w.slice(0, 8)}…${w.slice(-6)}` : w;
  }
  return "Member";
}

export function memberSecondaryLabel(member: GatewayOrgMember): string | null {
  if (member.wallet_address?.trim() && member.email?.trim()) {
    const w = member.wallet_address;
    return w.length > 16 ? `${w.slice(0, 8)}…${w.slice(-6)}` : w;
  }
  return null;
}

/** Hide pending email invites that already have a membership row for the same address. */
export function visiblePendingInvites(
  members: GatewayOrgMember[],
  invites: GatewayOrgInvite[]
): GatewayOrgInvite[] {
  const memberEmails = new Set(
    members
      .map((m) => m.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e))
  );
  return invites.filter((inv) => !memberEmails.has(inv.email.trim().toLowerCase()));
}