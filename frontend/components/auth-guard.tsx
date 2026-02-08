"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { LoadingScreen } from "@/components/loading-screen";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  // After splash + auth resolved, handle redirects
  useEffect(() => {
    if (!splashDone || loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push("/login");
    } else if (user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router, splashDone]);

  // Phase 1: Always show 5-second splash screen first
  if (!splashDone) {
    return <LoadingScreen progress={0} onComplete={handleSplashComplete} />;
  }

  // Phase 2: Auth still loading after splash
  if (loading) {
    return <LoadingScreen progress={100} />;
  }

  // Phase 3: Not authenticated and not on public route
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!user && !isPublicRoute) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
