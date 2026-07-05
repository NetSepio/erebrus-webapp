export const ORG_PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function orgPlanLabel(plan?: string | null): string {
  if (!plan) return "Workspace";
  return ORG_PLAN_LABELS[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function isUpgradeablePlan(plan?: string | null): boolean {
  return !plan || plan === "basic" || plan === "starter" || plan === "pro";
}