'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SyntheticEvent, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://midterm-2-c6vw.onrender.com';

type PortalRole = 'patient' | 'doctor' | 'admin';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<PortalRole>('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient-specific fields
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Doctor-specific fields
  const [specialty, setSpecialty] = useState('');
  const [licence, setLicence] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saveLocalRole = (targetUsername: string, targetRole: PortalRole) => {
    if (typeof window === 'undefined') return;
    try {
      const current = JSON.parse(localStorage.getItem('hms_roles') || '{}');
      current[targetUsername.trim().toLowerCase()] = targetRole;
      localStorage.setItem('hms_roles', JSON.stringify(current));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const cleanUsername = username.trim();
    const backendRole = role === 'admin' ? 'admin' : 'user';

    try {
      // 1. Register user account
      let regRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password,
          role: backendRole,
        }),
      });

      if (regRes.status === 404 || regRes.status === 405) {
        regRes = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            password,
            role: backendRole,
          }),
        });
      }

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed.');
      }

      saveLocalRole(cleanUsername, role);

      // 2. Obtain JWT token so protected /patients or /doctors routes succeed
      let token = '';
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json().catch(() => ({}));
        token = loginData.access_token || loginData.token || '';
      }

      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 3. Create linked Patient or Doctor record
      if (role === 'patient') {
        const patRes = await fetch(`${API_BASE_URL}/patients`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            birth_date: birthDate,
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }),
        });
        if (!patRes.ok) {
          const patErr = await patRes.json().catch(() => ({}));
          throw new Error(
            patErr.message || 'Account created, but failed to save patient profile.',
          );
        }
      } else if (role === 'doctor') {
        const docRes = await fetch(`${API_BASE_URL}/doctors`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            specialty: specialty.trim() || 'General Medicine',
            email: email.trim(),
            password,
            licence: licence.trim(),
            years_of_experience: Number(yearsOfExperience) || 0,
          }),
        });
        if (!docRes.ok) {
          const docErr = await docRes.json().catch(() => ({}));
          throw new Error(
            docErr.message || 'Account created, but failed to save doctor profile.',
          );
        }
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Create Hospital Account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Register as a patient, physician, or hospital administrator
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dr_santos_01"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800">
                Portal Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as PortalRole)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {role !== 'admin' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@example.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            </>
          )}

          {role === 'patient' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Birthday
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Naga City, Camarines Sur"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            </>
          )}

          {role === 'doctor' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-800">
                  Medical Specialty
                </label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g., Cardiology, Pediatrics, General Medicine"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    PRC / Medical License No.
                  </label>
                  <input
                    type="text"
                    required
                    value={licence}
                    onChange={(e) => setLicence(e.target.value)}
                    placeholder="PRC-0123456"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-teal-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}