"use client";

import { useState, useEffect } from "react";

interface IntegrationStatus {
  service: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  message: string;
  icon: React.ReactNode;
  details: string[];
}

interface Webhook {
  id: string;
  url: string;
  events: string;
  isActive: boolean;
  createdAt: string;
}

const StatusDot = ({ status }: { status: string }) => (
  <span
    className={`w-2.5 h-2.5 rounded-full ${
      status === "connected"
        ? "bg-emerald-400 animate-pulse"
        : status === "error"
          ? "bg-red-400"
          : "bg-gray-600"
    }`}
  />
);

const IntegrationCard = ({
  service,
  name,
  status,
  message,
  icon,
  details,
}: IntegrationStatus) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{name}</h3>
          <p className="text-xs text-gray-500">{service}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span
          className={`text-xs font-medium ${
            status === "connected"
              ? "text-emerald-400"
              : status === "error"
                ? "text-red-400"
                : "text-gray-500"
          }`}
        >
          {status === "connected"
            ? "Connected"
            : status === "error"
              ? "Error"
              : "Not Configured"}
        </span>
      </div>
    </div>
    <p className="text-sm text-gray-400 mb-4">{message}</p>
    <div className="space-y-1.5">
      {details.map((detail, idx) => (
        <p key={idx} className="text-xs text-gray-600 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          {detail}
        </p>
      ))}
    </div>
  </div>
);

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"status" | "webhooks" | "api">(
    "status",
  );

  // Webhook state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("chat.message");
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.ilogicmagic.com";

  useEffect(() => {
    fetchIntegrationStatus();
    fetchWebhooks();
  }, []);

  const fetchIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/integrations/status`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations);
      }
    } catch (error) {
      console.error("Failed to fetch integration status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/webhooks`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    }
  };

  const addWebhook = async () => {
    if (!newWebhookUrl) return;
    setIsAddingWebhook(true);
    setWebhookMessage("");

    try {
      const res = await fetch(`${API_URL}/api/admin/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          url: newWebhookUrl,
          events: newWebhookEvents,
        }),
      });

      if (res.ok) {
        setNewWebhookUrl("");
        setNewWebhookEvents("chat.message");
        setWebhookMessage("Webhook added successfully!");
        fetchWebhooks();
      } else {
        setWebhookMessage("Failed to add webhook.");
      }
    } catch (error) {
      setWebhookMessage("Error adding webhook.");
    } finally {
      setIsAddingWebhook(false);
      setTimeout(() => setWebhookMessage(""), 3000);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/admin/webhooks/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const toggleWebhook = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/api/admin/webhooks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_PASSWORD,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage external service connections.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: "status", label: "Service Status" },
          { id: "webhooks", label: "Webhooks" },
          { id: "api", label: "API Access" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service Status */}
      {activeTab === "status" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.service} {...integration} />
          ))}
        </div>
      )}

      {/* Webhooks */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          {/* Add Webhook Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Add Webhook
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://your-app.com/webhook"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
              />
              <select
                value={newWebhookEvents}
                onChange={(e) => setNewWebhookEvents(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="chat.message">Chat Message</option>
                <option value="signup">New Signup</option>
                <option value="subscription">Subscription Change</option>
                <option value="chat.message,signup,subscription">
                  All Events
                </option>
              </select>
              <button
                onClick={addWebhook}
                disabled={isAddingWebhook || !newWebhookUrl}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isAddingWebhook ? "Adding..." : "Add Webhook"}
              </button>
            </div>
            {webhookMessage && (
              <p
                className={`text-sm mt-3 ${webhookMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}
              >
                {webhookMessage}
              </p>
            )}
          </div>

          {/* Webhooks List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">
                Active Webhooks ({webhooks.length})
              </h3>
            </div>
            {webhooks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                <p className="text-sm">No webhooks configured yet.</p>
                <p className="text-xs mt-1">
                  Add a webhook URL to receive real-time event notifications.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {webhook.url}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Events: {webhook.events} · Added{" "}
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() =>
                          toggleWebhook(webhook.id, webhook.isActive)
                        }
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          webhook.isActive ? "bg-emerald-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            webhook.isActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Access */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              API Documentation
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Full API reference with all endpoints, request/response schemas,
              and authentication details.
            </p>
            <a
              href={`${API_URL}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open Swagger Docs
            </a>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              API Key Management
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Generate API keys for programmatic access to your Agentix backend.
              Use these keys in the{" "}
              <code className="text-indigo-400 bg-gray-800 px-1.5 py-0.5 rounded">
                x-api-key
              </code>{" "}
              header.
            </p>
            <button
              disabled
              className="px-6 py-2.5 bg-gray-800 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            >
              API Key Management (Coming Soon)
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Rate Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  endpoint: "POST /api/chat/message",
                  limit: "10 req/min per IP",
                },
                {
                  endpoint: "POST /knowledge/upload",
                  limit: "30 req/min per IP",
                },
                {
                  endpoint: "GET /api/chat/config",
                  limit: "60 req/min per IP",
                },
              ].map((item) => (
                <div key={item.endpoint} className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-indigo-400 font-mono mb-2">
                    {item.endpoint}
                  </p>
                  <p className="text-sm text-gray-300">{item.limit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
