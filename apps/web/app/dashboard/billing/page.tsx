"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { SAAS_PRICING } from "@agentix/config/pricing";

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-emerald-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// Tier configuration matching pricing.ts
const TIERS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for small businesses getting started with AI.",
    features: SAAS_PRICING.STARTER.features,
    priceId: SAAS_PRICING.STARTER.monthlyPriceId,
    highlight: false,
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: "$79",
    period: "/mo",
    description: "For growing teams that need more power and flexibility.",
    features: SAAS_PRICING.GROWTH.features,
    priceId: SAAS_PRICING.GROWTH.monthlyPriceId,
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "ENTERPRISE",
    name: "Agency",
    price: "$299",
    period: "/mo",
    description: "For agencies managing multiple clients at scale.",
    features: SAAS_PRICING.ENTERPRISE.features,
    priceId: SAAS_PRICING.ENTERPRISE.monthlyPriceId,
    highlight: false,
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  const email = session?.user?.email as string | undefined;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch current workspace details
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!email) return;
      try {
        const res = await fetch(`${API_URL}/api/chat/config?email=${email}`);
        if (res.ok) {
          const { agent } = await res.json();
          if (agent) {
            const workspaceRes = await fetch(
              `${API_URL}/api/workspace?email=${email}`,
            );
            if (workspaceRes.ok) {
              const { workspace } = await workspaceRes.json();
              setCurrentTier(workspace?.subscriptionTier || null);
              setTokenBalance(workspace?.tokenBalance ?? 0);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load workspace details:", error);
        // Fallback to session data
        setCurrentTier(null);
        setTokenBalance(0);
      } finally {
        setIsLoadingWorkspace(false);
      }
    };
    fetchWorkspace();
  }, [email, API_URL]);

  const handleUpgrade = async (tierId: string, priceId: string) => {
    if (!email) {
      toast("Session expired. Please log in again.", "error");
      return;
    }
    if (currentTier === tierId) {
      toast(`You are already on the ${tierId} plan.`, "info");
      return;
    }

    setIsLoading(tierId);

    try {
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          priceId,
          successUrl: `${window.location.origin}/dashboard/builder?upgraded=true`,
          cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      if (data.url) {
        toast("Redirecting to Stripe checkout...", "info");
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast(`Checkout failed: ${error.message}`, "error");
      setIsLoading(null);
    }
  };

  if (isLoadingWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading billing details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Choose the plan that fits your business. Upgrade or downgrade anytime.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
          <span
            className={`w-2 h-2 rounded-full ${currentTier ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}
          />
          Current plan:{" "}
          <span className="font-bold">{currentTier || "No Plan"}</span>
          {tokenBalance !== null && currentTier && (
            <>
              <span className="text-indigo-300">|</span>
              {tokenBalance.toLocaleString()} tokens remaining
            </>
          )}
        </div>
        {!currentTier && (
          <p className="text-xs text-gray-500 mt-2">
            Subscribe to a plan to enable AI chat features.
          </p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {TIERS.map((tier) => {
          const isCurrentPlan = currentTier === tier.id;
          const isProcessing = isLoading === tier.id;

          return (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all ${
                tier.highlight
                  ? "border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02] md:-translate-y-2"
                  : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
              } ${isCurrentPlan ? "ring-2 ring-emerald-500 ring-offset-2" : ""}`}
            >
              {/* Popular Badge */}
              {tier.badge && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="bg-indigo-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 left-6">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Tier Name */}
              <h3
                className={`text-xl font-semibold mt-4 ${tier.highlight ? "text-indigo-900" : "text-gray-900"}`}
              >
                {tier.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2 flex-1">
                {tier.description}
              </p>

              {/* Price */}
              <div className="mt-6 flex items-baseline">
                <span
                  className={`text-5xl font-extrabold ${tier.highlight ? "text-indigo-900" : "text-gray-900"}`}
                >
                  {tier.price}
                </span>
                <span className="text-xl font-medium text-gray-400 ml-1">
                  {tier.period}
                </span>
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(tier.id, tier.priceId)}
                disabled={isCurrentPlan || isProcessing}
                className={`mt-8 w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                  isCurrentPlan
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : tier.highlight
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                } disabled:opacity-70`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <SpinnerIcon />
                    Redirecting...
                  </span>
                ) : isCurrentPlan ? (
                  "Your Plan"
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-gray-400 mt-12">
        All plans are billed monthly. You can cancel or change your plan at any
        time. Payments are securely processed by Stripe.
      </p>
    </div>
  );
}
