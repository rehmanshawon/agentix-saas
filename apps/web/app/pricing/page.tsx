import Link from "next/link";
import { LOCAL_SERVICE_PLANS, SAAS_PRICING } from "@agentix/config/pricing";

export default function PricingPage() {
  const saasPlans = Object.values(SAAS_PRICING);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Agentix
          </Link>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Pricing with clear AI reply limits.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Choose self-service Stripe billing for global customers or a
            done-for-you annual service for Bangladesh clients.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Global SaaS
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Self-service plans in USD
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {saasPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-lg border p-6 shadow-sm ${
                  plan.isPopular
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
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
                  ${plan.yearlyPrice}/year for annual billing.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 block rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start with {plan.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Need more volume? Additional 1,000 AI replies can be configured as
            an add-on or handled through a custom plan.
          </p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Bangladesh service
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Done-for-you annual packages in BDT
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Local clients are handled through consultation, agreement,
              invoice, bank transfer, cash, or manual mobile payment. Stripe is
              not required for these packages.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {LOCAL_SERVICE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-4 text-3xl font-bold">{plan.priceRange}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
                <Link
                  href="/bd"
                  className="mt-8 block rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-500"
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
