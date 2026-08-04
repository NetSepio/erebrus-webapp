export type BillingPeriod = "annual" | "monthly";

export type PlanId =
  | "personal.basic"
  | "personal.starter"
  | "personal.pro"
  | "business.launch"
  | "business.scale";

export type InheritsFrom = "personal.basic" | "personal.starter" | "business.launch";

export interface TechnicalNote {
  title: string;
  body: string;
}

export interface AdditionalSeats {
  label: string;
  monthly: number;
  annualEffectiveMonthly: number;
}

export interface PlanPricing {
  monthly: number | null;
  annualEffectiveMonthly: number | null;
  annualTotal: number | null;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  pricing: PlanPricing;
  inheritsFrom?: InheritsFrom;
  includes: string[];
  technicalNotes?: TechnicalNote[];
  additionalSeats?: AdditionalSeats;
  bestFor: string[];
  cta: string;
  ctaEnabled: boolean;
  edgeBadge: string;
  seatsIncluded?: { count: number; label: string };
  highlighted?: boolean;
}

export interface EnterprisePlan {
  id: "business.enterprise";
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  includes: string[];
  cta: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "personal.basic",
    name: "Basic",
    subtitle: "Private Access",
    tagline: "Start your private network for free.",
    description:
      "Use limited public nodes, connect to private Org resources, or self-host your own private node.",
    pricing: { monthly: null, annualEffectiveMonthly: null, annualTotal: null },
    includes: [
      "Unlimited Org members",
      "Free user access",
      "Limited public Erebrus nodes",
      "Self-host private nodes",
      "Private key management",
      "Private org resources",
      "Basic public node bandwidth",
      "Community support",
    ],
    bestFor: [
      "Trying Erebrus",
      "Running a private node",
      "Sharing private resources",
      "Free org members",
    ],
    cta: "Start Free",
    ctaEnabled: true,
    edgeBadge: "Free forever",
  },
  {
    id: "personal.starter",
    name: "Starter",
    subtitle: "Builder Access",
    tagline: "Premium access for individuals and builders.",
    description:
      "Get faster public VPN nodes, Gateway API access, and premium Drop and AI services.",
    pricing: {
      monthly: 4.99,
      annualEffectiveMonthly: 3.99,
      annualTotal: 47.88,
    },
    inheritsFrom: "personal.basic",
    seatsIncluded: { count: 1, label: "Starter seat" },
    includes: [
      "Faster public VPN nodes",
      "Higher bandwidth limits",
      "Gateway API key",
      "Premium Drop services",
      "Supported AI services",
      "Build your VPN app",
      "Self-host public/private nodes",
      "Private key management",
    ],
    additionalSeats: {
      label: "Additional Starter seats",
      monthly: 4.99,
      annualEffectiveMonthly: 3.99,
    },
    bestFor: ["Individual VPN users", "Builders", "Developers", "API users"],
    cta: "Upgrade to Starter",
    ctaEnabled: false,
    edgeBadge: "For builders",
  },
  {
    id: "personal.pro",
    name: "Pro",
    subtitle: "Team Network",
    tagline: "Dedicated private infrastructure for teams.",
    description:
      "Get a managed dedicated VPN node, Community Edition Firewall support, and shared Org services for your team.",
    pricing: {
      monthly: 24.99,
      annualEffectiveMonthly: 19.99,
      annualTotal: 239.88,
    },
    inheritsFrom: "personal.starter",
    seatsIncluded: { count: 5, label: "Pro seats" },
    includes: [
      "1 managed dedicated VPN node",
      "Erebrus Shield",
      "DNS allow/block list controls",
      "Private org VPN access",
      "Shared Drop on org nodes",
      "Shared AI on org nodes",
      "Org API keys",
      "BYOC public/private nodes",
      "Service visibility controls",
      "Basic usage dashboard",
    ],
    additionalSeats: {
      label: "Additional Pro seats",
      monthly: 4.99,
      annualEffectiveMonthly: 3.99,
    },
    bestFor: [
      "Families",
      "Small teams",
      "Remote teams",
      "Shared private resources",
    ],
    cta: "Start Pro",
    ctaEnabled: false,
    edgeBadge: "Popular for families",
    highlighted: true,
  },
  {
    id: "business.launch",
    name: "Launch",
    subtitle: "Team Access",
    tagline: "Launch a secure company network.",
    description:
      "Give a growing team private VPN access, a dedicated gateway, Shield protection, and shared company services.",
    pricing: {
      monthly: 24.99,
      annualEffectiveMonthly: 19.99,
      annualTotal: 239.88,
    },
    seatsIncluded: { count: 5, label: "Launch seats" },
    includes: [
      "1 managed dedicated VPN node",
      "Erebrus Shield",
      "DNS allow/block list controls",
      "Private org VPN access",
      "Shared Drop on org nodes",
      "Shared AI on org nodes",
      "Org API keys",
      "BYOC public/private nodes",
      "Service visibility controls",
      "Basic usage dashboard",
    ],
    additionalSeats: {
      label: "Additional Launch seats",
      monthly: 4.99,
      annualEffectiveMonthly: 3.99,
    },
    bestFor: ["Remote teams", "Contractors", "Company resources", "Private AI pilots"],
    cta: "Start Launch Pilot",
    ctaEnabled: false,
    edgeBadge: "For growing teams",
    highlighted: true,
  },
  {
    id: "business.scale",
    name: "Scale",
    subtitle: "Protected Workspace",
    tagline: "Scale access, protection, and private AI.",
    description:
      "Get dedicated VPN infrastructure, Erebrus Sentinel licensing, network-layer monitoring, audit logs, and priority support.",
    pricing: {
      monthly: 99.99,
      annualEffectiveMonthly: 79.99,
      annualTotal: 959.88,
    },
    inheritsFrom: "business.launch",
    seatsIncluded: { count: 25, label: "Scale seats" },
    includes: [
      "3 managed dedicated VPN nodes",
      "Erebrus Sentinel license",
      "Network-layer threat monitoring",
      "AI-assisted threat detection",
      "Real-time policy enforcement",
      "Advanced DNS/firewall controls",
      "Team & service access controls",
      "Business API limits",
      "Audit logs",
      "Advanced usage analytics",
      "Better SLA",
      "Priority support",
      "BYOC + managed nodes",
    ],
    additionalSeats: {
      label: "Additional Scale seats",
      monthly: 9.99,
      annualEffectiveMonthly: 7.99,
    },
    bestFor: ["Startups", "Agencies", "Remote companies", "Security teams"],
    cta: "Start Scale Pilot",
    ctaEnabled: false,
    edgeBadge: "For scaling companies",
  },
];

export const UNLIMITED_ORG_MEMBERS_FEATURE = "Unlimited Org members";
export const UNLIMITED_FREE_ORG_MEMBERS_FEATURE = "Unlimited free Org members";

export const ORG_MEMBERS_NOTE =
  "Org members are unlimited. Paid seats unlock premium access, higher limits, and plan-specific services. Free members can access free public nodes and private Org resources shared with them.";

export const COMMUNITY_EDITION_FEATURE = "Erebrus Shield";

export const COMMUNITY_EDITION_FOOTNOTE =
  "Erebrus Shield may use supported open-source DNS/firewall components such as AdGuard Home, Pi-hole, or compatible alternatives depending on deployment requirements.";

export const ENTERPRISE_PLAN: EnterprisePlan = {
  id: "business.enterprise",
  name: "Enterprise",
  subtitle: "Sovereign Infrastructure",
  tagline: "Custom private internet infrastructure.",
  description:
    "For large teams, regulated environments, and custom deployments. Need help building sovereign infrastructure for your scaling enterprise?",
  includes: [
    "Custom infrastructure",
    "Custom number of seats",
    "Custom dedicated nodes",
    "Custom firewall policies",
    "Custom SLA",
    "Deployment support",
    "Enterprise integrations",
    "High-volume API access",
    "Dedicated support",
  ],
  cta: "Contact Sales",
};

const INHERIT_LABELS: Record<InheritsFrom, string> = {
  "personal.basic": "Basic",
  "personal.starter": "Starter",
  "business.launch": "Launch",
};

export function getInheritsLabel(plan: PricingPlan): string | null {
  if (!plan.inheritsFrom) return null;
  return `Everything in ${INHERIT_LABELS[plan.inheritsFrom]}, plus:`;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getDisplayPrice(plan: PricingPlan, period: BillingPeriod) {
  if (plan.pricing.monthly === null) {
    return { main: "Free", sub: "Free forever" };
  }

  if (period === "annual") {
    return {
      main: `${formatPrice(plan.pricing.annualEffectiveMonthly!)}/mo`,
      sub: `${formatPrice(plan.pricing.annualTotal!)} billed annually`,
    };
  }

  return {
    main: `${formatPrice(plan.pricing.monthly)}/mo`,
    sub: "Billed monthly",
  };
}

export function getAdditionalSeatPrice(
  seats: AdditionalSeats,
  period: BillingPeriod,
): string {
  const amount =
    period === "annual" ? seats.annualEffectiveMonthly : seats.monthly;
  const suffix = period === "annual" ? "paid annually" : "per month";
  return `${formatPrice(amount)}/mo ${suffix}`;
}

export interface ComparisonRow {
  planId: PlanId | "business.enterprise";
  plan: string;
  subtitle: string;
  bestFor: string;
  keyIncludes: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    planId: "personal.basic",
    plan: "Basic",
    subtitle: "Private Access",
    bestFor: "Free users and self-hosters",
    keyIncludes:
      "Free public nodes, self-host private nodes, private key management",
  },
  {
    planId: "personal.starter",
    plan: "Starter",
    subtitle: "Builder Access",
    bestFor: "Individuals and builders",
    keyIncludes: "Faster public nodes, Gateway API key, Drop/AI access",
  },
  {
    planId: "personal.pro",
    plan: "Pro",
    subtitle: "Team Network",
    bestFor: "Teams and families",
    keyIncludes: "5 seats, 1 dedicated VPN node, Community Edition Firewall",
  },
  {
    planId: "business.launch",
    plan: "Launch",
    subtitle: "Team Access",
    bestFor: "Growing and remote teams",
    keyIncludes: "5 seats, 1 dedicated VPN node, Shield protection",
  },
  {
    planId: "business.scale",
    plan: "Scale",
    subtitle: "Protected Workspace",
    bestFor: "Scaling companies",
    keyIncludes: "25 seats, 3 dedicated VPN nodes, Sentinel protection",
  },
  {
    planId: "business.enterprise",
    plan: "Enterprise",
    subtitle: "Sovereign Infrastructure",
    bestFor: "Custom deployments",
    keyIncludes: "Custom infra, SLA, integrations, dedicated support",
  },
];

export function getComparisonPrice(
  planId: PlanId | "business.enterprise",
  period: BillingPeriod,
): string {
  if (planId === "business.enterprise") return "Custom";

  const plan = PRICING_PLANS.find((p) => p.id === planId)!;
  if (plan.pricing.monthly === null) return "Free";

  if (period === "annual") {
    return `${formatPrice(plan.pricing.annualTotal!)}/yr`;
  }
  return `${formatPrice(plan.pricing.monthly)}/mo`;
}

export function getComparisonMonthlyEquivalent(
  planId: PlanId,
  period: BillingPeriod,
): string {
  const plan = PRICING_PLANS.find((p) => p.id === planId)!;
  if (plan.pricing.monthly === null) return "Free";

  if (period === "annual") {
    return `${formatPrice(plan.pricing.annualEffectiveMonthly!)}/mo`;
  }
  return `${formatPrice(plan.pricing.monthly)}/mo`;
}
