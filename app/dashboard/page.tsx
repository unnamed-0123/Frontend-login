"use client";

import React, { useEffect, useState } from "react";
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
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { clearTokens, isAuthenticated } from "@/lib/auth";

interface Position {
  id: number;
  position_code: string;
  position_name: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch all positions
  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<Position[]>(CONFIG.ENDPOINTS.POSITIONS, {
        requiresAuth: true,
      });
      setPositions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load positions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(CONFIG.ROUTES.LOGIN);
      return;
    }
    fetchPositions();
  }, [router]);

  // Handle Logout
  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setPositionCode("");
    setPositionName("");
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (position: Position) => {
    setSelectedPosition(position);
    setPositionCode(position.position_code);
    setPositionName(position.position_name);
    setIsEditOpen(true);
  };

  // Open Read/View Modal
  const openViewModal = (position: Position) => {
    setSelectedPosition(position);
    setIsViewOpen(true);
  };

  // Create Position
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient(CONFIG.ENDPOINTS.POSITIONS, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          position_code: positionCode,
          position_name: positionName,
        }),
      });
      setIsCreateOpen(false);
      fetchPositions();
    } catch (err: any) {
      setError(err.message || "Failed to create position.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Position
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${selectedPosition.id}`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({
          position_code: positionCode,
          position_name: positionName,
        }),
      });
      setIsEditOpen(false);
      fetchPositions();
    } catch (err: any) {
      setError(err.message || "Failed to update position.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Position
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    setError(null);
    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      });
      fetchPositions();
    } catch (err: any) {
      setError(err.message || "Failed to delete position.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-serif">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage organization positions
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm">
          {/* Card Header */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 font-serif">
                Positions
              </h2>
              <p className="text-sm text-gray-500">
                A list of all positions stored in the backend.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPositions}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Position
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-600">
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Position Code</th>
                  <th className="py-3.5 px-6">Position Name</th>
                  <th className="py-3.5 px-6">Created At</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-500"
                    >
                      Loading positions...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-500"
                    >
                      No positions found. Click &quot;Create Position&quot; to
                      add one.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => (
                    <tr
                      key={pos.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 text-gray-700">{pos.id}</td>
                      <td className="py-4 px-6 text-gray-900">
                        {pos.position_code}
                      </td>
                      <td className="py-4 px-6 text-gray-900">
                        {pos.position_name}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {pos.created_at
                          ? new Date(pos.created_at).toLocaleDateString("en-US")
                          : "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(pos)}
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
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

      {/* Create Position Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
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
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pres"
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., President"
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Position Modal */}
      {isEditOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Position
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read / View Position Modal */}
      {isViewOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
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
            <div className="mt-4 space-y-3 text-sm">
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
                  {selectedPosition.created_at
                    ? new Date(selectedPosition.created_at).toLocaleString()
                    : "-"}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 cursor-pointer"
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