const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://midterm-2-c6vw.onrender.com';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('hms_token') : null;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed. Please check your credentials.');
  }

  return data as T;
}