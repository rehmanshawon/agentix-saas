export type Tier = "STARTER" | "GROWTH" | "ENTERPRISE";

export interface SubscriptionPlan {
  id: Tier;
  name: string;
  monthlyPriceId: string;
  price: number;
  limits: {
    maxAgents: number;
    maxMessagesPerMonth: number;
    maxStorageDocs: number;
  };
  features: string[];
  isPopular?: boolean;
}

export const SAAS_PRICING: Record<Tier, SubscriptionPlan> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyPriceId: "price_1TRFgKIKK1eQ7kyWBe0BpDrq",
    price: 29,
    limits: {
      maxAgents: 1,
      maxMessagesPerMonth: 500,
      maxStorageDocs: 5,
    },
    features: [
      "1 Custom AI Agent",
      "500 AI Messages per month",
      "5 Document Uploads",
      "Embeddable Website Widget",
      "Standard RAG Document Search",
      "Email Support",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    monthlyPriceId: "price_1TRFaQIKK1eQ7kyWkCJz2fFJ",
    price: 79,
    isPopular: true,
    limits: {
      maxAgents: 5,
      maxMessagesPerMonth: 5000,
      maxStorageDocs: 20,
    },
    features: [
      "Everything in Starter",
      "Up to 5 AI Agents",
      "5,000 AI Messages per month",
      "20 Document Uploads",
      "Advanced Webhook Actions",
      "Analytics Dashboard",
      "Priority Support",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Agency",
    monthlyPriceId: "price_1TRFayIKK1eQ7kyWCqcutEml",
    price: 299,
    limits: {
      maxAgents: 20,
      maxMessagesPerMonth: 25000,
      maxStorageDocs: 50,
    },
    features: [
      "Everything in Growth",
      "Up to 20 AI Agents",
      "25,000 AI Messages per month",
      "50 Document Uploads",
      "Multi-User Workspaces",
      "API Access",
      "Priority Human Handoff",
      "Dedicated Support",
    ],
  },
};
