'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { CONFIG } from '@/lib/config';
import { clearTokens, getAccessToken, isAuthenticated } from '@/lib/auth';

type UserRole = 'patient' | 'doctor' | 'admin';

interface Position {
  id: number;
  position_code: string;
  position_name: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('User');
  const [role, setRole] = useState<UserRole>('patient');

  // Positions CRUD state (Admin)
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [positionCode, setPositionCode] = useState('');
  const [positionName, setPositionName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve username & role on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(CONFIG.ROUTES.LOGIN);
      return;
    }

    let resolvedUsername = 'User';
    let tokenRole: UserRole | null = null;

    const token = getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        resolvedUsername =
          payload.username || payload.name || payload.sub || 'User';
        if (
          payload.role &&
          ['patient', 'doctor', 'admin'].includes(
            String(payload.role).toLowerCase()
          )
        ) {
          tokenRole = String(payload.role).toLowerCase() as UserRole;
        }
      } catch {
        // Fallback if token payload cannot be decoded
      }
    }

    setUsername(String(resolvedUsername));

    // Look up role from token -> hms_roles map -> hms_active_role -> fallback
    const savedRoles: Record<string, UserRole> = JSON.parse(
      localStorage.getItem('hms_roles') || '{}'
    );
    const mappedRole = savedRoles[String(resolvedUsername).toLowerCase()];
    const activeRole = localStorage.getItem('hms_active_role') as UserRole | null;

    const finalRole: UserRole =
      tokenRole || mappedRole || activeRole || 'patient';
    setRole(finalRole);

    if (finalRole === 'admin') {
      fetchPositions();
    }
  }, [router]);

  const fetchPositions = async () => {
    setLoadingPositions(true);
    setError(null);
    try {
      const data = await apiClient<Position[]>(CONFIG.ENDPOINTS.POSITIONS, {
        requiresAuth: true,
      });
      setPositions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load positions.');
    } finally {
      setLoadingPositions(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  // Position Modal Openers
  const openCreateModal = () => {
    setPositionCode('');
    setPositionName('');
    setIsCreateOpen(true);
  };

  const openEditModal = (pos: Position) => {
    setSelectedPosition(pos);
    setPositionCode(pos.position_code);
    setPositionName(pos.position_name);
    setIsEditOpen(true);
  };

  const openViewModal = (pos: Position) => {
    setSelectedPosition(pos);
    setIsViewOpen(true);
  };

  // Position CRUD Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient(CONFIG.ENDPOINTS.POSITIONS, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({
          position_code: positionCode,
          position_name: positionName,
        }),
      });
      setIsCreateOpen(false);
      fetchPositions();
    } catch (err: any) {
      setError(err.message || 'Failed to create position.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${selectedPosition.id}`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
          position_code: positionCode,
          position_name: positionName,
        }),
      });
      setIsEditOpen(false);
      fetchPositions();
    } catch (err: any) {
      setError(err.message || 'Failed to update position.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this position?')) return;
    setError(null);
    try {
      await apiClient(`${CONFIG.ENDPOINTS.POSITIONS}/${id}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      fetchPositions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete position.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar (MediCore HMS) */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-lg font-bold text-white">
              +
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              MediCore HMS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              Dashboard
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {username}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as{' '}
              <span className="font-bold uppercase text-teal-600">
                {role}
              </span>
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            System Online
          </span>
        </div>

        {/* =====================================================
            ROLE 1: ADMIN VIEW (Stats + Positions Management)
           ===================================================== */}
        {role === 'admin' && (
          <>
            {/* Admin Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Scheduled Appointments
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
                <p className="mt-1 text-xs text-slate-500">
                  4 pending confirmation
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Available Doctors
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">8</p>
                <p className="mt-1 text-xs text-slate-500">
                  Across 5 departments
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Organization Positions
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {positions.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Active backend roles
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Positions CRUD Card (from your second screenshot) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Positions
                  </h2>
                  <p className="text-sm text-slate-500">
                    A list of all positions stored in the backend.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchPositions}
                    disabled={loadingPositions}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loadingPositions ? 'animate-spin' : ''
                      }`}
                    />
                    Read / Refresh
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Create Position
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Position Code</th>
                      <th className="px-6 py-3.5">Position Name</th>
                      <th className="px-6 py-3.5">Created At</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loadingPositions ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-slate-500"
                        >
                          Loading positions...
                        </td>
                      </tr>
                    ) : positions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-slate-500"
                        >
                          No positions found. Click &quot;Create Position&quot;
                          to add one.
                        </td>
                      </tr>
                    ) : (
                      positions.map((pos) => (
                        <tr
                          key={pos.id}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4 text-slate-700">{pos.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {pos.position_code}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {pos.position_name}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {pos.created_at
                              ? new Date(pos.created_at).toLocaleDateString(
                                  'en-US'
                                )
                              : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openViewModal(pos)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Read
                              </button>
                              <button
                                onClick={() => openEditModal(pos)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Update
                              </button>
                              <button
                                onClick={() => handleDelete(pos.id)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
          </>
        )}

        {/* =====================================================
            ROLE 2: DOCTOR VIEW
           ===================================================== */}
        {role === 'doctor' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Today&apos;s Consultations
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">6</p>
              <p className="mt-1 text-xs text-slate-500">2 patients waiting</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Assigned Patients
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">24</p>
              <p className="mt-1 text-xs text-slate-500">Active care plans</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pending Lab Reviews
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">3</p>
              <p className="mt-1 text-xs text-slate-500">Requires sign-off</p>
            </div>
          </div>
        )}

        {/* =====================================================
            ROLE 3: PATIENT VIEWS
           ===================================================== */}
        {role === 'patient' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Upcoming Appointment
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                Nov 20, 2026
              </p>
              <p className="mt-1 text-xs text-slate-500">
                General Consultation • 10:00 AM
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active Prescriptions
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">2</p>
              <p className="mt-1 text-xs text-slate-500">
                Ready for pharmacy pickup
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Medical Records
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">5</p>
              <p className="mt-1 text-xs text-slate-500">Lab & visit summaries</p>
            </div>
          </div>
        )}
      </main>

      {/* Create Position Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Create Position
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pres"
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Position Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., President"
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Position Modal */}
      {isEditOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Update Position
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Position Code
                </label>
                <input
                  type="text"
                  required
                  value={positionCode}
                  onChange={(e) => setPositionCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Position Name
                </label>
                <input
                  type="text"
                  required
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read / View Position Modal */}
      {isViewOpen && selectedPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Position Details
              </h3>
              <button
                onClick={() => setIsViewOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="font-medium text-slate-500">ID</span>
                <span className="text-slate-900">{selectedPosition.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="font-medium text-slate-500">
                  Position Code
                </span>
                <span className="text-slate-900">
                  {selectedPosition.position_code}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="font-medium text-slate-500">
                  Position Name
                </span>
                <span className="text-slate-900">
                  {selectedPosition.position_name}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium text-slate-500">Created At</span>
                <span className="text-slate-900">
                  {selectedPosition.created_at
                    ? new Date(selectedPosition.created_at).toLocaleString()
                    : '-'}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 cursor-pointer"
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