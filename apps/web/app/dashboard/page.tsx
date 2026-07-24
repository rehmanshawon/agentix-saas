"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const cards = [
  {
    title: "Knowledge Base",
    href: "/dashboard/knowledge",
    description: "Upload PDFs and text files to train your AI with RAG.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
    ),
  },
  {
    title: "Agent Builder",
    href: "/dashboard/builder",
    description: "Customize your AI's name, personality, and brand color.",
    icon: (
      <svg
        className="w-8 h-8 text-indigo-600"
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
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const email = session?.user?.email as string | undefined;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [hasDocuments, setHasDocuments] = useState(false);
  const [hasAgent, setHasAgent] = useState(false);
  const [showWizard, setShowWizard] = useState(true);

  useEffect(() => {
    if (!email) return;
    const fetchStatus = async () => {
      try {
        const [docRes, agentRes] = await Promise.all([
          fetch(`${API_URL}/knowledge?email=${email}`),
          fetch(`${API_URL}/api/chat/config?email=${email}`),
        ]);
        if (docRes.ok) {
          const docs = await docRes.json();
          setHasDocuments(docs.some((d: any) => d.status === "READY"));
        }
        if (agentRes.ok) {
          const { agent } = await agentRes.json();
          setHasAgent(!!agent);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard status:", error);
      }
    };
    fetchStatus();
  }, [email, API_URL]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Onboarding Wizard */}
        {showWizard && (
          <OnboardingWizard
            email={email || ""}
            hasDocumentsLoaded={hasDocuments}
            hasAgentConfigured={hasAgent}
            onDismiss={() => setShowWizard(false)}
          />
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Agentix Control Center
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Everything you need to build, train, and deploy your AI chatbot.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Documents
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {hasDocuments ? "✓ Ready" : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Agent Status
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {hasAgent ? "✓ Configured" : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Widget
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {hasAgent && hasDocuments ? "✓ Ready" : "Incomplete"}
            </p>
          </div>
        </div>
        {!showWizard && !hasDocuments && !hasAgent && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center mb-8 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Started Quickly
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              You haven&apos;t set up your AI agent yet. Follow these two simple
              steps to go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/knowledge"
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                1. Upload Documents
              </Link>
              <Link
                href="/dashboard/builder"
                className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                2. Configure Agent
              </Link>
            </div>
          </div>
        )}
        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg group"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
                {card.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
