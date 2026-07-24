import Link from "next/link";
import { LOCAL_SERVICE_PLANS } from "@agentix/config/pricing";

const localUseCases = [
  "Universities",
  "Coaching centers",
  "Agencies",
  "Clinics",
  "E-commerce businesses",
  "Software companies",
];

export default function BangladeshPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Agentix
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Bangladesh managed service
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
                Done-for-you AI chatbot setup for Bangladeshi businesses and
                institutions.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                We install, train, configure, and maintain a 24/7 AI assistant
                for your website for one full year.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:hello@ilogicmagic.com?subject=Agentix Bangladesh consultation"
                  className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Request consultation
                </a>
                <Link
                  href="/demo"
                  className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-500"
                >
                  Book a demo
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                We handle the technical work
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <li>- Website embed installation</li>
                <li>- Chatbot configuration</li>
                <li>- PDF and document training</li>
                <li>- Annual maintenance and updates</li>
                <li>- Manual agreement and invoicing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Why local businesses need this
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Most teams need outcomes, not another setup task.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Many local clients do not have easy website access or technical
                staff. Agentix Bangladesh is packaged as a managed service so
                clients get a working assistant without installing scripts
                themselves.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {localUseCases.map((useCase) => (
                <div
                  key={useCase}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {useCase}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Annual packages</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {LOCAL_SERVICE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-4 text-3xl font-bold">{plan.priceRange}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Includes a monthly AI reply cap.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">FAQ</h2>
          <div className="mt-8 space-y-7">
            <div>
              <h3 className="font-semibold">
                Do clients pay through Stripe?
              </h3>
              <p className="mt-2 text-slate-600">
                No. Bangladesh clients are handled manually through
                consultation, agreement, invoice, bank transfer, cash, or
                manual mobile payment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Do you install it for us?</h3>
              <p className="mt-2 text-slate-600">
                Yes. The local service includes installation support,
                configuration, document training, and maintenance.
              </p>
            </div>
          </div>
          <a
            href="mailto:hello@ilogicmagic.com?subject=Agentix Bangladesh consultation"
            className="mt-10 inline-flex rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Request consultation
          </a>
        </div>
      </section>
    </main>
  );
}
