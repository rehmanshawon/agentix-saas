"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  id: string;
  name: string;
  subscriptionTier: string | null;
  tokenBalance: number;
  createdAt: string;
  members: Array<{
    user: { email: string; name: string | null };
  }>;
  _count?: {
    agents: number;
    documents: number;
  };
  stripeCustomerId?: string | null;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("");
  const [editTokens, setEditTokens] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.ilogicmagic.com";

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.workspaces);
        setFilteredSubscribers(data.workspaces);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, ADMIN_PASSWORD]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  // Filter and sort
  useEffect(() => {
    let result = [...subscribers];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.members[0]?.user.email.toLowerCase().includes(query) ||
          (s.subscriptionTier || "").toLowerCase().includes(query),
      );
    }

    // Tier filter
    if (tierFilter !== "all") {
      if (tierFilter === "none") {
        result = result.filter((s) => !s.subscriptionTier);
      } else {
        result = result.filter((s) => s.subscriptionTier === tierFilter);
      }
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "tier":
          aVal = a.subscriptionTier || "";
          bVal = b.subscriptionTier || "";
          break;
        case "tokens":
          aVal = a.tokenBalance;
          bVal = b.tokenBalance;
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }
      if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    setFilteredSubscribers(result);
  }, [subscribers, searchQuery, tierFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          subscriptionTier: editTier === "none" ? null : editTier,
          tokenBalance: editTokens,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchSubscribers();
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setIsExpanding(true);
    setExpandedId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscribers/${id}`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setExpandedData(data);
      }
    } catch (error) {
      console.error("Failed to fetch details:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Workspace", "Owner Email", "Tier", "Tokens", "Created"];
    const rows = filteredSubscribers.map((s) => [
      s.name,
      s.members[0]?.user.email || "",
      s.subscriptionTier || "No Plan",
      s.tokenBalance.toString(),
      new Date(s.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 inline-block">
      {sortField === field ? (
        <span className="text-indigo-400">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      ) : (
        <span className="text-gray-600">↕</span>
      )}
    </span>
  );

  const tierBadge = (tier: string | null) => {
    if (!tier) return { color: "bg-gray-800 text-gray-400", label: "No Plan" };
    const styles: Record<string, { color: string; label: string }> = {
      STARTER: { color: "bg-blue-900/50 text-blue-400", label: "Starter" },
      GROWTH: { color: "bg-indigo-900/50 text-indigo-400", label: "Growth" },
      ENTERPRISE: {
        color: "bg-purple-900/50 text-purple-400",
      label: "Business",
      },
    };
    return styles[tier] || { color: "bg-gray-800 text-gray-400", label: tier };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredSubscribers.length} total subscriber
            {filteredSubscribers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Tiers</option>
          <option value="none">No Plan</option>
          <option value="STARTER">Starter</option>
          <option value="GROWTH">Growth</option>
          <option value="ENTERPRISE">Business</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase w-8"></th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("name")}
                  >
                    Workspace <SortIcon field="name" />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                    Owner
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("tier")}
                  >
                    Tier <SortIcon field="tier" />
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("tokens")}
                  >
                    AI Replies <SortIcon field="tokens" />
                  </th>
                  <th
                    className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created <SortIcon field="createdAt" />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSubscribers.map((sub) => {
                  const tier = tierBadge(sub.subscriptionTier);
                  const isExpanded = expandedId === sub.id;
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleExpand(sub.id)}
                          className="p-1 rounded hover:bg-gray-700 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          {sub.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sub.id.substring(0, 12)}...
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.members[0]?.user.email || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === sub.id ? (
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="px-2 py-1 bg-gray-800 border border-gray-700 text-white text-sm rounded"
                          >
                            <option value="none">No Plan</option>
                            <option value="STARTER">Starter</option>
                            <option value="GROWTH">Growth</option>
                            <option value="ENTERPRISE">Business</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${tier.color}`}
                          >
                            {tier.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === sub.id ? (
                          <input
                            type="number"
                            value={editTokens}
                            onChange={(e) =>
                              setEditTokens(Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-sm rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-300">
                            {sub.tokenBalance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === sub.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(sub.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(sub.id);
                              setEditTier(sub.subscriptionTier || "none");
                              setEditTokens(sub.tokenBalance);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSubscribers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No subscribers found.</p>
              {searchQuery && (
                <p className="text-sm mt-1">
                  Try adjusting your search or filters.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
