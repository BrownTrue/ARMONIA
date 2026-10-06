"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { MobileResourceDirectory } from "@/components/resources/mobile-resource-directory";
import { formatStorageBytes } from "@/lib/therapeutic-library/files";
import { filterResourceMaterials, materialKind, recentMaterials } from "@/lib/resources-home";
import type { Material } from "@/lib/types";

type StorageSummary = { quotaBytes: number; usedBytes: number; reservedBytes: number; requiresReconciliation?: boolean };
type ResourceFilter = "all" | "favorites";

const areas = [
  { title: "Materiali del terapista", description: "File caricati dal terapista e collegabili a pazienti e sedute.", href: "/materiali", action: "Apri libreria", icon: "▱", tone: "border-sage-200 bg-sage-50/70 text-sage-800", iconTone: "bg-sage-100", upcoming: false },
  { title: "Modulistica e handout", description: "Attestazioni professionali e materiali informativi pronti per pazienti, famiglie e contesti educativi.", href: "/risorse/documenti", action: "Apri modulistica", icon: "▤", tone: "border-sky-100 bg-sky-50/70 text-sky-900", iconTone: "bg-sky-100", upcoming: false },
  { title: "Strumenti clinici ARMONIA", description: "Directory professionale di strumenti di screening, valutazione e monitoraggio collegabili al Percorso clinico.", href: "/risorse/strumenti", action: "Apri directory", icon: "✣", tone: "border-amber-100 bg-amber-50/70 text-amber-950", iconTone: "bg-amber-100", upcoming: false },
  { title: "Laboratorio esercizi ARMONIA", description: "Crea schede terapeutiche, combina attività e prepara materiali da usare in seduta o da stampare.", href: "/risorse/laboratorio", action: "Apri laboratorio", icon: "◇", tone: "border-violet-100 bg-violet-50/70 text-violet-950", iconTone: "bg-violet-100", upcoming: false },
] as const;

export default function ResourcesPage() {
  const { data, connection, openMaterial, saveMaterial } = useData();
  const [storage, setStorage] = useState<StorageSummary | null>(null);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const favoriteFlight = useRef(new Set<string>());
  const [filter, setFilter] = useState<ResourceFilter>("all");
  useEffect(() => {
    if (connection.kind !== "cloud") { setStorage(null); setStorageUnavailable(false); return; }
    let active = true;
    setStorageUnavailable(false);
    fetch("/api/materials/storage", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((summary) => { if (active) setStorage(summary); }).catch(() => { if (active) { setStorage(null); setStorageUnavailable(true); } });
    return () => { active = false; };
  }, [connection.kind]);
  const recent = useMemo(() => filterResourceMaterials(recentMaterials(data.materials), filter), [data.materials, filter]);
  const favorite = async (material: Material) => {
    if (favoriteFlight.current.has(material.id)) return;
    favoriteFlight.current.add(material.id); setFavoriteIds((current) => new Set(current).add(material.id)); setFavoriteError("");
    try { await saveMaterial({ ...material, favorite: !material.favorite }); }
    catch { setFavoriteError("Non è stato possibile aggiornare i preferiti. Riprova."); }
    finally { favoriteFlight.current.delete(material.id); setFavoriteIds((current) => { const next = new Set(current); next.delete(material.id); return next; }); }
  };
  const used = storage ? storage.usedBytes + storage.reservedBytes : undefined;
  return <AppShell>
    <MobileResourceDirectory areas={areas}/>
    <div className="hidden md:block">
    <header className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-sage-600">Workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Risorse</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">Materiali, documenti, strumenti clinici ed esercizi per il lavoro quotidiano.</p>
    </header>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Aree Risorse">
      {areas.map((area, index) => <Link key={area.href} href={area.href} className={`group flex min-h-64 flex-col rounded-[1.6rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(43,69,55,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${area.tone}`}>
        <div className="flex items-start justify-between gap-3"><span className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${area.iconTone}`} aria-hidden="true">{area.icon}</span>{area.upcoming && <span className="rounded-full border border-current/10 bg-white/60 px-2.5 py-1 text-[11px] font-bold">In preparazione</span>}</div>
        <h2 className="mt-7 text-xl font-bold leading-tight">{area.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{area.description}</p>
        {index === 0 && <div className="mt-4 border-t border-sage-200/70 pt-3 text-sm"><strong>{data.materials.length}</strong> {data.materials.length === 1 ? "materiale" : "materiali"}{used !== undefined && storage && !storage.requiresReconciliation ? <span className="mt-1 block text-xs text-slate-500">{formatStorageBytes(used)} di {formatStorageBytes(storage.quotaBytes)}</span> : storageUnavailable ? <span className="mt-1 block text-xs text-slate-500">Spazio utilizzato temporaneamente non disponibile.</span> : null}</div>}
        <span className="mt-5 inline-flex min-h-11 items-center font-bold">{area.action}<span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
      </Link>)}
    </section>

    <section className="mt-10" aria-labelledby="recent-resources-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 id="recent-resources-title" className="text-2xl font-bold">Risorse recenti</h2><p className="mt-1 text-sm text-slate-500">Gli ultimi materiali presenti nella tua Libreria.</p></div>
        <div className="flex gap-2" aria-label="Filtra risorse recenti">{([['all', 'Tutti'], ['favorites', 'Preferiti']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${filter === value ? "border-sage-600 bg-sage-700 text-white" : "border-sage-100 bg-white text-sage-700"}`}>{label}</button>)}</div>
      </div>
      {favoriteError && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{favoriteError}</p>}
      {recent.length ? <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-sage-100 bg-white">{recent.map((material, index) => <RecentMaterial key={material.id} material={material} last={index === recent.length - 1} busy={favoriteIds.has(material.id)} onOpen={() => void openMaterial(material, { newTab: true })} onFavorite={() => void favorite(material)} />)}</div> : <div className="mt-5 rounded-[1.5rem] border border-dashed border-sage-200 bg-white p-8 text-center"><p className="font-bold">{filter === "favorites" ? "Nessun preferito recente" : "Nessun materiale disponibile"}</p><p className="mt-2 text-sm text-slate-500">{filter === "favorites" ? "Aggiungi una stella ai materiali che vuoi ritrovare più facilmente." : "Apri la Libreria per caricare un file o aggiungere un link."}</p><Link href="/materiali" className="mt-4 inline-flex min-h-11 items-center font-bold text-sage-700">Apri libreria →</Link></div>}
    </section>
    </div>
  </AppShell>;
}

function RecentMaterial({ material, last, busy, onOpen, onFavorite }: { material: Material; last: boolean; busy: boolean; onOpen: () => void; onFavorite: () => void }) {
  return <article className={`flex items-center gap-3 p-4 sm:gap-4 sm:px-5 ${last ? "" : "border-b border-sage-100"}`}>
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sage-50 text-xs font-bold text-sage-700" aria-hidden="true">{materialKind(material).slice(0, 4).toUpperCase()}</span>
    <div className="min-w-0 flex-1"><h3 className="truncate font-bold">{material.title}</h3><p className="mt-1 truncate text-xs text-slate-500">{materialKind(material)} · {material.category}{material.tags.length ? ` · ${material.tags.slice(0, 2).join(", ")}` : ""}</p></div>
    <button type="button" disabled={busy} aria-busy={busy} onClick={onFavorite} aria-label={material.favorite ? `Rimuovi ${material.title} dai preferiti` : `Aggiungi ${material.title} ai preferiti`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 disabled:cursor-wait disabled:opacity-60">{material.favorite ? "★" : "☆"}</button>
    <button type="button" onClick={onOpen} className="hidden min-h-11 rounded-xl bg-sage-50 px-4 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 sm:block">Apri</button>
    <button type="button" onClick={onOpen} aria-label={`Apri ${material.title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sage-50 font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 sm:hidden">→</button>
  </article>;
}
