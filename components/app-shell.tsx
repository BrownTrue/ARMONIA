"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useData } from "./data-provider";

const desktopItems = [["◷", "Oggi", "/oggi"], ["□", "Calendario", "/calendario"], ["◎", "Pazienti", "/pazienti"], ["▧", "Risorse", "/risorse"], ["◔", "Statistiche", "/statistiche"], ["€", "Economia", "/economia"], ["⚙", "Impostazioni", "/impostazioni"]] as const;
const primaryMobileItems = [["◷", "Oggi", "/oggi"], ["□", "Calendario", "/calendario"], ["◎", "Pazienti", "/pazienti"], ["▧", "Risorse", "/risorse"]] as const;
const secondaryMobileItems = [["€", "Economia", "Incassi e prestazioni", "/economia"], ["◔", "Statistiche", "Andamento dell’attività", "/statistiche"], ["⚙", "Impostazioni", "Profilo e integrazioni", "/impostazioni"]] as const;
const isRouteActive = (path: string, href: string) => path === href || (href !== "/oggi" && path.startsWith(`${href}/`));
const isSecondaryRoute = (path: string) => secondaryMobileItems.some(([, , , href]) => isRouteActive(path, href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const { data, connection, signOut } = useData();
  const [moreOpen, setMoreOpen] = useState(false);
  const lastOpenerRef = useRef<HTMLButtonElement | null>(null), closeButtonRef = useRef<HTMLButtonElement>(null);
  const profileName = `${data.profile.firstName} ${data.profile.lastName}`.trim() || "Profilo Armonia";
  const initials = `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase() || "A";
  useEffect(() => setMoreOpen(false), [path]);
  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMoreOpen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); lastOpenerRef.current?.focus(); };
  }, [moreOpen]);
  const desktopNav = desktopItems.map(([icon, label, href]) => <Link className={`nav-link ${isRouteActive(path, href) ? "active" : ""}`} key={href} href={href} aria-current={isRouteActive(path, href) ? "page" : undefined}><span aria-hidden="true">{icon}</span><span>{label}</span></Link>);
  const closeMore = () => setMoreOpen(false);
  const openMore = (event: React.MouseEvent<HTMLButtonElement>) => { lastOpenerRef.current = event.currentTarget; setMoreOpen(true); };
  return <div className="min-h-screen md:flex">
    <aside className="hidden w-64 shrink-0 border-r border-sage-100 bg-white px-5 py-7 md:block"><Link href="/oggi" className="mb-10 flex items-center gap-3 text-xl font-bold"><Image src="/branding/logo-mark.svg" alt="" width={35} height={40} priority className="h-10 w-auto shrink-0"/>Armonia</Link><nav className="space-y-2" aria-label="Navigazione principale">{desktopNav}</nav><Link href="/impostazioni" className="mt-12 block rounded-2xl bg-sage-50 p-4 text-sm"><p className="font-bold">{data.profile.firstName} {data.profile.lastName}</p><p className="mt-1 text-slate-500">{data.profile.profession}</p></Link></aside>
    <div className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-sage-100 bg-white/95 px-4 backdrop-blur md:hidden"><Link href="/oggi" className="flex items-center gap-2 font-bold"><Image src="/branding/logo-mark.svg" alt="" width={28} height={32} priority className="h-8 w-auto"/>Armonia</Link><button type="button" aria-label="Apri account e altre sezioni" aria-expanded={moreOpen} aria-controls="mobile-more-sheet" onClick={openMore} className="grid h-11 w-11 place-items-center rounded-full bg-sage-100 text-sm font-bold text-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">{initials}</button></div>
    {moreOpen && <div className="fixed inset-0 z-50 md:hidden" role="presentation"><button type="button" aria-label="Chiudi Altro" className="absolute inset-0 bg-slate-950/35" onClick={closeMore}/><section id="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" className="absolute inset-x-0 bottom-0 flex max-h-[min(88dvh,46rem)] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl"><div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200" aria-hidden="true"/><header className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-4"><div><h2 id="mobile-more-title" className="text-2xl font-bold">Altro</h2><p className="mt-1 text-sm text-slate-500">Strumenti, andamento e account.</p></div><button ref={closeButtonRef} type="button" aria-label="Chiudi Altro" onClick={closeMore} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-50 text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">×</button></header><div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><nav className="space-y-1" aria-label="Altre sezioni">{secondaryMobileItems.map(([icon, label, subtitle, href], index) => <Link key={href} href={href} onClick={closeMore} aria-current={isRouteActive(path, href) ? "page" : undefined} className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${index === 0 ? "bg-sage-50" : "hover:bg-slate-50"}`}><span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${index === 0 ? "bg-sage-100 text-sage-800" : "bg-slate-100 text-slate-600"}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block font-bold">{label}</span><span className="block truncate text-xs text-slate-500">{subtitle}</span></span><span aria-hidden="true" className="text-slate-400">›</span></Link>)}</nav><div className="mt-4 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-100 text-sm font-bold text-sage-800">{initials}</span><div className="min-w-0"><p className="truncate font-bold">{profileName}</p>{data.profile.profession && <p className="truncate text-sm text-slate-500">{data.profile.profession}</p>}</div></div><Link href="/impostazioni" onClick={closeMore} className="mt-3 flex min-h-11 items-center justify-between rounded-xl px-2 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"><span>Impostazioni account</span><span aria-hidden="true">›</span></Link><button type="button" disabled={connection.kind === "local"} onClick={async () => { closeMore(); await signOut(); router.replace("/login"); }} className="mt-1 min-h-11 w-full rounded-xl px-2 text-left text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:text-slate-400">Esci dall’app</button></div></div></section></div>}
    <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10 md:pt-10">{children}</main>
    <nav className="bottom-nav" aria-label="Navigazione rapida">{primaryMobileItems.map(([icon, label, href]) => <Link key={href} href={href} aria-current={isRouteActive(path, href) ? "page" : undefined} className={`min-h-12 min-w-0 flex-1 py-1 text-center text-[11px] ${isRouteActive(path, href) ? "font-bold text-sage-700" : "text-slate-500"}`}><span aria-hidden="true" className="block text-lg">{icon}</span><span className="block truncate">{label}</span></Link>)}<button type="button" aria-label="Apri altre sezioni" aria-expanded={moreOpen} aria-controls="mobile-more-sheet" onClick={openMore} className={`min-h-12 min-w-0 flex-1 py-1 text-center text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-500 ${isSecondaryRoute(path) || moreOpen ? "font-bold text-sage-700" : "text-slate-500"}`}><span aria-hidden="true" className="block text-lg">•••</span><span className="block truncate">Altro</span></button></nav>
  </div>;
}
