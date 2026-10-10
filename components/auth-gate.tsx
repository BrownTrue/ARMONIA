"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, useData } from "@/components/data-provider";
import { loginPathFor, safeNextPath } from "@/lib/auth/routing";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/check-email", "/forgot-password", "/reset-password", "/auth/error", "/about", "/privacy"]);
const ACCOUNT_ENTRY_PATHS = new Set(["/login", "/signup", "/check-email", "/forgot-password", "/auth/error"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, retryAuth, user, ready, data, dataLoadStatus, dataLoadError, retryData } = useData();
  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isAccountEntryPath = ACCOUNT_ENTRY_PATHS.has(pathname);
  const onboardingIncomplete = Boolean(user && ready && !data.profile.onboardingCompletedAt);

  useEffect(() => {
    if (!isCloudConfigured || authStatus === "loading" || authStatus === "error") return;
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.toString();
    if (authStatus === "unauthenticated" && !isPublicPath) router.replace(loginPathFor(`${pathname}${query ? `?${query}` : ""}`));
    if (user && isAccountEntryPath) router.replace(pathname === "/forgot-password" ? "/impostazioni" : safeNextPath(searchParams.get("next")));
    if (user && ready && pathname === "/onboarding" && !onboardingIncomplete) router.replace("/oggi");
    if (user && ready && onboardingIncomplete && pathname !== "/onboarding" && !isPublicPath) router.replace("/onboarding");
  }, [authStatus, isAccountEntryPath, isPublicPath, onboardingIncomplete, pathname, ready, router, user]);

  if (!isCloudConfigured) return <>{children}</>;
  if (isPublicPath && (!user || !isAccountEntryPath)) return <>{children}</>;
  if (authStatus === "error" && !isPublicPath) {
    return <main className="grid min-h-screen place-items-center px-4"><section className="card w-full max-w-md p-7 text-center"><h1 className="text-2xl font-bold">Problema di connessione</h1><p className="mt-2 text-sm text-slate-600">Non è stato possibile verificare la sessione.</p><button type="button" className="btn btn-primary mt-6" onClick={()=>void retryAuth()}>Riprova</button><button type="button" className="btn btn-quiet mt-3 block w-full" onClick={()=>router.replace("/login")}>Torna al login</button></section></main>;
  }
  if (user && dataLoadStatus === "error" && !isPublicPath) {
    return <main className="grid min-h-screen place-items-center px-4"><section className="card w-full max-w-md p-7 text-center" aria-labelledby="data-load-error-title"><h1 id="data-load-error-title" className="text-2xl font-bold">Dati non disponibili</h1><p role="alert" className="mt-2 text-sm text-slate-600">{dataLoadError}</p><button type="button" className="btn btn-primary mt-6" onClick={()=>void retryData()}>Riprova caricamento</button></section></main>;
  }
  if (authStatus === "loading" || (user && !ready) || (authStatus === "unauthenticated" && !isPublicPath) || (user && isAccountEntryPath) || (user && ready && ((pathname === "/onboarding" && !onboardingIncomplete) || (onboardingIncomplete && pathname !== "/onboarding" && !isPublicPath)))) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  return <>{children}</>;
}
