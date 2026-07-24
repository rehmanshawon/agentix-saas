export type Tier = "STARTER" | "GROWTH" | "ENTERPRISE";

export interface PlanLimits {
  maxAgents: number;
  maxMessagesPerMonth: number;
  maxStorageDocs: number;
  maxStorageMb?: number;
  brandingRemoval?: boolean;
}

export interface SubscriptionPlan {
  id: Tier;
  name: string;
  monthlyPriceId: string;
  yearlyPriceId?: string;
  paddleMonthlyPriceId?: string;
  paddleYearlyPriceId?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: string[];
  isPopular?: boolean;
}

export interface LocalServicePlan {
  id: "BD_BASIC" | "BD_STANDARD" | "BD_INSTITUTIONAL";
  name: string;
  priceRange: string;
  limits: PlanLimits;
  features: string[];
  cta: string;
}

export const SAAS_PRICING: Record<Tier, SubscriptionPlan> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID ||
      "price_1TRFgKIKK1eQ7kyWBe0BpDrq",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID,
    paddleMonthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_MONTHLY_PRICE_ID,
    paddleYearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID,
    monthlyPrice: 7,
    yearlyPrice: 69,
    limits: {
      maxAgents: 1,
      maxMessagesPerMonth: 1000,
      maxStorageDocs: 5,
      maxStorageMb: 50,
    },
    features: [
      "1 chatbot",
      "1,000 AI replies per month",
      "5 documents",
      "Embeddable website widget",
      "Agentix branding",
      "Email support",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID ||
      "price_1TRFaQIKK1eQ7kyWkCJz2fFJ",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_YEARLY_PRICE_ID,
    paddleMonthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_GROWTH_MONTHLY_PRICE_ID,
    paddleYearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_GROWTH_YEARLY_PRICE_ID,
    monthlyPrice: 15,
    yearlyPrice: 149,
    isPopular: true,
    limits: {
      maxAgents: 3,
      maxMessagesPerMonth: 5000,
      maxStorageDocs: 25,
      maxStorageMb: 250,
    },
    features: [
      "3 chatbots",
      "5,000 AI replies per month",
      "25 documents",
      "Basic widget customization",
      "Lead-friendly onboarding",
      "Priority email support",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Business",
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
      "price_1TRFayIKK1eQ7kyWCqcutEml",
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID,
    paddleMonthlyPriceId:
      process.env.NEXT_PUBLIC_PADDLE_BUSINESS_MONTHLY_PRICE_ID,
    paddleYearlyPriceId:
      process.env.NEXT_PUBLIC_PADDLE_BUSINESS_YEARLY_PRICE_ID,
    monthlyPrice: 29,
    yearlyPrice: 299,
    limits: {
      maxAgents: 10,
      maxMessagesPerMonth: 15000,
      maxStorageDocs: 75,
      maxStorageMb: 1000,
      brandingRemoval: true,
    },
    features: [
      "10 chatbots",
      "15,000 AI replies per month",
      "75 documents",
      "Branding removal when supported",
      "Higher priority usage",
      "Priority support",
    ],
  },
};

export const LOCAL_SERVICE_PLANS: LocalServicePlan[] = [
  {
    id: "BD_BASIC",
    name: "Basic AI Assistant",
    priceRange: "৳30,000-৳45,000/year",
    limits: {
      maxAgents: 1,
      maxMessagesPerMonth: 1500,
      maxStorageDocs: 10,
    },
    features: [
      "1 chatbot",
      "Website installation support",
      "Document training",
      "Basic annual maintenance",
      "Monthly reply cap",
    ],
    cta: "Request consultation",
  },
  {
    id: "BD_STANDARD",
    name: "Standard AI Assistant",
    priceRange: "৳60,000-৳90,000/year",
    limits: {
      maxAgents: 3,
      maxMessagesPerMonth: 5000,
      maxStorageDocs: 30,
    },
    features: [
      "Up to 3 chatbots",
      "Installation and configuration",
      "Monthly content update support",
      "Lead capture when supported",
      "Dashboard access",
    ],
    cta: "Book a demo",
  },
  {
    id: "BD_INSTITUTIONAL",
    name: "Institutional AI Desk",
    priceRange: "৳120,000-৳250,000/year",
    limits: {
      maxAgents: 10,
      maxMessagesPerMonth: 15000,
      maxStorageDocs: 100,
    },
    features: [
      "Multiple departments or bots",
      "Higher reply limits",
      "Document training workflow",
      "Priority maintenance",
      "Support for larger organizations",
    ],
    cta: "Contact us",
  },
];

export function getTierLimits(tier: string | null): PlanLimits {
  if (!tier) {
    return {
      maxAgents: 1,
      maxMessagesPerMonth: 0,
      maxStorageDocs: 1,
    };
  }

  return (
    SAAS_PRICING[tier as Tier]?.limits || {
      maxAgents: 1,
      maxMessagesPerMonth: 0,
      maxStorageDocs: 1,
    }
  );
}

export function getTierName(tier: string | null): string {
  if (!tier) return "No Plan";
  return SAAS_PRICING[tier as Tier]?.name || tier;
}

export function getMonthlyPrice(tier: string | null): number {
  if (!tier) return 0;
  return SAAS_PRICING[tier as Tier]?.monthlyPrice || 0;
}

export function getPlanByStripePriceId(priceId: string): SubscriptionPlan | null {
  return (
    Object.values(SAAS_PRICING).find(
      (plan) =>
        plan.monthlyPriceId === priceId || plan.yearlyPriceId === priceId,
    ) || null
  );
}

export function getPlanByPaddlePriceId(priceId: string): SubscriptionPlan | null {
  return (
    Object.values(SAAS_PRICING).find(
      (plan) =>
        plan.paddleMonthlyPriceId === priceId ||
        plan.paddleYearlyPriceId === priceId,
    ) || null
  );
}
