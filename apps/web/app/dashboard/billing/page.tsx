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

const TIERS = [
  {
    id: "STARTER",
    name: SAAS_PRICING.STARTER.name,
    monthlyPrice: SAAS_PRICING.STARTER.monthlyPrice,
    yearlyPrice: SAAS_PRICING.STARTER.yearlyPrice,
    description: "Perfect for small businesses getting started with AI.",
    features: SAAS_PRICING.STARTER.features,
    monthlyPriceId: SAAS_PRICING.STARTER.monthlyPriceId,
    yearlyPriceId: SAAS_PRICING.STARTER.yearlyPriceId,
    paddleMonthlyPriceId: SAAS_PRICING.STARTER.paddleMonthlyPriceId,
    paddleYearlyPriceId: SAAS_PRICING.STARTER.paddleYearlyPriceId,
    highlight: false,
  },
  {
    id: "GROWTH",
    name: SAAS_PRICING.GROWTH.name,
    monthlyPrice: SAAS_PRICING.GROWTH.monthlyPrice,
    yearlyPrice: SAAS_PRICING.GROWTH.yearlyPrice,
    description: "For growing teams that need more power and flexibility.",
    features: SAAS_PRICING.GROWTH.features,
    monthlyPriceId: SAAS_PRICING.GROWTH.monthlyPriceId,
    yearlyPriceId: SAAS_PRICING.GROWTH.yearlyPriceId,
    paddleMonthlyPriceId: SAAS_PRICING.GROWTH.paddleMonthlyPriceId,
    paddleYearlyPriceId: SAAS_PRICING.GROWTH.paddleYearlyPriceId,
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "ENTERPRISE",
    name: SAAS_PRICING.ENTERPRISE.name,
    monthlyPrice: SAAS_PRICING.ENTERPRISE.monthlyPrice,
    yearlyPrice: SAAS_PRICING.ENTERPRISE.yearlyPrice,
    description: "For businesses that need more chatbots and higher usage.",
    features: SAAS_PRICING.ENTERPRISE.features,
    monthlyPriceId: SAAS_PRICING.ENTERPRISE.monthlyPriceId,
    yearlyPriceId: SAAS_PRICING.ENTERPRISE.yearlyPriceId,
    paddleMonthlyPriceId: SAAS_PRICING.ENTERPRISE.paddleMonthlyPriceId,
    paddleYearlyPriceId: SAAS_PRICING.ENTERPRISE.paddleYearlyPriceId,
    highlight: false,
  },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  const email = session?.user?.email as string | undefined;
  const API_URL = "/api/backend";
  const billingProvider =
    process.env.NEXT_PUBLIC_BILLING_PROVIDER === "paddle" ? "paddle" : "stripe";

  // Fetch current workspace details
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!email) return;
      try {
        const res = await fetch(
          `${API_URL}/api/workspace?email=${encodeURIComponent(email)}`,
        );
        if (res.ok) {
          const { workspace } = await res.json();
          setCurrentTier(workspace?.subscriptionTier || null);
          setTokenBalance(
            workspace?.usage?.aiRepliesRemaining ??
              workspace?.tokenBalance ??
              null,
          );
        } else {
          throw new Error(`Failed to load workspace (${res.status})`);
        }
      } catch (error) {
        console.error("Failed to load workspace details:", error);
        setCurrentTier(null);
        setTokenBalance(null);
      } finally {
        setIsLoadingWorkspace(false);
      }
    };
    fetchWorkspace();
  }, [email, API_URL]);

  const handleUpgrade = async (tierId: string, priceId?: string) => {
    if (!email) {
      toast("Session expired. Please log in again.", "error");
      return;
    }
    if (currentTier === tierId) {
      toast(`You are already on the ${tierId} plan.`, "info");
      return;
    }
    if (!priceId) {
      toast(
        `The ${billingInterval} ${billingProvider} price is not configured for this plan.`,
        "error",
      );
      return;
    }

    setIsLoading(tierId);

    try {
      const res = await fetch(
        `${API_URL}/billing/${billingProvider === "paddle" ? "paddle/checkout" : "checkout"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            priceId,
            successUrl: `${window.location.origin}/dashboard/builder?upgraded=true`,
            cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      if (data.url) {
        toast(
          `Redirecting to ${data.provider || billingProvider} checkout...`,
          "info",
        );
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
        <p className="mt-2 text-xs text-gray-400">
          Checkout provider:{" "}
          {billingProvider === "paddle" ? "Paddle" : "Stripe"}
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
              {tokenBalance.toLocaleString()} AI replies remaining
            </>
          )}
        </div>
        {!currentTier && (
          <p className="text-xs text-gray-500 mt-2">
            Subscribe to a plan to enable AI chat features.
          </p>
        )}
        <div
          className="mt-5 inline-flex rounded-lg border border-gray-200 bg-white p-1"
          aria-label="Billing interval"
        >
          {(["monthly", "yearly"] as const).map((interval) => (
            <button
              key={interval}
              type="button"
              aria-pressed={billingInterval === interval}
              onClick={() => setBillingInterval(interval)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                billingInterval === interval
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {TIERS.map((tier) => {
          const isCurrentPlan = currentTier === tier.id;
          const isProcessing = isLoading === tier.id;
          const priceId =
            billingProvider === "paddle"
              ? billingInterval === "monthly"
                ? tier.paddleMonthlyPriceId
                : tier.paddleYearlyPriceId
              : billingInterval === "monthly"
                ? tier.monthlyPriceId
                : tier.yearlyPriceId;
          const selectedPrice =
            billingInterval === "monthly"
              ? tier.monthlyPrice
              : tier.yearlyPrice;

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
                  ${selectedPrice}
                </span>
                <span className="text-xl font-medium text-gray-400 ml-1">
                  /{billingInterval === "monthly" ? "mo" : "year"}
                </span>
              </div>
              {!priceId && (
                <p className="mt-2 text-xs text-amber-700">
                  {billingInterval === "yearly"
                    ? "Annual checkout is not configured for this plan yet."
                    : "Checkout is not configured for this plan yet."}
                </p>
              )}

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
                onClick={() => handleUpgrade(tier.id, priceId)}
                disabled={isCurrentPlan || isProcessing || !priceId}
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
        All plans include monthly AI reply limits. Payments are securely
        processed by {billingProvider === "paddle" ? "Paddle" : "Stripe"}.
      </p>
    </div>
  );
}
