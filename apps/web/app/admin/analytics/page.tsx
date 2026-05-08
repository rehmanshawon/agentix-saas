"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueData {
  totalRevenue: number;
  revenueByTier: Array<{
    name: string;
    value: number;
    subscribers: number;
    color: string;
  }>;
  mrrHistory: Array<{
    month: string;
    mrr: number;
    subscribers: number;
  }>;
  totalSubscribers: number;
}

interface UsageData {
  tokens: {
    allocated: number;
    remaining: number;
    consumed: number;
    consumptionRate: number;
  };
  documents: {
    total: number;
    ready: number;
    processing: number;
  };
  agents: {
    total: number;
    modelBreakdown: Array<{
      model: string;
      count: number;
    }>;
  };
  topWorkspaces: Array<{
    name: string;
    tier: string | null;
    allocated: number;
    remaining: number;
    consumed: number;
  }>;
}

const COLORS = [
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

const StatCard = ({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <p className="text-sm font-medium text-gray-400">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [activeTab, setActiveTab] = useState<"revenue" | "usage">("revenue");
  const [isLoading, setIsLoading] = useState(true);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.ilogicmagic.com";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [revenueRes, usageRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics/revenue`, {
            headers: { "x-admin-key": ADMIN_PASSWORD },
          }),
          fetch(`${API_URL}/api/admin/analytics/usage`, {
            headers: { "x-admin-key": ADMIN_PASSWORD },
          }),
        ]);

        if (revenueRes.ok) setRevenue(await revenueRes.json());
        if (usageRes.ok) setUsage(await usageRes.json());
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [API_URL, ADMIN_PASSWORD]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Revenue, usage, and growth insights.
          </p>
        </div>
        <div className="flex bg-gray-900 rounded-lg border border-gray-800 p-1">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "revenue"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "usage"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Usage
          </button>
        </div>
      </div>

      {activeTab === "revenue" && (
        <>
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Revenue"
              value={`$${(revenue?.totalRevenue || 0).toLocaleString()}`}
              color="text-emerald-400"
              subtitle="All-time subscription revenue"
            />
            <StatCard
              label="MRR"
              value={`$${(revenue?.mrrHistory?.[revenue.mrrHistory.length - 1]?.mrr || 0).toLocaleString()}`}
              color="text-indigo-400"
              subtitle="Monthly Recurring Revenue"
            />
            <StatCard
              label="Total Subscribers"
              value={revenue?.totalSubscribers || 0}
              color="text-blue-400"
              subtitle="Active paid subscribers"
            />
            <StatCard
              label="Avg. Revenue/Subscriber"
              value={`$${revenue?.totalSubscribers ? Math.round(revenue.totalRevenue / revenue.totalSubscribers).toLocaleString() : 0}`}
              color="text-purple-400"
              subtitle="ARPU"
            />
          </div>

          {/* MRR Trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-white mb-6">
              MRR Growth (12 Months)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenue?.mrrHistory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#F9FAFB" }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "MRR",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ fill: "#6366F1", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Tier + Subscriber Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Tier Pie */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-6">
                Revenue by Tier
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenue?.revenueByTier || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(revenue?.revenueByTier || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name,
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {(revenue?.revenueByTier || []).map((tier) => (
                  <div
                    key={tier.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="text-gray-300">{tier.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        ${tier.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tier.subscribers} subscriber
                        {tier.subscribers !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscriber Growth Bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-6">
                Subscriber Growth
              </h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={revenue?.mrrHistory || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis
                    dataKey="month"
                    type="category"
                    stroke="#6B7280"
                    fontSize={12}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#F9FAFB" }}
                  />
                  <Bar
                    dataKey="subscribers"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                    name="Subscribers"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === "usage" && (
        <>
          {/* Usage Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Tokens Consumed"
              value={(usage?.tokens.consumed || 0).toLocaleString()}
              color="text-amber-400"
              subtitle={`${usage?.tokens.consumptionRate || 0}% of allocated`}
            />
            <StatCard
              label="Tokens Remaining"
              value={(usage?.tokens.remaining || 0).toLocaleString()}
              color="text-emerald-400"
              subtitle={`${usage?.tokens.allocated.toLocaleString() || 0} total allocated`}
            />
            <StatCard
              label="Total Documents"
              value={usage?.documents.total || 0}
              color="text-blue-400"
              subtitle={`${usage?.documents.ready || 0} ready, ${usage?.documents.processing || 0} processing`}
            />
            <StatCard
              label="Total AI Agents"
              value={usage?.agents.total || 0}
              color="text-purple-400"
              subtitle={`${usage?.agents.modelBreakdown.length || 0} model types`}
            />
          </div>

          {/* Token Consumption Bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-white mb-6">
              Top Workspaces by Token Usage
            </h3>
            <div className="space-y-4">
              {(usage?.topWorkspaces || []).map((ws, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 w-6">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate max-w-[200px]">
                        {ws.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ws.consumed.toLocaleString()} /{" "}
                        {ws.allocated.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ws.allocated > 0 ? (ws.consumed / ws.allocated) * 100 : 0}%`,
                          backgroundColor:
                            ws.consumed / ws.allocated > 0.8
                              ? "#EF4444"
                              : "#6366F1",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(!usage?.topWorkspaces || usage.topWorkspaces.length === 0) && (
              <p className="text-center py-8 text-gray-500 text-sm">
                No usage data yet.
              </p>
            )}
          </div>

          {/* Model Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-6">
              AI Model Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {(usage?.agents.modelBreakdown || []).map((model, idx) => (
                <div
                  key={model.model}
                  className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700"
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-3"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <p className="text-sm text-gray-300 truncate">
                    {model.model}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {model.count}
                  </p>
                  <p className="text-xs text-gray-500">agents</p>
                </div>
              ))}
            </div>
            {(!usage?.agents.modelBreakdown ||
              usage.agents.modelBreakdown.length === 0) && (
              <p className="text-center py-8 text-gray-500 text-sm">
                No agent data yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
