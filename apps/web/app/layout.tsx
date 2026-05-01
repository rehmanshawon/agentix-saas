import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Agentix — Build Your Own AI Chatbot SaaS",
  description:
    "Upload company documents, customize your AI agent, and embed it on any website with a single line of code. Fully self-hosted, multi-tenant SaaS platform.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Agentix — Build Your Own AI Chatbot SaaS",
    description:
      "Upload documents, train your AI, and embed a custom chatbot on any website.",
    type: "website",
    siteName: "Agentix",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentix — Build Your Own AI Chatbot SaaS",
    description:
      "Upload documents, train your AI, and embed a custom chatbot on any website.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
