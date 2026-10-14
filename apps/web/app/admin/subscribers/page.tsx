"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscriber {
  id: string;
  name: string;
  subscriptionTier: string | null;
  tokenBalance: number;
  aiRepliesUsed?: number;
  aiRepliesLimit?: number;
  aiRepliesRemaining?: number;
  createdAt: string;
  members: Array<{
    user: { email: string; name: string | null };
  }>;
  _count?: {
    agents: number;
    documents: number;
  };
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  billingProvider?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionExpiresAt?: string | null;
  subscriptionNotes?: string | null;
  monthlyReplyLimit?: number | null;
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

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("");
  const [editTokens, setEditTokens] = useState(0);
  const [editStatus, setEditStatus] = useState("manual");
  const [editProvider, setEditProvider] = useState("manual");
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editReplyLimit, setEditReplyLimit] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  // Expand State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  // Add Client Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTier, setNewTier] = useState("BD_BASIC");
  const [newStatus, setNewStatus] = useState("active");
  const [newProvider, setNewProvider] = useState("manual");
  const [newStartDate, setNewStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [newExpiresAt, setNewExpiresAt] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [newReplyLimit, setNewReplyLimit] = useState(1500);
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    email: string;
    workspaceName: string;
    temporaryPassword?: string;
  } | null>(null);

  const API_URL = "/api/backend";

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces`);
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
  }, [API_URL]);

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
          (s.subscriptionTier || "").toLowerCase().includes(query) ||
          (s.subscriptionNotes || "").toLowerCase().includes(query),
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
        case "repliesUsed":
          aVal = a.aiRepliesUsed ?? 0;
          bVal = b.aiRepliesUsed ?? 0;
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

  const handleTierChange = (tier: string) => {
    setNewTier(tier);
    if (tier === "BD_BASIC") setNewReplyLimit(1500);
    else if (tier === "BD_STANDARD") setNewReplyLimit(5000);
    else if (tier === "BD_INSTITUTIONAL") setNewReplyLimit(15000);
    else if (tier === "STARTER") setNewReplyLimit(1000);
    else if (tier === "GROWTH") setNewReplyLimit(5000);
    else if (tier === "ENTERPRISE") setNewReplyLimit(15000);
    else setNewReplyLimit(0);
  };

  const setOneYearPreset = () => {
    const base = newStartDate ? new Date(newStartDate) : new Date();
    base.setFullYear(base.getFullYear() + 1);
    setNewExpiresAt(base.toISOString().slice(0, 10));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName || undefined,
          password: newPassword || undefined,
          subscriptionTier: newTier === "none" ? null : newTier,
          subscriptionStatus: newStatus,
          billingProvider: newProvider,
          subscriptionStartDate: newStartDate || undefined,
          subscriptionExpiresAt: newExpiresAt || undefined,
          monthlyReplyLimit: newReplyLimit,
          subscriptionNotes: newNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to create client.");
        return;
      }

      setCreationResult({
        email: data.user.email,
        workspaceName: data.workspace.name,
        temporaryPassword: data.temporaryPassword,
      });

      // Reset form
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewNotes("");
      fetchSubscribers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionTier: editTier === "none" ? null : editTier,
          tokenBalance: editTokens,
          subscriptionStatus: editStatus || null,
          billingProvider: editProvider || null,
          subscriptionStartDate: editStartDate || null,
          subscriptionExpiresAt: editExpiresAt || null,
          monthlyReplyLimit: editReplyLimit || null,
          subscriptionNotes: editNotes || null,
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

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete workspace "${name}"? This removes all associated documents, agents, and data.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSubscribers();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete workspace.");
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleQuickStatusToggle = async (sub: Subscriber) => {
    const isCurrentlyExpired =
      sub.subscriptionStatus === "expired" ||
      (sub.subscriptionExpiresAt &&
        new Date(sub.subscriptionExpiresAt) <= new Date());
    const nextStatus = isCurrentlyExpired ? "active" : "expired";

    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: nextStatus }),
      });
      if (res.ok) fetchSubscribers();
    } catch (err) {
      console.error("Status toggle failed:", err);
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
      const res = await fetch(`${API_URL}/api/admin/subscribers/${id}`);
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
    const headers = [
      "Workspace",
      "Owner Email",
      "Tier",
      "Status",
      "Expires At",
      "AI Replies Used",
      "Monthly AI Reply Limit",
      "Notes",
      "Created",
    ];
    const rows = filteredSubscribers.map((s) => [
      s.name,
      s.members[0]?.user.email || "",
      s.subscriptionTier || "No Plan",
      s.subscriptionStatus || "active",
      s.subscriptionExpiresAt
        ? new Date(s.subscriptionExpiresAt).toLocaleDateString()
        : "N/A",
      (s.aiRepliesUsed ?? 0).toString(),
      (s.aiRepliesLimit ?? 0).toString(),
      `"${(s.subscriptionNotes || "").replace(/"/g, '""')}"`,
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
      STARTER: { color: "bg-blue-900/50 text-blue-400 border border-blue-800", label: "Starter" },
      GROWTH: { color: "bg-indigo-900/50 text-indigo-400 border border-indigo-800", label: "Growth" },
      ENTERPRISE: {
        color: "bg-purple-900/50 text-purple-400 border border-purple-800",
        label: "Business",
      },
      BD_BASIC: { color: "bg-emerald-900/50 text-emerald-300 border border-emerald-800", label: "BD Basic" },
      BD_STANDARD: {
        color: "bg-emerald-900/50 text-emerald-300 border border-emerald-800",
        label: "BD Standard",
      },
      BD_INSTITUTIONAL: {
        color: "bg-emerald-900/50 text-emerald-300 border border-emerald-800",
        label: "BD Institutional",
      },
    };
    return styles[tier] || { color: "bg-gray-800 text-gray-400", label: tier };
  };

  const statusBadge = (sub: Subscriber) => {
    const isExpired =
      sub.subscriptionStatus === "expired" ||
      (sub.subscriptionExpiresAt &&
        new Date(sub.subscriptionExpiresAt) <= new Date());

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-400 border border-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Expired
        </span>
      );
    }

    if (sub.subscriptionStatus === "canceled") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
          Canceled
        </span>
      );
    }

    if (sub.subscriptionStatus === "past_due") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
          Past Due
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {sub.billingProvider === "manual" ? "Manual Active" : "Active"}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers & Tenants</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage global SaaS customers and Bangladesh annual managed clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreationResult(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Add Client / Tenant
          </button>
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
      </div>

      {/* Creation Result Modal / Notice */}
      {creationResult && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-800 bg-emerald-950/60 text-white flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-emerald-400">
              ✓ Client Workspace Created Successfully
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Workspace: <strong>{creationResult.workspaceName}</strong> | Email:{" "}
              <strong>{creationResult.email}</strong>
            </p>
            {creationResult.temporaryPassword && (
              <p className="text-xs text-amber-300 mt-2 bg-amber-950/80 p-2 rounded border border-amber-800/80 inline-block font-mono">
                Generated Login Password: {creationResult.temporaryPassword} (Provide this to the client)
              </p>
            )}
          </div>
          <button
            onClick={() => setCreationResult(null)}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by workspace, email, plan, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 text-sm"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="all">All Plans & Tiers</option>
          <option value="none">No Plan</option>
          <option value="STARTER">Starter ($7/mo)</option>
          <option value="GROWTH">Growth ($15/mo)</option>
          <option value="ENTERPRISE">Business ($29/mo)</option>
          <option value="BD_BASIC">BD Basic (৳30k-৳45k/yr)</option>
          <option value="BD_STANDARD">BD Standard (৳60k-৳90k/yr)</option>
          <option value="BD_INSTITUTIONAL">BD Institutional (৳120k-৳250k/yr)</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase w-8"></th>
                  <th
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("name")}
                  >
                    Workspace <SortIcon field="name" />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">
                    Owner
                  </th>
                  <th
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("tier")}
                  >
                    Plan <SortIcon field="tier" />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">
                    Status
                  </th>
                  <th
                    className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
                    onClick={() => handleSort("repliesUsed")}
                  >
                    Replies Used / Cap <SortIcon field="repliesUsed" />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">
                    Annual Expiry
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSubscribers.map((sub) => {
                  const tier = tierBadge(sub.subscriptionTier);
                  const isExpanded = expandedId === sub.id;
                  const isExpired =
                    sub.subscriptionStatus === "expired" ||
                    (sub.subscriptionExpiresAt &&
                      new Date(sub.subscriptionExpiresAt) <= new Date());

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleExpand(sub.id)}
                          className="p-1 rounded hover:bg-gray-700 transition-colors"
                          title="View workspace details"
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
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-white">
                          {sub.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {sub.id.substring(0, 14)}...
                        </p>
                        {sub.subscriptionNotes && (
                          <p className="text-xs text-amber-400/90 mt-1 max-w-xs truncate" title={sub.subscriptionNotes}>
                            📝 {sub.subscriptionNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-300">
                        {sub.members[0]?.user.email || "N/A"}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === sub.id ? (
                          <div className="space-y-2">
                            <select
                              value={editTier}
                              onChange={(e) => setEditTier(e.target.value)}
                              className="px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded w-full"
                            >
                              <option value="none">No Plan</option>
                              <option value="STARTER">Starter</option>
                              <option value="GROWTH">Growth</option>
                              <option value="ENTERPRISE">Business</option>
                              <option value="BD_BASIC">BD Basic</option>
                              <option value="BD_STANDARD">BD Standard</option>
                              <option value="BD_INSTITUTIONAL">
                                BD Institutional
                              </option>
                            </select>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                            >
                              <option value="active">Active</option>
                              <option value="manual">Manual active</option>
                              <option value="past_due">Past due</option>
                              <option value="canceled">Canceled</option>
                              <option value="expired">Expired</option>
                            </select>
                            <select
                              value={editProvider}
                              onChange={(e) => setEditProvider(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                            >
                              <option value="manual">Manual</option>
                              <option value="stripe">Stripe</option>
                              <option value="paddle">Paddle</option>
                            </select>
                            <input
                              type="date"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                              title="Start date"
                            />
                            <input
                              type="date"
                              value={editExpiresAt}
                              onChange={(e) => setEditExpiresAt(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                              title="Expiry date"
                            />
                            <input
                              type="number"
                              min="0"
                              value={editReplyLimit}
                              onChange={(e) =>
                                setEditReplyLimit(Number(e.target.value))
                              }
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                              placeholder="Monthly reply cap"
                            />
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                              placeholder="Payment / agreement notes"
                              rows={2}
                            />
                          </div>
                        ) : (
                          <div>
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${tier.color}`}
                            >
                              {tier.label}
                            </span>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                              {sub.billingProvider || "manual"}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {statusBadge(sub)}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === sub.id ? (
                          <label className="block text-xs text-gray-400">
                            Current balance override
                            <input
                              type="number"
                              min="0"
                              value={editTokens}
                              onChange={(e) =>
                                setEditTokens(Number(e.target.value))
                              }
                              className="mt-1 w-28 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded"
                            />
                          </label>
                        ) : (
                          <div className="text-sm">
                            <p className="font-semibold text-gray-200">
                              {(sub.aiRepliesUsed ?? 0).toLocaleString()} /{" "}
                              {(sub.aiRepliesLimit ?? 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {(sub.aiRepliesRemaining ?? 0).toLocaleString()}{" "}
                              remaining
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {sub.subscriptionExpiresAt ? (
                          <div>
                            <p
                              className={
                                isExpired ? "text-red-400 font-semibold" : "text-gray-300"
                              }
                            >
                              {new Date(sub.subscriptionExpiresAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {isExpired ? "Expired" : "Active term"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === sub.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(sub.id)}
                              className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 text-xs font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(sub.id);
                                setEditTier(sub.subscriptionTier || "none");
                                setEditTokens(sub.tokenBalance);
                                setEditStatus(sub.subscriptionStatus || "manual");
                                setEditProvider(sub.billingProvider || "manual");
                                setEditStartDate(
                                  sub.subscriptionStartDate?.slice(0, 10) || "",
                                );
                                setEditExpiresAt(
                                  sub.subscriptionExpiresAt?.slice(0, 10) || "",
                                );
                                setEditReplyLimit(sub.monthlyReplyLimit || 0);
                                setEditNotes(sub.subscriptionNotes || "");
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleQuickStatusToggle(sub)}
                              className={`px-2.5 py-1 text-xs font-medium rounded ${
                                isExpired
                                  ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                                  : "text-amber-400 hover:text-amber-300 hover:bg-amber-950/50"
                              }`}
                              title={isExpired ? "Re-activate client" : "Disable/Expire client"}
                            >
                              {isExpired ? "Activate" : "Expire"}
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id, sub.name)}
                              className="px-2 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded"
                              title="Delete workspace"
                            >
                              Delete
                            </button>
                          </div>
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
                  Try adjusting your search query or filters.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-white my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
              <h2 className="text-lg font-bold">Add New Client / Tenant</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Client Email *
                </label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@business.com"
                  className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Company / Workspace Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dhaka Academy / Acme Health"
                  className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Initial Password (Optional)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Plan / Tier
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => handleTierChange(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  >
                    <optgroup label="🇧🇩 Bangladesh Managed Service">
                      <option value="BD_BASIC">BD Basic (৳30k-৳45k/yr)</option>
                      <option value="BD_STANDARD">BD Standard (৳60k-৳90k/yr)</option>
                      <option value="BD_INSTITUTIONAL">BD Institutional (৳120k-৳250k/yr)</option>
                    </optgroup>
                    <optgroup label="🌐 Global SaaS Plans">
                      <option value="STARTER">Starter ($7/mo)</option>
                      <option value="GROWTH">Growth ($15/mo)</option>
                      <option value="ENTERPRISE">Business ($29/mo)</option>
                      <option value="none">No Plan (Custom)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Monthly AI Reply Cap
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newReplyLimit}
                    onChange={(e) => setNewReplyLimit(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Billing Provider
                  </label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  >
                    <option value="manual">Manual (Bank/Cash/Invoice)</option>
                    <option value="stripe">Stripe</option>
                    <option value="paddle">Paddle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Subscription Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="manual">Manual Active</option>
                    <option value="expired">Expired</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Expiry Date
                    </label>
                    <button
                      type="button"
                      onClick={setOneYearPreset}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      +1 Year
                    </button>
                  </div>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Payment / Agreement Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Annual agreement signed, BDT 60,000 paid via City Bank, Ref: INV-2026-081"
                  className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Client Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
