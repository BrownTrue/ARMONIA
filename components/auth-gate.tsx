"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, useData } from "@/components/data-provider";

const PUBLIC_PATHS = new Set(["/login", "/about", "/privacy"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authReady, user } = useData();
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (!isCloudConfigured || !authReady) return;
    if (!user && !isPublicPath) router.replace("/login");
    if (user && pathname === "/login") router.replace("/oggi");
  }, [authReady, isPublicPath, pathname, router, user]);

  if (!isCloudConfigured) return <>{children}</>;
  if (isPublicPath && pathname !== "/login") return <>{children}</>;
  if (!authReady || (!user && !isPublicPath) || (user && pathname === "/login")) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  return <>{children}</>;
}
