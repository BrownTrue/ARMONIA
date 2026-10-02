"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { visibleClinicalTools } from "@/lib/clinical-tools/catalog";
import { clinicalAreaLabel, licenseStatusLabel, searchClinicalTools, toolTypeLabel } from "@/lib/clinical-tools/search";
import type { ClinicalToolCatalogEntry } from "@/lib/clinical-tools/types";

export function ClinicalToolSelector({ onSelect, onClose, initialClinicalArea }: { onSelect: (tool: ClinicalToolCatalogEntry) => void; onClose: () => void; initialClinicalArea?: string }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchClinicalTools(visibleClinicalTools, query).filter((tool) => !initialClinicalArea || tool.clinicalAreas.includes(initialClinicalArea)), [initialClinicalArea, query]);
  return <Modal title="Catalogo strumenti ARMONIA" onClose={onClose}>
    <p className="text-sm leading-6 text-slate-500">Selezionare uno strumento lo registra nella valutazione. ARMONIA non lo somministra e non interpreta i risultati.</p>
    <label htmlFor="assessment-tool-search" className="mt-5 block text-sm font-bold">Cerca nel catalogo</label><input autoFocus id="assessment-tool-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, acronimo, area…" className="mt-2 min-h-11 w-full rounded-xl border border-sage-100 px-4 outline-none focus:border-sage-500 focus-visible:ring-2 focus-visible:ring-sage-500" />
    <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto pr-1">{results.length ? results.map((tool) => <article key={tool.id} className="rounded-2xl border border-sage-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="font-bold">{tool.acronym || tool.name}</h3>{tool.acronym && <p className="mt-1 text-xs text-slate-500">{tool.name}</p>}<p className="mt-2 text-xs font-semibold text-sage-700">{clinicalAreaLabel(tool.clinicalAreas[0])} · {toolTypeLabel(tool.toolType)} · {tool.population.label}</p><p className="mt-1 text-xs text-slate-500">{licenseStatusLabel(tool.licenseStatus)}</p></div><button type="button" onClick={() => onSelect(tool)} className="btn btn-primary shrink-0 text-sm">Aggiungi alla valutazione</button></div><Link href={`/risorse/strumenti/${tool.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-sage-700">Vedi scheda completa ↗</Link></article>) : <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Nessuno strumento trovato.</p>}</div>
  </Modal>;
}
