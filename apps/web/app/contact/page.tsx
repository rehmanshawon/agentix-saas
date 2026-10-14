"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    serviceType: "bd_managed",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            <Link href="/contact" className="text-emerald-700 font-semibold">
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

      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Get in touch
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Let&apos;s discuss your AI chatbot requirements.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Whether you need our done-for-you annual service in Bangladesh or a
            custom high-volume global SaaS tier, our team is ready to assist.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Service Channels
              </h2>
              <p className="mt-3 text-slate-600">
                Choose the best path for your business needs:
              </p>

              <div className="mt-8 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    🇧🇩 Bangladesh Done-For-You Service
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    We install, configure, train with your documents, and
                    maintain your 24/7 AI chatbot for one full year. Annual
                    invoicing, bank transfer, cash, or manual mobile payment.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Packages: ৳30,000 – ৳250,000 / year
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/bd"
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View local packages &rarr;
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    🌐 Global SaaS Custom & High-Volume
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Self-service accounts with dedicated higher volume limits,
                    additional chatbots, document capacities, or agency
                    arrangements.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/pricing"
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View standard SaaS pricing &rarr;
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">
                    Direct Contact Info
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>
                      <strong>Company:</strong> iLogic Magic (
                      <a
                        href="https://www.ilogicmagic.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline"
                      >
                        www.ilogicmagic.com
                      </a>
                      )
                    </li>
                    <li>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:hello@ilogicmagic.com"
                        className="text-emerald-700 hover:underline"
                      >
                        hello@ilogicmagic.com
                      </a>
                    </li>
                    <li>
                      <strong>Response time:</strong> Within 24 business hours
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">
                  Send a Request
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Fill out the form below and we will contact you promptly.
                </p>

                {submitted ? (
                  <div className="mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
                      ✓
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-emerald-950">
                      Request Received!
                    </h3>
                    <p className="mt-2 text-sm text-emerald-800">
                      Thank you, {formData.name || "friend"}. Our team will review
                      your details and get back to you at {formData.email || "your email"} within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Send another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="John Doe"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john@company.com"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Company or Institution Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        placeholder="Acme Inc. / Coaching Academy"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Service Interest *
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) =>
                          setFormData({ ...formData, serviceType: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
                      >
                        <option value="bd_managed">
                          🇧🇩 Bangladesh Done-For-You Annual Service (৳30k-৳250k)
                        </option>
                        <option value="global_custom">
                          🌐 Global SaaS High-Volume / Custom Plan
                        </option>
                        <option value="partnership">
                          🤝 Agency Partnership / Other
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Message / Requirements
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us about your website, document volume, or specific requirements..."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Submit Consultation Request
                    </button>

                    <p className="text-center text-xs text-slate-500">
                      Prefer direct email? Reach us at{" "}
                      <a
                        href="mailto:hello@ilogicmagic.com"
                        className="text-emerald-700 underline"
                      >
                        hello@ilogicmagic.com
                      </a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

