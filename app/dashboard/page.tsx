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
} from "lucide-react";

interface Position {
  id: number;
  position_code: string;
  position_name: string;
  created_at: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://midterm-2-c6vw.onrender.com/";

export default function DashboardPage() {
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );

  // Form states
  const [positionCode, setPositionCode] = useState("");
  const [positionName, setPositionName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("access_token");
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

  // READ / FETCH ALL POSITIONS
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/positions`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch positions (${res.status})`);
      }

      const data = await res.json();
      setPositions(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading positions from backend.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // CREATE POSITION
  const openCreateModal = () => {
    setPositionCode("");
    setPositionName("");
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/positions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          position_code: positionCode,
          position_name: positionName,
        }),
      });

      if (!res.ok) throw new Error("Failed to create position");

      setIsCreateOpen(false);
      await fetchPositions();
    } catch (err: any) {
      alert(err.message || "Error creating position");
    } finally {
      setSubmitting(false);
    }
  };

  // VIEW SINGLE POSITION
  const handleRead = (pos: Position) => {
    setSelectedPosition(pos);
    setIsViewOpen(true);
  };

  // UPDATE POSITION
  const openEditModal = (pos: Position) => {
    setSelectedPosition(pos);
    setPositionCode(pos.position_code);
    setPositionName(pos.position_name);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/positions/${selectedPosition.id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            position_code: positionCode,
            position_name: positionName,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update position");

      setIsEditOpen(false);
      setSelectedPosition(null);
      await fetchPositions();
    } catch (err: any) {
      alert(err.message || "Error updating position");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE POSITION (Triggers the exact browser confirm dialog shown in screenshot)
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Position #${id}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/positions/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`Failed to delete Position #${id}`);

      await fetchPositions();
    } catch (err: any) {
      alert(err.message || "Error deleting position");
    }
  };

  // Format date like "11/8/2026"
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US");
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
              Manage organization positions
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
              <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
              <p className="text-sm text-gray-500">
                A list of all positions stored in the backend.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchPositions}
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
                Create Position
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Positions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-700">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Position Code</th>
                  <th className="py-3.5 px-4">Position Name</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading && positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400"
                    >
                      Loading positions...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400"
                    >
                      No positions found. Click &quot;Create Position&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => (
                    <tr
                      key={pos.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {pos.id}
                      </td>
                      <td className="py-3.5 px-4">{pos.position_code}</td>
                      <td className="py-3.5 px-4">{pos.position_name}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {formatDate(pos.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRead(pos)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Read
                          </button>

                          <button
                            onClick={() => openEditModal(pos)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Update
                          </button>

                          <button
                            onClick={() => handleDelete(pos.id)}
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

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Position
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
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  placeholder="e.g., Pres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name
                </label>
                <input
                  type="text"
                  required
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  placeholder="e.g., President"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
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
                  {submitting ? "Saving..." : "Save Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {isEditOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Position #{selectedPosition.id}
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
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name
                </label>
                <input
                  type="text"
                  required
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
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
                  {submitting ? "Updating..." : "Update Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ / VIEW DETAILS MODAL */}
      {isViewOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Position Details
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
                <span className="text-gray-900">{selectedPosition.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500">Position Code</span>
                <span className="text-gray-900">
                  {selectedPosition.position_code}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500">Position Name</span>
                <span className="text-gray-900">
                  {selectedPosition.position_name}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-500">Created At</span>
                <span className="text-gray-900">
                  {formatDate(selectedPosition.created_at)}
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