"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

const BotIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const CodeIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function AgentBuilderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const email = session?.user?.email as string | undefined;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const WIDGET_URL =
    process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3000";

  const [agentName, setAgentName] = useState("SupportBot");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful and polite customer support assistant. Only answer questions using the uploaded company documents.",
  );
  const [model, setModel] = useState("gpt-4o-mini");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [isSaving, setIsSaving] = useState(false);
  const [agentId, setAgentId] = useState<string>("");
  const [hasDocuments, setHasDocuments] = useState<boolean | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const presetColors = [
    "#4F46E5",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#000000",
  ];

  // Check for READY documents
  useEffect(() => {
    const checkDocuments = async () => {
      if (!email) return;
      try {
        const res = await fetch(`${API_URL}/knowledge?email=${email}`);
        if (!res.ok) throw new Error("Failed to check documents");
        const docs = await res.json();
        const readyDocs = docs.filter((d: any) => d.status === "READY");
        setHasDocuments(readyDocs.length > 0);
      } catch {
        setHasDocuments(false);
      }
    };
    checkDocuments();
  }, [email, API_URL]);

  // Fetch existing agent config
  useEffect(() => {
    const fetchAgent = async () => {
      if (!email) return;
      setLoadError(false);
      try {
        const response = await fetch(
          `${API_URL}/api/chat/config?email=${email}`,
        );
        if (!response.ok)
          throw new Error(`Failed to load config (${response.status})`);
        const { agent } = await response.json();
        if (agent) {
          setAgentName(agent.name || "SupportBot");
          setSystemPrompt(agent.systemPrompt || "");
          setModel(agent.modelName || "gpt-4o-mini");
          setPrimaryColor(agent.colorHex || "#4F46E5");
          setAgentId(agent.id);
        }
      } catch (error) {
        console.error("Failed to load agent configuration", error);
        setLoadError(true);
        toast(
          "Could not load your agent configuration. Please refresh the page.",
          "error",
        );
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchAgent();
  }, [email, API_URL, toast]);

  const handleSave = async () => {
    if (!email) {
      toast("Your session has expired. Please log in again.", "error");
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: agentName,
          systemPrompt,
          model,
          primaryColor,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err?.message || `Failed to save configuration (${response.status})`,
        );
      }

      const data = await response.json();
      if (data.agent) setAgentId(data.agent.id);

      toast("Agent configuration saved successfully!", "success");
    } catch (error: any) {
      toast(`Failed to save: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyEmbed = () => {
    const snippet = `<script src="${WIDGET_URL}/widget.js" data-agent-id="${agentId || "YOUR_AGENT_ID"}" defer></script>`;
    navigator.clipboard
      .writeText(snippet)
      .then(() => {
        setCopied(true);
        toast("Embed code copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast("Failed to copy. Please copy manually.", "error");
      });
  };
  // Zero-state: Has documents but no agent created yet
  if (hasDocuments === true && !isLoadingConfig && !agentId && !loadError) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm mt-12">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Create Your First AI Agent
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Your documents are ready! Now let&apos;s give your AI agent a name,
            personality, and brand color so it can start helping your customers.
          </p>
          <button
            onClick={() => {
              // Trigger the save with defaults to create the agent
              handleSave();
            }}
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
          >
            {isSaving ? "Creating..." : "Create My Agent"}
          </button>
          <p className="text-xs text-gray-400 mt-4">
            You can customize everything after creation.
          </p>
        </div>
      </div>
    );
  }
  // Loading state
  if (hasDocuments === null || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading agent builder...</p>
        </div>
      </div>
    );
  }

  // Gate: No documents
  if (hasDocuments === false) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mt-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            No Training Data Found
          </h2>
          <p className="text-yellow-700 mb-6">
            You must upload and process at least one document in your Knowledge
            Base before you can customize your AI agent. The agent needs company
            documents to answer questions accurately.
          </p>
          <button
            onClick={() => router.push("/dashboard/knowledge")}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Knowledge Base
          </button>
        </div>
      </div>
    );
  }

  // Load error banner
  if (loadError) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 mt-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Failed to Load Configuration
          </h2>
          <p className="text-red-700 mb-6">
            We couldn&apos;t load your agent configuration. Please check your
            connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Main builder UI
  const embedSnippet = `<script src="${WIDGET_URL}/widget.js" data-agent-id="${agentId || "YOUR_AGENT_ID"}" defer></script>`;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agent Builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize your AI agent&apos;s behavior and appearance before
          embedding it on your site.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Agent Name
              </label>
              <p className="text-xs text-gray-500 mb-2">
                This is the name users will see in the chat header.
              </p>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                AI Brain (Model)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Select the underlying language model.
              </p>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white"
              >
                <option value="gpt-4o-mini">
                  OpenAI: GPT-4o-Mini (Fastest, Cost-Effective)
                </option>
                <option value="gpt-4o">OpenAI: GPT-4o (Most Capable)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base Prompt (Persona)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Instruct the AI on how it should behave and answer questions.
              </p>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Theme Color
              </label>
              <div className="flex items-center space-x-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      primaryColor === color
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="p-0 border-0 w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <SpinnerIcon />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  "Save Agent Configuration"
                )}
              </button>
            </div>
          </div>

          {/* Embed Code Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center mb-4">
              <CodeIcon />
              <h3 className="ml-2 text-md font-medium text-gray-900">
                Installation Code
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Copy and paste this script tag into the{" "}
              <code className="bg-gray-100 px-1 rounded text-red-500">
                &lt;head&gt;
              </code>{" "}
              or{" "}
              <code className="bg-gray-100 px-1 rounded text-red-500">
                &lt;body&gt;
              </code>{" "}
              of your website.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg relative group">
              <code className="text-sm text-green-400 break-all">
                {embedSnippet}
              </code>
              <button
                onClick={handleCopyEmbed}
                className="absolute top-3 right-3 text-gray-400 hover:text-white bg-gray-800 px-3 py-1 rounded text-xs transition-all"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Widget Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <BotIcon /> <span className="ml-2">Live Widget Preview</span>
            </h3>
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[500px]">
              <div
                className="p-4 text-white flex justify-between items-center transition-colors duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                <div>
                  <h4 className="font-semibold text-lg">{agentName}</h4>
                  <p className="text-xs opacity-80">
                    Online &amp; ready to help
                  </p>
                </div>
                <svg
                  className="w-5 h-5 opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="flex-1 p-4 bg-gray-50 overflow-y-auto space-y-4">
                <div className="flex items-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {agentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none text-sm text-gray-700 shadow-sm max-w-[85%]">
                    Hello! I&apos;m {agentName}. How can I help you today?
                  </div>
                </div>
                <div className="flex items-end justify-end">
                  <div className="bg-gray-200 p-3 rounded-2xl rounded-tr-none text-sm text-gray-800 max-w-[85%]">
                    What is your refund policy?
                  </div>
                </div>
              </div>
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="relative">
                  <input
                    disabled
                    type="text"
                    placeholder="Type a message..."
                    className="w-full bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent rounded-full py-2 pl-4 pr-10 text-sm"
                  />
                  <button
                    className="absolute right-2 top-1.5 p-1 rounded-full"
                    style={{ color: primaryColor }}
                    disabled
                  >
                    <svg
                      className="w-5 h-5 transform rotate-90"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
