'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Patient } from './PatientsManager';
import { Doctor } from './DoctorsManager';

export interface MedicalRecord {
  record_id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  created_at?: string;
  updated_at?: string;
  patient_name?: string;
  doctor_name?: string;
}

export default function MedicalRecordsManager({
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
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    diagnosis: '',
  });

  const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [recData, patData, docData] = await Promise.all([
        apiRequest<MedicalRecord[]>('/medical_records', { headers: authHeaders() }),
        apiRequest<Patient[]>('/patients', { headers: authHeaders() }),
        apiRequest<Doctor[]>('/doctors', { headers: authHeaders() }),
      ]);
      setRecords(Array.isArray(recData) ? recData : []);
      setPatients(Array.isArray(patData) ? patData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm({ patient_id: '', doctor_id: '', diagnosis: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit) return;
    setError('');
    const payload = {
      patient_id: Number(form.patient_id),
      doctor_id: Number(form.doctor_id),
      diagnosis: form.diagnosis,
    };

    try {
      if (editingId !== null) {
        await apiRequest(`/medical_records/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/medical_records', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medical record.');
    }
  };

  const handleEdit = (r: MedicalRecord) => {
    if (!canEdit) return;
    setEditingId(r.record_id);
    setForm({
      patient_id: String(r.patient_id),
      doctor_id: String(r.doctor_id),
      diagnosis: r.diagnosis || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Delete this medical record?')) return;
    try {
      await apiRequest(`/medical_records/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medical record.');
    }
  };

  const getPatientName = (r: MedicalRecord) => {
    if (r.patient_name) return r.patient_name;
    const p = patients.find((item) => item.patient_id === r.patient_id);
    return p ? `${p.first_name} ${p.last_name}` : `Patient #${r.patient_id}`;
  };

  const getDoctorName = (r: MedicalRecord) => {
    if (r.doctor_name) return `Dr. ${r.doctor_name}`;
    const d = doctors.find((item) => item.doctor_id === r.doctor_id);
    return d ? `Dr. ${d.first_name} ${d.last_name}` : `Doctor #${r.doctor_id}`;
  };

  const visibleRecords = isPatient
    ? records.filter((r) => {
        if (filterPatientId && Number(r.patient_id) === Number(filterPatientId)) {
          return true;
        }
        if (filterPatientName && r.patient_name) {
          return r.patient_name.trim().toLowerCase() === filterPatientName.trim().toLowerCase();
        }
        return false;
      })
    : records;

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId !== null ? `Edit Medical Record #${editingId}` : 'Create Medical Record'}
          </h2>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <select
              required
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">Select Patient...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>

            <select
              required
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">Select Attending Doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  #{d.doctor_id} - Dr. {d.first_name} {d.last_name}
                </option>
              ))}
            </select>

            <textarea
              required
              rows={3}
              placeholder="Clinical Diagnosis & Notes..."
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:col-span-2"
            />

            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {editingId !== null ? 'Update Record' : 'Save Record'}
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
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Created</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
                    No medical records found for your account.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((r) => (
                  <tr key={r.record_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{r.record_id}</td>
                    <td className="px-4 py-3">{getPatientName(r)}</td>
                    <td className="px-4 py-3">{getDoctorName(r)}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{r.diagnosis}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.record_id)}
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