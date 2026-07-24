import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import { SAAS_PRICING } from "@agentix/config/pricing";

const useCases = [
  "Coaching centers",
  "Clinics",
  "E-commerce shops",
  "Local agencies",
  "Real estate teams",
  "Service businesses",
];

const features = [
  {
    title: "Document-trained answers",
    description:
      "Upload PDFs and text documents so your chatbot can answer from your own business information.",
  },
  {
    title: "One-script website embed",
    description:
      "Copy one JavaScript snippet and install the chatbot on almost any website.",
  },
  {
    title: "Workspace isolation",
    description:
      "Each workspace has separate agents, documents, billing, and vector search filters.",
  },
  {
    title: "Usage-capped plans",
    description:
      "Every plan has monthly AI reply, chatbot, and document limits so costs stay predictable.",
  },
  {
    title: "Stripe subscriptions",
    description:
      "Global customers can subscribe through Stripe and manage self-service usage.",
  },
  {
    title: "Managed local setup",
    description:
      "Bangladesh clients can request installation, training, and annual maintenance.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const plans = Object.values(SAAS_PRICING);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-semibold">Agentix</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/demo" className="hover:text-slate-950">
              Demo
            </Link>
            <Link href="/pricing" className="hover:text-slate-950">
              Pricing
            </Link>
            <Link href="/bd" className="hover:text-slate-950">
              Bangladesh
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Affordable AI support for small businesses
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Create a 24/7 AI chatbot from your business PDFs in minutes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Upload your company documents, train your assistant, and embed it
              on your website with one script. Built for small businesses that
              need affordable customer support automation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Build your chatbot
              </Link>
              <Link
                href="/demo"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                Try live demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No unlimited usage promises. Every plan includes clear monthly AI
              reply caps.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-400">
                  agentix.ilogicmagic.com
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_18rem]">
                <div className="rounded-lg bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Knowledge
                  </p>
                  <div className="mt-4 space-y-3">
                    {["Service brochure.pdf", "Pricing policy.pdf", "FAQ.txt"].map(
                      (file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {file}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700">
                            Ready
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                    Upload PDFs, train the assistant, then copy the embed
                    script to your website.
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="bg-emerald-600 p-4 text-white">
                    <p className="font-semibold">Support Assistant</p>
                    <p className="text-xs text-emerald-50">Online now</p>
                  </div>
                  <div className="space-y-3 bg-slate-50 p-4 text-sm">
                    <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-slate-700 shadow-sm">
                      Hi, ask me about our services, pricing, or policies.
                    </div>
                    <div className="ml-8 rounded-2xl rounded-tr-sm bg-slate-200 p-3 text-slate-800">
                      Do you offer weekend appointments?
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-slate-700 shadow-sm">
                      Yes. Based on the uploaded policy, weekend appointments
                      are available from 10 AM to 4 PM.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              Upload PDFs, train AI, embed script.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Upload your documents"],
              ["2", "Train your business assistant"],
              ["3", "Embed it on your website"],
            ].map(([step, title]) => (
              <div key={step} className="border-t-4 border-emerald-600 pt-5">
                <span className="text-sm font-bold text-emerald-700">
                  Step {step}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  A simple workflow for business owners who need a chatbot that
                  answers from real company knowledge.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Use cases
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Built for practical, high-volume customer questions.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">
              Everything needed to go from documents to live assistant.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Cheap plans with clear monthly limits.
              </h2>
            </div>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Compare all pricing
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-slate-950">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">/month</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  ${plan.yearlyPrice}/year available
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-950">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-8">
            {[
              [
                "Do customers need to know which AI model is used?",
                "No. Agentix focuses on business outcomes: accurate answers, clear reply limits, document training, and easy embedding.",
              ],
              [
                "Can Bangladesh clients get installation help?",
                "Yes. The Bangladesh service is handled manually with consultation, setup, document training, and annual maintenance.",
              ],
              [
                "Is usage unlimited?",
                "No. Every plan has monthly AI reply, chatbot, and document limits. Higher usage can be handled through add-ons or custom plans.",
              ],
            ].map(([question, answer]) => (
              <div key={question}>
                <h3 className="text-lg font-semibold text-slate-950">
                  {question}
                </h3>
                <p className="mt-2 leading-7 text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">
              Turn your business documents into a website assistant.
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Start self-service with Stripe, or request a managed local setup
              for Bangladesh.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Start now
            </Link>
            <Link
              href="/bd"
              className="rounded-lg border border-slate-700 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Bangladesh service
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
