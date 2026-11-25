'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialty?: string;
  specialization?: string;
  email: string;
  licence?: string;
  years_of_experience?: number;
}

export default function DoctorsManager({ canEdit = true }: { canEdit?: boolean }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    specialty: '',
    email: '',
    licence: '',
    years_of_experience: '',
  });

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Doctor[]>('/doctors', { headers: authHeaders() });
      setDoctors(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      specialty: '',
      email: '',
      licence: '',
      years_of_experience: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        specialty: form.specialty,
        email: form.email,
        licence: form.licence,
        years_of_experience: Number(form.years_of_experience) || 0,
      };
      if (editingId !== null) {
        await apiRequest(`/doctors/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/doctors', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save doctor.');
    }
  };

  const handleEdit = (d: Doctor) => {
    setEditingId(d.doctor_id);
    setForm({
      first_name: d.first_name || '',
      last_name: d.last_name || '',
      specialty: d.specialty || d.specialization || '',
      email: d.email || '',
      licence: d.licence || '',
      years_of_experience:
        d.years_of_experience !== undefined ? String(d.years_of_experience) : '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Remove this doctor from the directory?')) return;
    try {
      await apiRequest(`/doctors/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete doctor.');
    }
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId !== null ? `Edit Doctor #${editingId}` : 'Add Doctor'}
          </h2>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              required
              placeholder="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="text"
              required
              placeholder="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="text"
              required
              placeholder="Specialty (e.g. Cardiology)"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="text"
              required
              placeholder="License No. (e.g. PRC-012345)"
              value={form.licence}
              onChange={(e) => setForm({ ...form, licence: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="number"
              min={0}
              required
              placeholder="Years of Experience"
              value={form.years_of_experience}
              onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {editingId !== null ? 'Update Doctor' : 'Save Doctor'}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Experience</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                    Loading doctors...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                    No doctors listed yet.
                  </td>
                </tr>
              ) : (
                doctors.map((d) => (
                  <tr key={d.doctor_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{d.doctor_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      Dr. {d.first_name} {d.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        {d.specialty || d.specialization || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.email}</td>
                    <td className="px-4 py-3">{d.licence || '—'}</td>
                    <td className="px-4 py-3">
                      {d.years_of_experience !== undefined ? `${d.years_of_experience} yrs` : '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(d)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.doctor_id)}
                          className="font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}