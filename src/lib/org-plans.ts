export const ORG_PLAN_IDS = [
  "personal.basic",
  "personal.starter",
  "personal.pro",
  "business.launch",
  "business.scale",
  "business.enterprise",
] as const;

export type OrgPlanId = (typeof ORG_PLAN_IDS)[number];

export const ORG_PLAN_LABELS: Record<OrgPlanId, string> = {
  "personal.basic": "Personal · Basic",
  "personal.starter": "Personal · Starter",
  "personal.pro": "Personal · Pro",
  "business.launch": "Business · Launch",
  "business.scale": "Business · Scale",
  "business.enterprise": "Business · Enterprise",
};

export function orgPlanLabel(plan?: string | null): string {
  if (!plan) return "Workspace";
  return ORG_PLAN_LABELS[plan as OrgPlanId] ?? plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function isUpgradeablePlan(plan?: string | null): boolean {
  return !plan || plan !== "business.enterprise";
}
