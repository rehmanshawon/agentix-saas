"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardStats {
  stats: {
    totalWorkspaces: number;
    totalUsers: number;
    totalAgents: number;
    activeSubscriptions: number;
    mrr: number;
    newCustomersToday: number;
    totalMessagesToday: number;
  };
  activeClients: Array<{
    id: string;
    name: string;
    email: string;
    tier: string | null;
    tokensUsed: number;
    tokensMax: number;
    status: string;
    joinedAt: string;
  }>;
}

interface ChartData {
  signups: Array<{ date: string; count: number }>;
  agents: Array<{ date: string; count: number }>;
  mrr: Array<{ month: string; mrr: number }>;
}

const StatCard = ({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.ilogicmagic.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/dashboard/stats`, {
            headers: { "x-admin-key": ADMIN_PASSWORD },
          }),
          fetch(`${API_URL}/api/admin/dashboard/charts`, {
            headers: { "x-admin-key": ADMIN_PASSWORD },
          }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (chartsRes.ok) setCharts(await chartsRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Overview of your AI chatbot SaaS business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Workspaces"
          value={stats?.stats.totalWorkspaces || 0}
          icon={
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          color="bg-blue-600/20 text-blue-400"
          subtitle={`${stats?.stats.newCustomersToday || 0} new today`}
        />
        <StatCard
          label="Active Subscriptions"
          value={stats?.stats.activeSubscriptions || 0}
          icon={
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="bg-emerald-600/20 text-emerald-400"
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${(stats?.stats.mrr || 0).toLocaleString()}`}
          icon={
            <svg
              className="w-5 h-5 text-white"
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
          }
          color="bg-purple-600/20 text-purple-400"
          subtitle="Monthly Recurring Revenue"
        />
        <StatCard
          label="AI Agents Deployed"
          value={stats?.stats.totalAgents || 0}
          icon={
            <svg
              className="w-5 h-5 text-white"
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
          }
          color="bg-amber-600/20 text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* New Signups Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6">
            New Customer Signups
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts?.signups || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F9FAFB" }}
              />
              <Bar
                dataKey="count"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
                name="Signups"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Models Deployed Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6">
            AI Models Deployed
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts?.agents || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F9FAFB" }}
              />
              <Bar
                dataKey="count"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Agents"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MRR Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-white mb-6">MRR Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={charts?.mrr || []}>
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
            />
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: "#8B5CF6", strokeWidth: 0 }}
              name="MRR"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Active Clients Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Active Clients</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Client
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Tier
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Usage
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats?.activeClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        !client.tier
                          ? "bg-gray-800 text-gray-400"
                          : client.tier === "STARTER"
                            ? "bg-blue-900/50 text-blue-400"
                            : client.tier === "GROWTH"
                              ? "bg-indigo-900/50 text-indigo-400"
                              : "bg-purple-900/50 text-purple-400"
                      }`}
                    >
                      {client.tier || "No Plan"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{
                            width: `${client.tokensMax > 0 ? (client.tokensUsed / client.tokensMax) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {client.tokensUsed}/{client.tokensMax}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        client.status === "Active"
                          ? "text-emerald-400"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          client.status === "Active"
                            ? "bg-emerald-400"
                            : "bg-gray-600"
                        }`}
                      />
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(client.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!stats?.activeClients || stats.activeClients.length === 0) && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No active clients yet.
          </div>
        )}
      </div>
    </div>
  );
}
