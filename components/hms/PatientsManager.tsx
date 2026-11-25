'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  email?: string;
  phone: string | number;
  address?: string;
}

export default function PatientsManager({ canEdit = true }: { canEdit?: boolean }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    email: '',
    phone: '',
    address: '',
  });

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Patient[]>('/patients', { headers: authHeaders() });
      setPatients(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const resetForm = () => {
    setForm({ first_name: '', last_name: '', birth_date: '', email: '', phone: '', address: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    try {
      if (editingId !== null) {
        await apiRequest(`/patients/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      } else {
        await apiRequest('/patients', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      resetForm();
      fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save patient.');
    }
  };

  const handleEdit = (p: Patient) => {
    setEditingId(p.patient_id);
    setForm({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      birth_date: p.birth_date ? p.birth_date.split('T')[0] : '',
      email: p.email || '',
      phone: String(p.phone || ''),
      address: p.address || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Delete this patient record?')) return;
    try {
      await apiRequest(`/patients/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient.');
    }
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId !== null ? `Edit Patient #${editingId}` : 'Register New Patient'}
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
              type="date"
              required
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
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
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {editingId !== null ? 'Update Patient' : 'Add Patient'}
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Birthday</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                    No patients registered yet.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{p.patient_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-4 py-3">{p.birth_date?.split('T')[0]}</td>
                    <td className="px-4 py-3">{p.email || '—'}</td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3">{p.address || '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.patient_id)}
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