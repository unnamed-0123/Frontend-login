"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  Stethoscope,
  User as UserIcon,
} from "lucide-react";

type DisplayRole = "patient" | "doctor" | "admin";

interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://midterm-2-c6vw.onrender.com";

export default function DashboardPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, DisplayRole>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DisplayRole>("patient");
  const [submitting, setSubmitting] = useState(false);

  const loadLocalRoles = (): Record<string, DisplayRole> => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("hms_roles") || "{}");
    } catch {
      return {};
    }
  };

  const saveLocalRole = (targetUsername: string, targetRole: DisplayRole) => {
    if (typeof window === "undefined") return;
    const current = loadLocalRoles();
    current[targetUsername.trim().toLowerCase()] = targetRole;
    localStorage.setItem("hms_roles", JSON.stringify(current));
    setRoleMap({ ...current });
  };

  const resolveDisplayRole = (user: User): DisplayRole => {
    const mapped =
      roleMap[user.username.trim().toLowerCase()] || roleMap[user.username];
    if (mapped === "admin" || mapped === "doctor" || mapped === "patient") {
      return mapped;
    }
    if (user.role === "admin") return "admin";
    if (user.role === "doctor") return "doctor";
    return "patient";
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("hms_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access_token")
      );
    }
    return null;
  };

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // READ / FETCH ALL USERS
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRoleMap(loadLocalRoles());
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch users (${res.status})`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading users from backend.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // LOGOUT (keeps hms_roles intact so frontend role labels persist across logins)
  const handleLogout = () => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // CREATE ACCOUNT
  const openCreateModal = () => {
    setUsername("");
    setPassword("");
    setRole("patient");
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanUsername = username.trim();
      const backendRole = role === "admin" ? "admin" : "user";

      let res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: cleanUsername,
          password,
          role: backendRole,
        }),
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            username: cleanUsername,
            password,
            role: backendRole,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create account");
      }

      saveLocalRole(cleanUsername, role);
      setIsCreateOpen(false);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Error creating account");
    } finally {
      setSubmitting(false);
    }
  };

  // VIEW SINGLE ACCOUNT
  const handleRead = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  // UPDATE ACCOUNT
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(resolveDisplayRole(user));
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const cleanUsername = username.trim();
      const backendRole = role === "admin" ? "admin" : "user";
      const payload: Record<string, string> = {
        username: cleanUsername,
        role: backendRole,
      };
      if (password.trim() !== "") {
        payload.password = password;
      }

      let res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 404 || res.status === 405) {
        res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update account");
      }

      saveLocalRole(cleanUsername, role);
      setIsEditOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Error updating account");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE ACCOUNT
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Account #${id}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`Failed to delete Account #${id}`);

      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Error deleting account");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Active";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US");
  };

  const renderRoleBadge = (displayRole: DisplayRole) => {
    if (displayRole === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          admin
        </span>
      );
    }
    if (displayRole === "doctor") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Stethoscope className="w-3.5 h-3.5" />
          doctor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <UserIcon className="w-3.5 h-3.5" />
        patient
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-6 mb-8 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage patients, doctors, and admin accounts
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Patients, Doctors &amp; Admins
              </h2>
              <p className="text-sm text-gray-500">
                A list of all registered accounts stored in the system.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </button>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-700">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Created At / Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading && users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400"
                    >
                      Loading accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400"
                    >
                      No accounts found. Click &quot;Add Account&quot; to
                      create one.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {user.username}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(resolveDisplayRole(user))}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRead(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Read
                          </button>

                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Update
                          </button>

                          <button
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Account
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., dr_DH"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as DisplayRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE ACCOUNT MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Account #{selectedUser.id}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (leave blank to keep current)
                  </span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as DisplayRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ / VIEW DETAILS MODAL */}
      {isViewOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Account Details
              </h3>
              <button
                onClick={() => setIsViewOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500">ID</span>
                <span className="text-gray-900">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500">Username</span>
                <span className="text-gray-900">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500">Role</span>
                <span className="font-semibold text-gray-900">
                  {resolveDisplayRole(selectedUser)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-500">Status</span>
                <span className="text-gray-900">
                  {formatDate(selectedUser.created_at)}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}