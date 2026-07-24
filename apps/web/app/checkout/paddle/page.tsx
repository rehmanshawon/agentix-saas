"use client";

import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

declare global {
  interface Window {
    Paddle?: {
      Environment?: {
        set: (environment: "sandbox" | "production") => void;
      };
      Initialize: (options: {
        token: string;
        checkout?: {
          settings?: {
            successUrl?: string;
          };
        };
      }) => void;
      Checkout: {
        open: (options: {
          transactionId: string;
          settings?: {
            theme?: "light" | "dark";
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

export default function PaddleCheckoutPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const transactionId = searchParams.get("_ptxn");
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
      ? "sandbox"
      : "production";

  const successUrl = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return `${window.location.origin}/dashboard/builder?upgraded=true`;
  }, []);

  function openCheckout() {
    if (!clientToken) {
      setError("Paddle client token is not configured.");
      return;
    }
    if (!transactionId) {
      setError("Missing Paddle transaction ID.");
      return;
    }
    if (!window.Paddle) {
      setError("Paddle checkout script did not load.");
      return;
    }

    if (environment === "sandbox") {
      window.Paddle.Environment?.set("sandbox");
    }

    window.Paddle.Initialize({
      token: clientToken,
      checkout: {
        settings: {
          successUrl,
        },
      },
    });

    window.Paddle.Checkout.open({
      transactionId,
      settings: {
        theme: "light",
        successUrl,
      },
    });
    setOpened(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={openCheckout}
        onError={() => setError("Failed to load Paddle checkout.")}
      />
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-10 w-10 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        <h1 className="text-2xl font-bold text-slate-950">
          Opening secure checkout
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Paddle will collect card payment securely and activate your Agentix
          plan after the webhook is received.
        </p>
        {opened && (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Checkout opened.
          </p>
        )}
        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {!opened && !error && (
          <button
            onClick={openCheckout}
            className="mt-6 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open checkout
          </button>
        )}
      </div>
    </main>
  );
}
