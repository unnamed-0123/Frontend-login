'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UserSession {
  id?: number;
  username: string;
  role: string;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('hms_user');
    const token = localStorage.getItem('hms_token');

    if (token && storedUser) {
      try {
        const parsed: UserSession = JSON.parse(storedUser);
        const savedRoles: Record<string, string> = JSON.parse(
          localStorage.getItem('hms_roles') || '{}'
        );

        const localRole =
          savedRoles[parsed.username.trim().toLowerCase()] ||
          savedRoles[parsed.username];

        const resolvedRole =
          localRole ||
          (parsed.role === 'admin'
            ? 'admin'
            : parsed.role === 'doctor'
            ? 'doctor'
            : 'patient');

        setUser({
          ...parsed,
          role: resolvedRole,
        });
      } catch {
        localStorage.removeItem('hms_user');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Hospital Management System
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Clinical Operations &amp; Patient Portal
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            Manage doctor schedules, book patient appointments, and access
            hospital records from one centralized portal.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Sign In to Portal
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Register New Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user.username}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as{' '}
              <span className="font-semibold uppercase text-teal-700">
                {user.role}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit items-center rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              System Online
            </span>
            <Link
              href="/dashboard"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Scheduled Appointments
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
            <p className="mt-1 text-xs text-slate-500">4 pending confirmation</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Available Doctors
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">8</p>
            <p className="mt-1 text-xs text-slate-500">Across 5 departments</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Patient Records
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">148</p>
            <p className="mt-1 text-xs text-slate-500">Updated today</p>
          </div>
        </div>
      </div>
    </main>
  );
}