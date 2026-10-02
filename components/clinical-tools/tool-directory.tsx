"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clinicalAreaLabel, filterClinicalTools, licenseStatusLabel, primaryLink, searchClinicalTools, toolTypeLabel } from "@/lib/clinical-tools/search";
import type { ClinicalToolAreaFilter, ClinicalToolAudienceFilter, ClinicalToolCatalogEntry, ClinicalToolStatusFilter } from "@/lib/clinical-tools/types";

const CLINICAL_FILTERS = [
  ["all", "Tutti"], ["pediatric", "Età evolutiva"], ["adult", "Adulti"], ["language", "Linguaggio"], ["voice", "Voce"], ["swallowing", "Deglutizione"], ["fluency", "Fluenza"], ["aac", "CAA"], ["literacy", "Lettura/Scrittura"],
] as const;
const STATUS_FILTERS = [["all", "Tutti"], ["integrated", "Integrati"], ["open_verified", "Open verificati"], ["external", "Esterni"], ["permission_required", "Licenza richiesta"]] as const;

export function ClinicalToolDirectory({ tools }: { tools: readonly ClinicalToolCatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [clinicalFilter, setClinicalFilter] = useState<(typeof CLINICAL_FILTERS)[number][0]>("all");
  const [status, setStatus] = useState<ClinicalToolStatusFilter>("all");
  const filtered = useMemo(() => {
    const audience: ClinicalToolAudienceFilter = clinicalFilter === "pediatric" || clinicalFilter === "adult" ? clinicalFilter : "all";
    const area: ClinicalToolAreaFilter = clinicalFilter === "pediatric" || clinicalFilter === "adult" ? "all" : clinicalFilter;
    return filterClinicalTools(searchClinicalTools(tools, query), audience, area, status);
  }, [clinicalFilter, query, status, tools]);

  return <>
    <section aria-label="Ricerca e filtri" className="mt-8 rounded-[1.5rem] border border-sage-100/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(43,69,55,.055)] sm:p-5">
      <label htmlFor="clinical-tools-search" className="sr-only">Cerca uno strumento</label>
      <div className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sage-500"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <input id="clinical-tools-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={'Cerca “disfagia”, “afasia”, “voce”, “EAT-10”…'} className="min-h-12 w-full rounded-2xl border border-sage-100 bg-slate-50/80 py-3 pl-12 pr-4 text-base outline-none transition placeholder:text-slate-400 focus:border-sage-500 focus:bg-white focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2" />
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 sm:grid sm:grid-cols-2 sm:gap-5">
        <FilterRow label="Area o popolazione" options={CLINICAL_FILTERS} value={clinicalFilter} onChange={setClinicalFilter} />
        <FilterRow label="Disponibilità" options={STATUS_FILTERS} value={status} onChange={setStatus} />
      </div>
    </section>
    <div className="mt-7 flex items-end justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-slate-400">Directory</p><p className="mt-1 text-sm text-slate-500" aria-live="polite"><strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "strumento trovato" : "strumenti trovati"}</p></div></div>
    {filtered.length ? <div className="mt-5 grid gap-5 lg:grid-cols-2">{filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div> : <div className="mt-5 rounded-[1.5rem] border border-dashed border-sage-200 bg-gradient-to-br from-sage-50/70 to-white px-6 py-12 text-center"><span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl text-sage-600 shadow-sm">⌕</span><h2 className="mt-4 text-lg font-bold">Nessuno strumento trovato</h2><p className="mt-2 text-sm text-slate-500">Prova a modificare ricerca o filtri.</p></div>}
  </>;
}

function FilterRow<T extends string>({ label, options, value, onChange }: { label: string; options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void }) {
  return <fieldset className="min-w-0 pt-2 sm:pt-0"><legend className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</legend><div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 pr-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">{options.map(([key, text]) => <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)} className={`min-h-11 shrink-0 rounded-full border px-3.5 text-xs font-bold outline-none transition sm:min-h-9 ${value === key ? "border-sage-600 bg-sage-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-sage-300 hover:bg-sage-50"} focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2`}>{text}</button>)}</div></fieldset>;
}

function ToolCard({ tool }: { tool: ClinicalToolCatalogEntry }) {
  const link = primaryLink(tool);
  return <article className="group flex min-w-0 flex-col rounded-[1.6rem] border border-slate-200/90 bg-white p-5 shadow-[0_14px_38px_rgba(43,69,55,.045)] transition hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-[0_20px_45px_rgba(43,69,55,.08)] sm:p-6">
    <div className="flex min-w-0 items-start gap-4">
      <ToolMonogram tool={tool} />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="min-w-0 text-lg font-bold leading-tight text-slate-900 sm:text-xl">{tool.acronym || tool.name}</h2>{tool.version && <span className="text-xs font-semibold text-slate-400">{tool.version}</span>}</div>{tool.acronym && <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{tool.name}</p>}</div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-bold text-sage-800">{clinicalAreaLabel(tool.clinicalAreas[0])}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{toolTypeLabel(tool.toolType)}</span>{tool.id === "iddsi-framework-it" && <><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">Versione italiana ufficiale</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">Materiali ufficiali disponibili</span></>}</div>
    <p className="mt-4 text-base font-bold text-slate-800">{tool.population.label}</p>
    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">{tool.shortDescription}</p>
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tool.licenseStatus === "open_verified" ? "bg-emerald-50 text-emerald-800" : tool.licenseStatus === "permission_required" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700"}`}>{licenseStatusLabel(tool.licenseStatus)}</span><span className="text-xs font-semibold text-slate-500">{tool.integrationStatus === "integrated" ? "Integrato in ARMONIA" : tool.integrationStatus === "external" ? "Strumento esterno" : "Presente nel catalogo"}</span></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/risorse/strumenti/${tool.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-sage-700 px-4 text-sm font-bold text-white transition hover:bg-sage-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Vedi scheda</Link>{link && <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-sage-700 transition hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">{link.label}</a>}</div>
  </article>;
}

export function ToolMonogram({ tool, large = false }: { tool: ClinicalToolCatalogEntry; large?: boolean }) {
  const letters = tool.acronym?.trim() || tool.name.split(/\s+/).filter((part) => part.length > 2).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-2xl font-black tracking-tight ${large ? "h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl" : "h-12 w-12 text-sm sm:h-14 sm:w-14"} ${monogramTone(tool.clinicalAreas)}`}>{letters.slice(0, 5)}</span>;
}

function monogramTone(areas: readonly string[]) {
  const joined = areas.join(" ");
  if (/voce/.test(joined)) return "bg-sky-100 text-sky-800";
  if (/disfagia|deglutizione|feeding|alimentazione|orofacciali/.test(joined)) return "bg-amber-100 text-amber-900";
  if (/fluenza|balbuzie/.test(joined)) return "bg-violet-100 text-violet-800";
  if (/afasia|adulto|neuropsicologia|motor_speech|disartria|aprassia/.test(joined)) return "bg-indigo-100 text-indigo-800";
  if (/caa|comunicazione/.test(joined)) return "bg-teal-100 text-teal-800";
  if (/lettura|scrittura|ortografia|testo/.test(joined)) return "bg-slate-200 text-slate-700";
  return "bg-sage-100 text-sage-800";
}
