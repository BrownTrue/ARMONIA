"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "./data-provider";

const items = [["◷", "Oggi", "/oggi"], ["□", "Calendario", "/calendario"], ["◎", "Pazienti", "/pazienti"], ["▧", "Materiali", "/materiali"], ["◔", "Statistiche", "/statistiche"], ["⚙", "Impostazioni", "/impostazioni"]] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const { data, connection, signOut } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [path]);
  useEffect(() => { if (!menuOpen) return; const previous = document.body.style.overflow; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); }; document.body.style.overflow = "hidden"; document.addEventListener("keydown", closeOnEscape); return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", closeOnEscape); }; }, [menuOpen]);
  const navItems = (mobile = false) => items.map(([icon, label, href]) => <Link className={`nav-link ${path === href ? "active" : ""} ${mobile ? "min-h-12 text-base" : ""}`} key={href} href={href} aria-current={path === href ? "page" : undefined}><span aria-hidden="true">{icon}</span><span>{label}</span></Link>);
  return <div className="min-h-screen md:flex">
    <aside className="hidden w-64 shrink-0 border-r border-sage-100 bg-white px-5 py-7 md:block"><Link href="/oggi" className="mb-10 flex items-center gap-3 text-xl font-bold"><Image src="/branding/logo-mark.svg" alt="" width={35} height={40} priority className="h-10 w-auto shrink-0"/>Armonia</Link><nav className="space-y-2" aria-label="Navigazione principale">{navItems()}</nav><Link href="/impostazioni" className="mt-12 block rounded-2xl bg-sage-50 p-4 text-sm"><p className="font-bold">{data.profile.firstName} {data.profile.lastName}</p><p className="mt-1 text-slate-500">{data.profile.profession}</p></Link></aside>
    <div className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-sage-100 bg-white/95 px-4 backdrop-blur md:hidden"><Link href="/oggi" className="flex items-center gap-2 font-bold"><Image src="/branding/logo-mark.svg" alt="" width={28} height={32} priority className="h-8 w-auto"/>Armonia</Link><button type="button" aria-label="Apri menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl bg-sage-50 text-xl text-sage-700">☰</button></div>
    {menuOpen && <div className="fixed inset-0 z-50 md:hidden" role="presentation"><button type="button" aria-label="Chiudi menu" className="absolute inset-0 bg-black/35" onClick={() => setMenuOpen(false)} /><aside id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Menu principale" className="absolute inset-y-0 right-0 flex w-[min(88vw,340px)] flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><span className="text-lg font-bold">Menu</span><button type="button" aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl bg-sage-50 text-xl">×</button></div><nav className="mt-6 space-y-2" aria-label="Navigazione mobile">{navItems(true)}</nav><div className="mt-auto border-t border-sage-100 pt-5"><p className="font-bold">{data.profile.firstName} {data.profile.lastName}</p><p className="mt-1 text-sm text-slate-500">{data.profile.profession}</p><Link href="/impostazioni" className="btn btn-quiet mt-4 block w-full">Impostazioni account</Link><button type="button" disabled={connection.kind === "local"} onClick={async () => { await signOut(); router.replace("/login"); }} className="btn mt-2 w-full bg-slate-100 text-slate-600 disabled:cursor-not-allowed disabled:text-slate-400">Esci dall’app</button></div></aside></div>}
    <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10 md:pt-10">{children}</main>
    <nav className="bottom-nav" aria-label="Navigazione rapida">{items.slice(0,5).map(([icon,label,href])=><Link key={href} href={href} aria-current={path===href?"page":undefined} className={`min-w-0 flex-1 text-center text-[11px] ${path===href?"font-bold text-sage-700":"text-slate-500"}`}><span aria-hidden="true" className="block text-lg">{icon}</span><span className="block truncate">{label}</span></Link>)}</nav>
  </div>;
}
