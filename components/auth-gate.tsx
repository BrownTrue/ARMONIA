"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, useData } from "@/components/data-provider";
import { loginPathFor, safeNextPath } from "@/lib/auth/routing";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/check-email", "/auth/error", "/about", "/privacy"]);
const ACCOUNT_ENTRY_PATHS = new Set(["/login", "/signup", "/check-email", "/auth/error"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, retryAuth, user } = useData();
  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isAccountEntryPath = ACCOUNT_ENTRY_PATHS.has(pathname);

  useEffect(() => {
    if (!isCloudConfigured || authStatus === "loading" || authStatus === "error") return;
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.toString();
    if (authStatus === "unauthenticated" && !isPublicPath) router.replace(loginPathFor(`${pathname}${query ? `?${query}` : ""}`));
    if (user && isAccountEntryPath) router.replace(safeNextPath(searchParams.get("next")));
  }, [authStatus, isAccountEntryPath, isPublicPath, pathname, router, user]);

  if (!isCloudConfigured) return <>{children}</>;
  if (isPublicPath && !user) return <>{children}</>;
  if (authStatus === "error" && !isPublicPath) {
    return <main className="grid min-h-screen place-items-center px-4"><section className="card w-full max-w-md p-7 text-center"><h1 className="text-2xl font-bold">Problema di connessione</h1><p className="mt-2 text-sm text-slate-600">Non è stato possibile verificare la sessione.</p><button type="button" className="btn btn-primary mt-6" onClick={()=>void retryAuth()}>Riprova</button><button type="button" className="btn btn-quiet mt-3 block w-full" onClick={()=>router.replace("/login")}>Torna al login</button></section></main>;
  }
  if (authStatus === "loading" || (authStatus === "unauthenticated" && !isPublicPath) || (user && isAccountEntryPath)) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  return <>{children}</>;
}
