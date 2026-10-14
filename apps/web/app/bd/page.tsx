import Link from "next/link";
import { LOCAL_SERVICE_PLANS } from "@agentix/config/pricing";

const localUseCases = [
  "Universities & Colleges",
  "Coaching Centers & Academies",
  "Digital & Creative Agencies",
  "Medical Clinics & Diagnostic Centers",
  "E-commerce Brands & Online Shops",
  "Software & Tech Companies",
];

export default function BangladeshPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-semibold">Agentix</span>
            <span className="ml-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              BD
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="hover:text-slate-950">
              Home
            </Link>
            <Link href="/demo" className="hover:text-slate-950">
              Demo
            </Link>
            <Link href="/pricing" className="hover:text-slate-950">
              Pricing
            </Link>
            <Link href="/bd" className="text-emerald-700 font-semibold">
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
              href="/contact"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Consultation
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Bangladesh Managed Annual Service
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
                Done-for-you AI chatbot setup for Bangladeshi businesses and
                institutions.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                We install, train, configure, and maintain a 24/7 AI assistant
                for your website for one full year. You don&apos;t have to touch
                any code.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Request consultation
                </Link>
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
                We handle the complete setup
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Website embed installation on your platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Custom chatbot branding and tone configuration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>PDF, brochure, policy, and document training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Annual maintenance and monthly content updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Direct agreement, bank transfer, invoice, or cash</span>
                </li>
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
                Most teams need outcomes, not another technical project.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Many local businesses and institutions in Bangladesh do not have
                in-house developers or easy website code access. Agentix
                Bangladesh is a fully managed service so your team gets a 24/7
                answering assistant without having to install scripts themselves.
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
          <h2 className="text-3xl font-bold">Annual Packages in BDT</h2>
          <p className="mt-2 text-slate-600">
            No credit card or Stripe required. Paid annually via consultation and
            invoicing.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {LOCAL_SERVICE_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p className="mt-4 text-3xl font-bold text-emerald-700">
                    {plan.priceRange}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Includes monthly AI reply cap ({plan.limits.maxMessagesPerMonth.toLocaleString()} replies/mo).
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
                  className="mt-8 block rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-7">
            <div>
              <h3 className="font-semibold text-lg">
                Do local clients need international credit cards or Stripe?
              </h3>
              <p className="mt-2 text-slate-600">
                No. Local Bangladesh clients are handled manually through
                consultation, agreement, invoice, bank transfer, cash, or manual
                mobile payment.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Do you handle the website installation for us?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes. Our team assists with embedding the widget on your site,
                whether you run WordPress, custom PHP, Next.js, Shopify, or any
                other platform.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Can we update our business information later?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes! Depending on your tier, we provide monthly content updates
                and retraining whenever your policies, services, or prices
                change.
              </p>
            </div>
          </div>
          <div className="mt-10 flex gap-4">
            <Link
              href="/contact"
              className="inline-flex rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Request consultation
            </Link>
            <a
              href="mailto:hello@ilogicmagic.com?subject=Agentix Bangladesh consultation"
              className="inline-flex rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
            >
              Email us directly
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
