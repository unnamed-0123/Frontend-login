'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { MedicalRecord } from './MedicalRecordsManager';

export interface Prescription {
  prescription_id: number;
  record_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  patient_name?: string;
  diagnosis?: string;
}

export default function PrescriptionsManager({
  canEdit = true,
  isPatient = false,
  filterPatientId,
  filterPatientName,
}: {
  canEdit?: boolean;
  isPatient?: boolean;
  filterPatientId?: number | null;
  filterPatientName?: string;
}) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    record_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
  });

  const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rxData, recData] = await Promise.all([
        apiRequest<Prescription[]>('/prescriptions', { headers: authHeaders() }),
        apiRequest<MedicalRecord[]>('/medical_records', { headers: authHeaders() }),
      ]);
      setPrescriptions(Array.isArray(rxData) ? rxData : []);
      setRecords(Array.isArray(recData) ? recData : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm({ record_id: '', medication_name: '', dosage: '', frequency: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    const payload = {
      record_id: Number(form.record_id),
      medication_name: form.medication_name,
      dosage: form.dosage,
      frequency: form.frequency,
    };

    try {
      if (editingId !== null) {
        await apiRequest(`/prescriptions/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/prescriptions', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prescription.');
    }
  };

  const handleEdit = (rx: Prescription) => {
    if (!canEdit) return;
    setEditingId(rx.prescription_id);
    setForm({
      record_id: String(rx.record_id),
      medication_name: rx.medication_name || '',
      dosage: rx.dosage || '',
      frequency: rx.frequency || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Delete this prescription?')) return;
    try {
      await apiRequest(`/prescriptions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prescription.');
    }
  };

  const ownedRecordIds = new Set(
    records
      .filter((r) => {
        if (filterPatientId && Number(r.patient_id) === Number(filterPatientId)) {
          return true;
        }
        if (filterPatientName && r.patient_name) {
          return r.patient_name.trim().toLowerCase() === filterPatientName.trim().toLowerCase();
        }
        return false;
      })
      .map((r) => Number(r.record_id)),
  );

  const visiblePrescriptions = isPatient
    ? prescriptions.filter((rx) => {
        if (ownedRecordIds.has(Number(rx.record_id))) return true;
        if (filterPatientName && rx.patient_name) {
          return rx.patient_name.trim().toLowerCase() === filterPatientName.trim().toLowerCase();
        }
        return false;
      })
    : prescriptions;

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId !== null ? `Edit Prescription #${editingId}` : 'Issue Prescription'}
          </h2>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              required
              value={form.record_id}
              onChange={(e) => setForm({ ...form, record_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">Select Medical Record...</option>
              {records.map((r) => (
                <option key={r.record_id} value={r.record_id}>
                  Record #{r.record_id} - {r.diagnosis.slice(0, 30)}
                </option>
              ))}
            </select>

            <input
              type="text"
              required
              placeholder="Medication (e.g. Amoxicillin)"
              value={form.medication_name}
              onChange={(e) => setForm({ ...form, medication_name: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />

            <input
              type="text"
              required
              placeholder="Dosage (e.g. 500mg)"
              value={form.dosage}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />

            <input
              type="text"
              required
              placeholder="Frequency (e.g. 3x daily)"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />

            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {editingId !== null ? 'Update Prescription' : 'Add Prescription'}
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
                <th className="px-4 py-3">Rx ID</th>
                <th className="px-4 py-3">Record #</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Dosage</th>
                <th className="px-4 py-3">Frequency</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                    Loading prescriptions...
                  </td>
                </tr>
              ) : visiblePrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                    No prescriptions found for your account.
                  </td>
                </tr>
              ) : (
                visiblePrescriptions.map((rx) => (
                  <tr key={rx.prescription_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{rx.prescription_id}</td>
                    <td className="px-4 py-3">#{rx.record_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{rx.medication_name}</td>
                    <td className="px-4 py-3">{rx.dosage}</td>
                    <td className="px-4 py-3">{rx.frequency}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(rx)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rx.prescription_id)}
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