"use client";

import Link from "next/link";
import { useState } from "react";

const demoAnswers: Record<string, string> = {
  pricing:
    "Agentix starts at $7/month with 1,000 AI replies, 1 chatbot, and document training. Growth is $15/month (5,000 replies), and Business is $29/month (15,000 replies). No unlimited promises.",
  upload:
    "You upload your company PDFs or text documents (up to 10MB each), Agentix indexes them using high-precision vector embeddings, and your assistant answers strictly based on that knowledge.",
  embed:
    "After creating your chatbot in the dashboard, copy one script tag (<script src='.../widget.js' data-agent-id='...'></script>) and paste it anywhere before </body> on your site.",
  bangladesh:
    "For Bangladesh businesses and institutions, iLogic Magic offers a done-for-you annual service starting from ৳30,000/year. We install, configure, train, and maintain the assistant for you.",
};

export default function DemoPage() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi, I am the Agentix demo assistant. Ask about pricing, uploads, embedding, or our Bangladesh managed service.",
    },
  ]);
  const [input, setInput] = useState("");

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const key = Object.keys(demoAnswers).find((item) =>
      text.toLowerCase().includes(item),
    );

    setMessages((current) => [
      ...current,
      { sender: "user", text },
      {
        sender: "bot",
        text:
          (key && demoAnswers[key]) ||
          "Agentix turns your business documents into a website chatbot with monthly AI reply limits and a 1-script embeddable widget. Try asking about 'pricing', 'upload', 'embed', or 'bangladesh'.",
      },
    ]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
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
            <Link href="/demo" className="text-emerald-700 font-semibold">
              Demo
            </Link>
            <Link href="/pricing" className="hover:text-slate-950">
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

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Interactive Preview
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Test the chatbot flow before deploying to your site.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            This interactive demo illustrates how your assistant responds with
            factual, document-trained information and polite fallback handling.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Build your own
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-500"
            >
              View pricing
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="bg-emerald-600 p-5 text-white">
            <h2 className="text-lg font-semibold">Agentix Demo Assistant</h2>
            <p className="text-sm text-emerald-50">
              Quick prompts: Ask &quot;pricing&quot;, &quot;upload&quot;, &quot;embed&quot;, or &quot;bangladesh&quot;.
            </p>
          </div>
          <div className="h-[28rem] space-y-4 overflow-y-auto bg-slate-50 p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-6 ${
                  message.sender === "user"
                    ? "ml-auto rounded-tr-sm bg-emerald-600 text-white shadow-sm"
                    : "rounded-tl-sm bg-white text-slate-700 shadow-sm border border-slate-200/70"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex gap-3 border-t border-slate-200 p-4 bg-white">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              placeholder="Ask a question (e.g. What is the pricing?)..."
            />
            <button
              onClick={sendMessage}
              className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
