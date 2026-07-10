import type { DeploymentProfile } from "./types";

export const PROFILE_LABELS: Record<string, string> = {
  standard: "Standard",
  erebrus: "Standard",
  shield: "Shield",
  sentinel: "Sentinel",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  public_network: "Public",
  private_org: "Private",
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  degraded: "Degraded",
  unlicensed: "Unlicensed",
  disabled: "Disabled",
  error: "Error",
  pending: "Pending",
  provisioning: "Provisioning",
};

export function normalizeDeploymentProfile(profile: string | undefined): string {
  const p = (profile ?? "standard").toLowerCase();
  return p === "erebrus" ? "standard" : p;
}

export function profileLabel(profile: string | undefined): string {
  if (!profile) return "Standard";
  return PROFILE_LABELS[profile] ?? profile;
}

export function visibilityLabel(visibility: string | undefined): string {
  if (!visibility) return "Private";
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

export function serviceStatusLabel(status: string | undefined): string {
  if (!status) return "—";
  return SERVICE_STATUS_LABELS[status] ?? status;
}

export function profileBadgeClass(profile: DeploymentProfile | string): string {
  switch (profile) {
    case "shield":
      return "bg-sky-500/15 text-sky-300";
    case "sentinel":
      return "bg-violet-500/15 text-violet-300";
    default:
      return "bg-white/8 text-[var(--text-2)]";
  }
}