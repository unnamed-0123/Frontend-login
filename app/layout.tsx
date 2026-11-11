"use client";

import "./globals.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const loggedIn = typeof window !== "undefined" && isAuthenticated();

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans antialiased">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href={CONFIG.ROUTES.HOME} className="text-xl font-bold tracking-tight text-primary">
              App Portal
            </Link>

            <nav className="flex items-center space-x-4">
              {loggedIn ? (
                <>
                  <Link
                    href={CONFIG.ROUTES.DASHBOARD}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Dashboard
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href={CONFIG.ROUTES.LOGIN}
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Login
                  </Link>
                  <Link href={CONFIG.ROUTES.REGISTER}>
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}