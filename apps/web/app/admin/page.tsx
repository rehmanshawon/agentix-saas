"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

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

interface Workspace {
  id: string;
  name: string;
  subscriptionTier: string;
  tokenBalance: number;
  createdAt: string;
  members: { user: { email: string; name: string | null } }[];
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [editTier, setEditTier] = useState("");
  const [editTokens, setEditTokens] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-authenticated", "true");
      fetchWorkspaces();
    } else {
      toast("Invalid admin password.", "error");
    }
  };

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces`, {
        headers: { "x-admin-key": ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      toast("Failed to load workspaces.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin-authenticated") === "true") {
      setIsAuthenticated(true);
      fetchWorkspaces();
    }
  }, []);

  const handleUpdateWorkspace = async (workspaceId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/workspaces/${workspaceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            subscriptionTier: editTier === "none" ? null : editTier,
            tokenBalance: editTokens,
          }),
        },
      );
      if (res.ok) {
        toast("Workspace updated successfully.", "success");
        setEditingWorkspace(null);
        fetchWorkspaces();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast("Failed to update workspace.", "error");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-sm w-full space-y-8 bg-gray-800 p-8 rounded-xl border border-gray-700">
          <div className="text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">Admin Panel</h2>
            <p className="mt-2 text-sm text-gray-400">
              Enter your admin password to continue.
            </p>
          </div>
          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                placeholder="Admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Access Admin
            </button>
          </form>
          <p className="text-center text-xs text-gray-500">
            Default password: admin123 (change in .env)
          </p>
        </div>
      </div>
    );
  }

  const totalTokens = workspaces.reduce((sum, w) => sum + w.tokenBalance, 0);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage all workspaces and subscriptions.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                sessionStorage.removeItem("admin-authenticated");
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase">
              Total Workspaces
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              {workspaces.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase">
              Pro Workspaces
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              {workspaces.filter((w) => w.subscriptionTier !== null).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-xs font-medium text-gray-400 uppercase">
              Total Tokens
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              {totalTokens.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Workspaces Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <SpinnerIcon />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Workspace
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Owner
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Tier
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Tokens
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Created
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {workspaces.map((workspace) => (
                    <tr
                      key={workspace.id}
                      className="hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          {workspace.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {workspace.id.substring(0, 12)}...
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {workspace.members[0]?.user.email || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {editingWorkspace === workspace.id ? (
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(e.target.value)}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 text-white text-sm rounded"
                          >
                            <option value="none">No Plan</option>
                            <option value="STARTER">STARTER</option>
                            <option value="GROWTH">GROWTH</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              !workspace.subscriptionTier
                                ? "bg-gray-700 text-gray-300"
                                : workspace.subscriptionTier === "STARTER"
                                  ? "bg-blue-900 text-blue-300"
                                  : workspace.subscriptionTier === "GROWTH"
                                    ? "bg-indigo-900 text-indigo-300"
                                    : "bg-purple-900 text-purple-300"
                            }`}
                          >
                            {workspace.subscriptionTier}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingWorkspace === workspace.id ? (
                          <input
                            type="number"
                            value={editTokens}
                            onChange={(e) =>
                              setEditTokens(Number(e.target.value))
                            }
                            className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 text-white text-sm rounded"
                          />
                        ) : (
                          <span className="text-sm text-gray-300">
                            {workspace.tokenBalance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {editingWorkspace === workspace.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleUpdateWorkspace(workspace.id)
                              }
                              className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingWorkspace(null)}
                              className="px-3 py-1 text-xs font-medium text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingWorkspace(workspace.id);
                              setEditTier(workspace.subscriptionTier);
                              setEditTokens(workspace.tokenBalance);
                            }}
                            className="px-3 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-gray-700 rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {workspaces.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No workspaces found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
