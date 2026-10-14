import Link from "next/link";
import { LOCAL_SERVICE_PLANS, SAAS_PRICING } from "@agentix/config/pricing";

export default function PricingPage() {
  const saasPlans = Object.values(SAAS_PRICING);

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
            <Link href="/" className="hover:text-slate-950">
              Home
            </Link>
            <Link href="/demo" className="hover:text-slate-950">
              Demo
            </Link>
            <Link href="/pricing" className="text-emerald-700 font-semibold">
              Pricing
            </Link>
            <Link href="/bd" className="hover:text-slate-950">
              Bangladesh
            </Link>
            <Link href="/contact" className="hover:text-slate-950">
              Contact
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
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Transparent Pricing
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Predictable plans with clear monthly AI reply limits.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Choose self-service Stripe billing for global businesses or our
            done-for-you annual managed service for Bangladesh clients. Never
            unlimited, always cost-controlled.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Global Self-Service SaaS
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Subscription Plans in USD (Stripe)
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {saasPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 shadow-sm flex flex-col justify-between ${
                  plan.isPopular
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  {plan.isPopular && (
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      Popular
                    </span>
                  )}
                  <h3 className="mt-4 text-2xl font-semibold">{plan.name}</h3>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-5xl font-bold">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="pb-1 text-slate-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    or ${plan.yearlyPrice}/year billed annually.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className={`mt-8 block rounded-lg px-5 py-3 text-center text-sm font-semibold transition ${
                    plan.isPopular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  Start with {plan.name}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900">
                Need more volume or additional chatbots?
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Additional 1,000 AI replies can be configured as an add-on, or we
                can tailor a custom enterprise tier.
              </p>
            </div>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 whitespace-nowrap"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Bangladesh Managed Service
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Done-For-You Annual Packages in BDT
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              We install, train with your documents, and maintain your 24/7 AI
              assistant. No Stripe or international card required. Handled
              through consultation, formal agreement, invoice, and bank transfer.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {LOCAL_SERVICE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p className="mt-4 text-3xl font-bold text-emerald-700">
                    {plan.priceRange}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Includes monthly reply cap ({plan.limits.maxMessagesPerMonth.toLocaleString()} replies/mo).
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/contact"
                  className="mt-8 block rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
