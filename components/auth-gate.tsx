"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, useData } from "@/components/data-provider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authReady, user } = useData();

  useEffect(() => {
    if (!isCloudConfigured || !authReady) return;
    if (!user && pathname !== "/login") router.replace("/login");
    if (user && pathname === "/login") router.replace("/oggi");
  }, [authReady, pathname, router, user]);

  if (!isCloudConfigured) return <>{children}</>;
  if (!authReady || (!user && pathname !== "/login") || (user && pathname === "/login")) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  return <>{children}</>;
}
