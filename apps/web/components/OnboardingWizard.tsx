"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OnboardingWizardProps {
  email: string;
  hasDocumentsLoaded: boolean;
  hasAgentConfigured: boolean;
  onDismiss: () => void;
}

const steps = [
  {
    number: 1,
    title: "Upload Documents",
    description: "Train your AI with company PDFs and text files.",
    href: "/dashboard/knowledge",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    number: 2,
    title: "Customize Your Agent",
    description: "Set your AI's name, personality, and brand color.",
    href: "/dashboard/builder",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    title: "Embed on Your Site",
    description: "Copy the script tag and paste it into your website.",
    href: "/dashboard/builder",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
];

export function OnboardingWizard({
  email,
  hasDocumentsLoaded,
  hasAgentConfigured,
  onDismiss,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("onboarding-dismissed");
    if (stored === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("onboarding-dismissed", "true");
    setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, 300);
  };

  if (dismissed) return null;

  const isStepComplete = (stepNumber: number) => {
    if (stepNumber === 1) return hasDocumentsLoaded;
    if (stepNumber === 2) return hasAgentConfigured;
    if (stepNumber === 3) return hasDocumentsLoaded && hasAgentConfigured;
    return false;
  };

  const allComplete =
    isStepComplete(1) && isStepComplete(2) && isStepComplete(3);

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">
              {allComplete
                ? "🎉 You're all set!"
                : "👋 Welcome to Agentix! Let's get you started."}
            </h2>
            <p className="text-indigo-100 text-sm">
              {allComplete
                ? "Your AI agent is live and ready to chat."
                : "Follow these 3 simple steps to launch your AI chatbot."}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Dismiss onboarding"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {steps.map((step) => {
            const complete = isStepComplete(step.number);
            return (
              <button
                key={step.number}
                onClick={() => !complete && router.push(step.href)}
                disabled={complete}
                className={`flex items-start gap-3 p-4 rounded-xl transition-all text-left ${
                  complete
                    ? "bg-white/10 cursor-default"
                    : "bg-white/20 hover:bg-white/30 cursor-pointer"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    complete
                      ? "bg-emerald-400 text-white"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {complete ? (
                    <svg
                      className="w-5 h-5"
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
                  ) : (
                    step.icon
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {complete && (
                      <span className="text-emerald-300 mr-1">✓</span>
                    )}
                    {step.title}
                  </p>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {allComplete && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-sm text-indigo-100">
              ⚡ Your embed code is ready in the{" "}
              <button
                onClick={() => router.push("/dashboard/builder")}
                className="underline font-medium hover:text-white"
              >
                Agent Builder
              </button>
              . Copy it and paste it into any website!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
