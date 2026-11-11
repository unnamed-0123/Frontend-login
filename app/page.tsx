"use client";

import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { isChecking } = useAuthGuard({ requireAuth: false });

  if (isChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      <Card className="w-full max-w-lg p-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold">Welcome to the Platform</CardTitle>
          <CardDescription className="text-base mt-2">
            Secure authentication system built with Next.js, Shadcn UI, and JWT authorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <Link href={CONFIG.ROUTES.LOGIN} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">Login</Button>
          </Link>
          <Link href={CONFIG.ROUTES.REGISTER} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">Create Account</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}