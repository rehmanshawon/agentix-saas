"use client";

import Link from "next/link";
import { useState } from "react";

const demoAnswers: Record<string, string> = {
  pricing:
    "Agentix starts at $7/month with 1,000 AI replies, 1 chatbot, and document training. Larger plans add more chatbots, documents, and monthly replies.",
  upload:
    "You upload PDFs or text documents, Agentix processes them into searchable knowledge, and your assistant answers from that information.",
  embed:
    "After creating your chatbot, copy one script tag from the dashboard and paste it into your website.",
  bangladesh:
    "For Bangladesh clients, iLogic Magic can install, train, configure, and maintain the chatbot as an annual managed service.",
};

export default function DemoPage() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi, I am the Agentix demo assistant. Ask about pricing, uploads, embedding, or Bangladesh service.",
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
          "Agentix turns your business documents into a website chatbot with monthly AI reply limits and an embeddable script.",
      },
    ]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            Agentix
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Try the chatbot flow without any Gumroad redirect.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            This lightweight demo shows the kind of document-trained assistant
            Agentix creates. For a production public demo, set up a real demo
            workspace and embed its script on this route.
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
              Ask about pricing, upload, embed, or Bangladesh.
            </p>
          </div>
          <div className="h-[28rem] space-y-4 overflow-y-auto bg-slate-50 p-5">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-6 ${
                  message.sender === "user"
                    ? "ml-auto rounded-tr-sm bg-slate-200 text-slate-900"
                    : "rounded-tl-sm bg-white text-slate-700 shadow-sm"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex gap-3 border-t border-slate-200 p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              placeholder="Ask a question..."
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
