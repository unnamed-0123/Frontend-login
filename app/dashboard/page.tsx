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
                <p className="text-