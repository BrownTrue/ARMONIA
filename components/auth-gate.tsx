"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isCloudConfigured, useData } from "@/components/data-provider";
import { loginPathFor, safeNextPath } from "@/lib/auth/routing";

const PUBLIC_PATHS = new Set(["/login", "/signup", "/check-email", "/forgot-password", "/reset-password", "/auth/error", "/about", "/privacy", "/landing-lab", "/landing-lab-v2", "/landing-lab-v3", "/landing-lab-v4"]);
const ACCOUNT_ENTRY_PATHS = new Set(["/login", "/signup", "/check-email", "/forgot-password", "/auth/error"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, retryAuth, user, ready, data } = useData();
  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isLandingPath = pathname === "/";
  const isAccountEntryPath = ACCOUNT_ENTRY_PATHS.has(pathname);
  const onboardingIncomplete = Boolean(user && ready && !data.profile.onboardingCompletedAt);

  useEffect(() => {
    if (!isCloudConfigured || authStatus === "loading" || authStatus === "error") return;
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.toString();
    if (authStatus === "unauthenticated" && !isPublicPath && !isLandingPath) router.replace(loginPathFor(`${pathname}${query ? `?${query}` : ""}`));
    if (user && ready && isLandingPath) router.replace(onboardingIncomplete ? "/onboarding" : "/oggi");
    if (user && isAccountEntryPath) router.replace(pathname === "/forgot-password" ? "/impostazioni" : safeNextPath(searchParams.get("next")));
    if (user && ready && pathname === "/onboarding" && !onboardingIncomplete) router.replace("/oggi");
    if (user && ready && onboardingIncomplete && pathname !== "/onboarding" && !isPublicPath) router.replace("/onboarding");
  }, [authStatus, isAccountEntryPath, isLandingPath, isPublicPath, onboardingIncomplete, pathname, ready, router, user]);

  if (!isCloudConfigured) return <>{children}</>;
  if (isLandingPath) {
    if (authStatus === "unauthenticated") return <>{children}</>;
    if (authStatus === "error") {
      return <main className="grid min-h-screen place-items-center px-4"><section className="card w-full max-w-md p-7 text-center"><h1 className="text-2xl font-bold">Problema di connessione</h1><p className="mt-2 text-sm text-slate-600">Non è stato possibile verificare la sessione.</p><button type="button" className="btn btn-primary mt-6" onClick={()=>void retryAuth()}>Riprova</button><button type="button" className="btn btn-quiet mt-3 block w-full" onClick={()=>router.replace("/login")}>Vai al login</button></section></main>;
    }
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  if (isPublicPath && !user) return <>{children}</>;
  if (authStatus === "error" && !isPublicPath) {
    return <main className="grid min-h-screen place-items-center px-4"><section className="card w-full max-w-md p-7 text-center"><h1 className="text-2xl font-bold">Problema di connessione</h1><p className="mt-2 text-sm text-slate-600">Non è stato possibile verificare la sessione.</p><button type="button" className="btn btn-primary mt-6" onClick={()=>void retryAuth()}>Riprova</button><button type="button" className="btn btn-quiet mt-3 block w-full" onClick={()=>router.replace("/login")}>Torna al login</button></section></main>;
  }
  if (authStatus === "loading" || (user && !ready) || (authStatus === "unauthenticated" && !isPublicPath) || (user && isAccountEntryPath) || (user && ready && ((pathname === "/onboarding" && !onboardingIncomplete) || (onboardingIncomplete && pathname !== "/onboarding" && !isPublicPath)))) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Caricamento…</div>;
  }
  return <>{children}</>;
}
