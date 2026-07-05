import { memberRoleLabel } from "@/lib/gateway/member-labels";
import { orgPlanLabel } from "@/lib/org-plans";
import type { GatewayUserOrgInvite } from "@/lib/gateway/types";

export function inviteOrgTitle(inv: GatewayUserOrgInvite): string {
  return inv.org_display_name?.trim() || inv.org_name;
}

export function invitePreviewLine(inv: GatewayUserOrgInvite): string {
  const title = inviteOrgTitle(inv);
  const role = memberRoleLabel(inv.role);
  const plan = inv.org_plan ? orgPlanLabel(inv.org_plan) : null;
  const inviter = inv.invited_by_name?.trim();
  const parts = [
    `${title} · ${role}`,
    plan,
    inv.member_count != null ? `${inv.member_count} members` : null,
    inviter ? `from ${inviter}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function invitePreviewSubline(inv: GatewayUserOrgInvite): string {
  const bits: string[] = [];
  if (inv.invite_channel === "email") bits.push("Email invite");
  else if (inv.invite_channel === "wallet") bits.push("Wallet invite");
  if (inv.seat_tier && inv.seat_tier !== "free") bits.push(`${inv.seat_tier} VPN seat`);
  if (inv.node_count != null) bits.push(`${inv.node_count} nodes`);
  if (inv.org_slug) bits.push(`@${inv.org_slug}`);
  return bits.join(" · ") || "Workspace invitation";
}

export function formatInviteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}