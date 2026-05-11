import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">
                Agentix
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Try Free Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 mb-6">
              🚀 Available Now — One-Time Purchase, Lifetime Access
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Launch Your Own{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                AI Chatbot SaaS
              </span>{" "}
              Business
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              A complete, self-hosted SaaS platform. Upload documents, train
              your AI, embed it anywhere, and charge your clients. Full source
              code included. No recurring fees — you keep 100% of your revenue.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://ilogicmagic.gumroad.com/l/agentix"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
              >
                Buy Now — $149
              </a>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Try Live Demo
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              One-time payment. Free updates for 6 months. 30-day money-back
              guarantee.
            </p>
          </div>

          {/* Hero Mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="flex items-center space-x-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-400">
                  https://agentix.ilogicmagic.com
                </span>
              </div>
              <div className="p-6 flex justify-end">
                <div className="w-80 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">SupportBot</p>
                      <p className="text-xs opacity-80">
                        Online & ready to help
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 opacity-70"
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
                  </div>
                  <div className="p-4 space-y-3 bg-gray-50 h-48">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded-2xl rounded-tl-none text-xs text-gray-700 shadow-sm">
                        Hello! I&apos;m SupportBot. How can I help you today?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-gray-200 p-2.5 rounded-2xl rounded-tr-none text-xs text-gray-800">
                        What is your refund policy?
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-2.5 rounded-2xl rounded-tl-none text-xs text-gray-700 shadow-sm">
                        Our refund policy allows returns within 30 days...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-indigo-50 to-transparent rounded-full opacity-50 -z-10" />
      </section>

      {/* Trusted By / Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Built with industry-standard tools
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 items-center">
            {[
              "Next.js",
              "NestJS",
              "OpenAI",
              "Pinecone",
              "Stripe",
              "Prisma",
              "Tailwind CSS",
              "MySQL",
            ].map((tech) => (
              <span
                key={tech}
                className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Everything You Need to Launch Your AI SaaS
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Agentix comes with everything pre-built — just deploy and start
              selling to your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
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
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                ),
                title: "RAG-Powered AI",
                description:
                  "Upload PDFs and documents. AI answers from real data using OpenAI + Pinecone vector search.",
              },
              {
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
                title: "One-Line Embed",
                description:
                  "Copy a single script tag into any website. Shadow DOM prevents CSS conflicts.",
              },
              {
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                ),
                title: "Stripe Billing Built-In",
                description:
                  "3 subscription tiers with token usage tracking. Webhooks automate upgrades and renewals.",
              },
              {
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ),
                title: "Multi-Tenant Security",
                description:
                  "Isolated workspaces. Vector search filters by ID — data never leaks between customers.",
              },
              {
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
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                ),
                title: "Customizable Widget",
                description:
                  "Set agent name, personality, AI model, and brand colors. Live preview as you build.",
              },
              {
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: "Full Source Code",
                description:
                  "No obfuscation, no encryption. Modify anything. MIT-style license for complete freedom.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors text-indigo-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Simple, One-Time Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Buy once, use forever. No recurring fees, no royalties, no hidden
              costs.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border-2 border-indigo-600 shadow-xl shadow-indigo-100 overflow-hidden">
              <div className="p-8 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-4">
                  Lifetime License
                </div>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">
                    $149
                  </span>
                  <span className="text-xl text-gray-400 ml-2 line-through">
                    $299
                  </span>
                </div>
                <p className="mt-2 text-sm text-emerald-600 font-medium">
                  50% launch discount
                </p>
                <p className="mt-4 text-gray-600 text-sm">
                  One-time payment. No recurring fees. Free updates for 6
                  months.
                </p>
              </div>

              <div className="border-t border-gray-100 px-8 py-6 space-y-3 bg-gray-50">
                {[
                  "Full source code (Next.js + NestJS + Widget)",
                  "Multi-tenant SaaS architecture",
                  "OpenAI + Pinecone RAG pipeline",
                  "Stripe subscription billing",
                  "Embeddable chat widget",
                  "Admin panel for customer management",
                  "Onboarding wizard + password reset",
                  "Deployment guide + Stripe setup guide",
                  "6 months of email support",
                  "Free updates for 6 months",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-emerald-500 flex-shrink-0"
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
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="p-8">
                <a
                  href="https://ilogicmagic.gumroad.com/l/agentix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 px-6 text-center text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Buy Now — $149
                </a>
                <p className="mt-3 text-xs text-gray-400 text-center">
                  30-day money-back guarantee. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "What do I get with my purchase?",
                a: "You get the complete source code for the entire Agentix platform — the Next.js dashboard, NestJS backend API, embeddable chat widget, Prisma database schema, and all configuration files. No code is obfuscated or hidden.",
              },
              {
                q: "Can I sell this to my own clients?",
                a: "Yes! Agentix is designed as a multi-tenant SaaS. Your clients sign up, create their own workspaces, upload their documents, and deploy their own chatbots. You set the pricing and keep 100% of the revenue.",
              },
              {
                q: "What are the server requirements?",
                a: "You need Node.js 18+, MySQL 8.0, and accounts with OpenAI, Pinecone, and Stripe. The app runs on any VPS (DigitalOcean, AWS, etc.) or platforms like Vercel + Railway. Docker Compose is included for local development.",
              },
              {
                q: "Do I need to know how to code?",
                a: "Basic familiarity with Node.js and npm/pnpm is helpful for installation. But the deployment guide walks you through every step. No AI/ML knowledge is required — we handle all the OpenAI and Pinecone integration.",
              },
              {
                q: "What about ongoing costs?",
                a: "Besides the one-time purchase, you only pay for your own usage: OpenAI API calls (roughly $0.01 per chat message), Pinecone vector storage (free tier available), and your MySQL hosting. Stripe takes their standard payment processing fee.",
              },
              {
                q: "Can I customize the code?",
                a: "Absolutely. The code is clean, well-commented, and built with popular frameworks (Next.js, NestJS, Prisma). You can add features, change the design, integrate other AI models, or modify anything you need.",
              },
              {
                q: "Is there a refund policy?",
                a: "Yes. If the product doesn't work as described or you can't get it running, I offer a 30-day money-back guarantee. Just contact me through Gumroad.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to Launch Your AI SaaS Business?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Self-hosted. Full source code. Unlimited clients. One-time payment.
            Start today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://ilogicmagic.gumroad.com/l/agentix"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition-all"
            >
              Buy Now — $149
            </a>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border border-gray-600 rounded-xl hover:bg-gray-800 transition-all"
            >
              Try Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Agentix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
