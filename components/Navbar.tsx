'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('hms_token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-sm font-extrabold text-white">
            +
          </span>
          <span>MediCore HMS</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className={`rounded-md px-3 py-2 transition-colors ${
                  pathname === '/login'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="text-slate-600 transition-colors hover:text-slate-900"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}