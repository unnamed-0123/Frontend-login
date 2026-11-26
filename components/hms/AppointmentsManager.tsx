'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Patient } from './PatientsManager';
import { Doctor } from './DoctorsManager';

export interface Appointment {
  appointment_id: number;
  patient_id?: number | null;
  doctor_id?: number | null;
  appointment_time: string;
  patient_first_name?: string;
  patient_last_name?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  specialization?: string;
}

export default function AppointmentsManager({
  canEdit = true,
  canBook = true,
  bookingPatientId,
}: {
  canEdit?: boolean;
  canBook?: boolean;
  bookingPatientId?: number | null;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    patient_id: bookingPatientId ? String(bookingPatientId) : '',
    doctor_id: '',
    appointment_time: '',
  });

  useEffect(() => {
    if (bookingPatientId) {
      setForm((prev) => ({ ...prev, patient_id: String(bookingPatientId) }));
    }
  }, [bookingPatientId]);

  const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hms_token') : '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [apptData, patData, docData] = await Promise.all([
        apiRequest<Appointment[]>('/appointments', { headers: authHeaders() }),
        apiRequest<Patient[]>('/patients', { headers: authHeaders() }),
        apiRequest<Doctor[]>('/doctors', { headers: authHeaders() }),
      ]);
      setAppointments(Array.isArray(apptData) ? apptData : []);
      setPatients(Array.isArray(patData) ? patData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setForm({
      patient_id: bookingPatientId ? String(bookingPatientId) : '',
      doctor_id: '',
      appointment_time: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const effectivePatientId = bookingPatientId ?? Number(form.patient_id);
    const payload = {
      patient_id: effectivePatientId,
      doctor_id: Number(form.doctor_id),
      appointment_time: form.appointment_time.replace('T', ' ') + ':00',
    };

    try {
      if (editingId !== null && canEdit) {
        await apiRequest(`/appointments/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else if (canBook || canEdit) {
        await apiRequest('/appointments', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment.');
    }
  };

  const handleEdit = (a: Appointment) => {
    if (!canEdit) return;
    setEditingId(a.appointment_id);
    const formattedDate = a.appointment_time
      ? new Date(a.appointment_time).toISOString().slice(0, 16)
      : '';
    setForm({
      patient_id: a.patient_id ? String(a.patient_id) : '',
      doctor_id: a.doctor_id ? String(a.doctor_id) : '',
      appointment_time: formattedDate,
    });
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    if (!confirm('Cancel and delete this appointment?')) return;
    try {
      await apiRequest(`/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment.');
    }
  };

  const getPatientName = (a: Appointment) => {
    if (a.patient_first_name || a.patient_last_name) {
      return `${a.patient_first_name || ''} ${a.patient_last_name || ''}`.trim();
    }
    if (!a.patient_id) return 'Unassigned Patient';
    const p = patients.find((item) => item.patient_id === a.patient_id);
    return p ? `${p.first_name} ${p.last_name} (#${a.patient_id})` : `Patient #${a.patient_id}`;
  };

  const getDoctorName = (a: Appointment) => {
    if (a.doctor_first_name || a.doctor_last_name) {
      const spec = a.specialization ? ` (${a.specialization})` : '';
      return `Dr. ${a.doctor_first_name || ''} ${a.doctor_last_name || ''}${spec}`.trim();
    }
    if (!a.doctor_id) return 'Unassigned Doctor';
    const d = doctors.find((item) => item.doctor_id === a.doctor_id);
    if (!d) return `Doctor #${a.doctor_id}`;
    return d.specialization
      ? `Dr. ${d.first_name} ${d.last_name} (${d.specialization})`
      : `Dr. ${d.first_name} ${d.last_name}`;
  };

  const selectablePatients = bookingPatientId
    ? patients.filter((p) => p.patient_id === bookingPatientId)
    : patients;

  return (
    <div className="space-y-6">
      {(canBook || canEdit) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId !== null ? `Edit Appointment #${editingId}` : 'Schedule Appointment'}
          </h2>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <select
              required
              disabled={Boolean(bookingPatientId)}
              value={bookingPatientId ? String(bookingPatientId) : form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100"
            >
              {!bookingPatientId && <option value="">Select Patient...</option>}
              {selectablePatients.map((p) => (
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
              <option value="">Select Doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  #{d.doctor_id} - Dr. {d.first_name} {d.last_name}
                  {d.specialty || d.specialization ? ` (${d.specialty || d.specialization})` : ''}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              required
              value={form.appointment_time}
              onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />

            <div className="flex gap-2 sm:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {editingId !== null ? 'Update Appointment' : 'Book Appointment'}
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
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date & Time</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-4 py-6 text-center text-slate-500">
                    No appointments scheduled.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointment_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">#{a.appointment_id}</td>
                    <td className="px-4 py-3">{getPatientName(a)}</td>
                    <td className="px-4 py-3">{getDoctorName(a)}</td>
                    <td className="px-4 py-3">
                      {new Date(a.appointment_time).toLocaleString()}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a.appointment_id)}
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