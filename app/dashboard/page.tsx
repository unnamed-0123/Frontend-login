"use client";

import { useRouter } from "next/navigation";
import { LogOut, KeyRound, Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-5 w-5 animate-pulse text-primary" />
          <span>Verifying active session...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span>AppPortal Dashboard</span>
          </div>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back! Here is your active session breakdown.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold w-fit">
            <CheckCircle2 className="h-4 w-4" />
            Session Active
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Session Type</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">JWT Token</div>
              <p className="text-xs text-muted-foreground mt-1">Bearer Authentication Header</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Storage Method</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LocalStorage</div>
              <p className="text-xs text-muted-foreground mt-1">Client-side persistence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Route Access</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Protected</div>
              <p className="text-xs text-muted-foreground mt-1">Guarded via useAuthGuard hook</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>
              Your token authorization state and system information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50 border font-mono text-xs overflow-x-auto">
              <p className="text-emerald-500">// Authentication status</p>
              <p className="mt-1">Authenticated: <span className="text-indigo-400">true</span></p>
              <p>Redirect Route: <span className="text-amber-400">"{CONFIG.ROUTES.DASHBOARD}"</span></p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}