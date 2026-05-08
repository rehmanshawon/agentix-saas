"use client";

import { useState, useEffect } from "react";

interface AdminSettings {
  // Platform
  platformName: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;

  // Subscription
  trialEnabled: boolean;
  trialDays: number;
  trialTokens: number;

  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;

  // Security
  adminPassword: string;
  rateLimitPerMin: number;
  sessionTimeout: number;

  // Billing
  stripeMode: string;
  stripeTestKey: string;
  stripeTestSecret: string;
  stripeLiveKey: string;
  stripeLiveSecret: string;
  stripeWebhookSecret: string;
}

const TabButton = ({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent"
    }`}
  >
    {icon}
    {label}
  </button>
);

const InputField = ({
  label,
  description,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
}: {
  label: string;
  description?: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
    </label>
    {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const ToggleField = ({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-gray-300">{label}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-indigo-600" : "bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("platform");
  const [saveMessage, setSaveMessage] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.ilogicmagic.com";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveMessage("");

    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_PASSWORD,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveMessage("Settings saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Failed to save settings.");
      }
    } catch (error) {
      setSaveMessage("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sectionTabs = [
    {
      id: "platform",
      label: "Platform",
      icon: (
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      id: "subscription",
      label: "Subscription",
      icon: (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: "email",
      label: "Email",
      icon: (
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: "billing",
      label: "Billing",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure your platform settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span
              className={`text-sm ${saveMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}
            >
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sectionTabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeSection === tab.id}
            label={tab.label}
            icon={tab.icon}
            onClick={() => setActiveSection(tab.id)}
          />
        ))}
      </div>

      {/* Settings Forms */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {activeSection === "platform" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Platform Settings
            </h3>
            <InputField
              label="Platform Name"
              description="Your SaaS platform name displayed to users"
              value={settings?.platformName || ""}
              onChange={(v) => updateSetting("platformName", v)}
            />
            <InputField
              label="Primary Color"
              description="Main brand color (HEX code)"
              value={settings?.primaryColor || ""}
              onChange={(v) => updateSetting("primaryColor", v)}
            />
            <InputField
              label="Logo URL"
              description="URL to your custom logo image"
              value={settings?.logoUrl || ""}
              onChange={(v) => updateSetting("logoUrl", v)}
              placeholder="https://example.com/logo.png"
            />
            <InputField
              label="Favicon URL"
              description="URL to your custom favicon"
              value={settings?.faviconUrl || ""}
              onChange={(v) => updateSetting("faviconUrl", v)}
              placeholder="https://example.com/favicon.ico"
            />
          </div>
        )}

        {activeSection === "subscription" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Subscription Settings
            </h3>
            <ToggleField
              label="Free Trial"
              description="Allow new users to try the platform before subscribing"
              enabled={settings?.trialEnabled || false}
              onChange={(v) => updateSetting("trialEnabled", v)}
            />
            {settings?.trialEnabled && (
              <>
                <InputField
                  label="Trial Duration (Days)"
                  description="How many days does the trial last?"
                  value={settings?.trialDays || 7}
                  onChange={(v) => updateSetting("trialDays", parseInt(v) || 0)}
                  type="number"
                />
                <InputField
                  label="Trial Tokens"
                  description="How many AI message tokens does the trial include?"
                  value={settings?.trialTokens || 100}
                  onChange={(v) =>
                    updateSetting("trialTokens", parseInt(v) || 0)
                  }
                  type="number"
                />
              </>
            )}
          </div>
        )}

        {activeSection === "email" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Email Settings
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure SMTP settings for sending password reset emails and
              notifications.
            </p>
            <InputField
              label="SMTP Host"
              value={settings?.smtpHost || ""}
              onChange={(v) => updateSetting("smtpHost", v)}
              placeholder="smtp.resend.com"
            />
            <InputField
              label="SMTP Port"
              value={settings?.smtpPort || 587}
              onChange={(v) => updateSetting("smtpPort", parseInt(v) || 587)}
              type="number"
            />
            <InputField
              label="SMTP Username"
              value={settings?.smtpUser || ""}
              onChange={(v) => updateSetting("smtpUser", v)}
            />
            <InputField
              label="SMTP Password"
              value={settings?.smtpPass || ""}
              onChange={(v) => updateSetting("smtpPass", v)}
              type="password"
            />
            <InputField
              label="From Email"
              description="Emails will be sent from this address"
              value={settings?.fromEmail || ""}
              onChange={(v) => updateSetting("fromEmail", v)}
              placeholder="noreply@yourdomain.com"
            />
          </div>
        )}

        {activeSection === "security" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Security Settings
            </h3>
            <InputField
              label="Admin Password"
              description="Password to access this admin panel"
              value={settings?.adminPassword || ""}
              onChange={(v) => updateSetting("adminPassword", v)}
              type="password"
            />
            <InputField
              label="Rate Limit (Requests/Minute)"
              description="Max API requests per minute per IP"
              value={settings?.rateLimitPerMin || 10}
              onChange={(v) =>
                updateSetting("rateLimitPerMin", parseInt(v) || 10)
              }
              type="number"
            />
            <InputField
              label="Session Timeout (Seconds)"
              description="User session expiration time"
              value={settings?.sessionTimeout || 86400}
              onChange={(v) =>
                updateSetting("sessionTimeout", parseInt(v) || 86400)
              }
              type="number"
            />
          </div>
        )}

        {activeSection === "billing" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Billing Settings
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => updateSetting("stripeMode", "test")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings?.stripeMode === "test"
                    ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200"
                }`}
              >
                Test Mode
              </button>
              <button
                onClick={() => updateSetting("stripeMode", "live")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings?.stripeMode === "live"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200"
                }`}
              >
                Live Mode
              </button>
            </div>

            {settings?.stripeMode === "test" ? (
              <>
                <InputField
                  label="Stripe Test Publishable Key"
                  value={settings?.stripeTestKey || ""}
                  onChange={(v) => updateSetting("stripeTestKey", v)}
                  placeholder="pk_test_..."
                />
                <InputField
                  label="Stripe Test Secret Key"
                  value={settings?.stripeTestSecret || ""}
                  onChange={(v) => updateSetting("stripeTestSecret", v)}
                  type="password"
                  placeholder="sk_test_..."
                />
              </>
            ) : (
              <>
                <InputField
                  label="Stripe Live Publishable Key"
                  value={settings?.stripeLiveKey || ""}
                  onChange={(v) => updateSetting("stripeLiveKey", v)}
                  placeholder="pk_live_..."
                />
                <InputField
                  label="Stripe Live Secret Key"
                  value={settings?.stripeLiveSecret || ""}
                  onChange={(v) => updateSetting("stripeLiveSecret", v)}
                  type="password"
                  placeholder="sk_live_..."
                />
              </>
            )}

            <InputField
              label="Stripe Webhook Secret"
              description="Secret for verifying Stripe webhook signatures"
              value={settings?.stripeWebhookSecret || ""}
              onChange={(v) => updateSetting("stripeWebhookSecret", v)}
              type="password"
              placeholder="whsec_..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
