import type { DeploymentProfile } from "./types";

export const PROFILE_LABELS: Record<string, string> = {
  erebrus: "Erebrus VPN",
  shield: "Erebrus Shield",
  sentinel: "Erebrus Sentinel",
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

export function profileLabel(profile: string | undefined): string {
  if (!profile) return "Erebrus VPN";
  return PROFILE_LABELS[profile] ?? profile;
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