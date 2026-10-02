"use client";

import Link from "next/link";
import { useData } from "@/components/data-provider";
import { duplicatePatientWorksheet } from "@/lib/exercise-lab/patient-worksheets";
import { getPatientMaterials, getRecentPatientMaterials } from "@/lib/patient-resources";
import type { RecentPatientMaterial } from "@/lib/patient-resources";
import type { Material } from "@/lib/types";
import { uid } from "@/lib/types";

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

export function PatientResourcesSection({ patientId }: { patientId: string }) {
  const { data, openMaterial, savePatientWorksheet, deletePatientWorksheet } = useData();
  const worksheets = data.patientWorksheets.filter((item) => item.patientId === patientId).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const patientMaterials = getPatientMaterials(data.materials, patientId);
  const recentMaterials = getRecentPatientMaterials(data.sessions, data.materials, patientId);
  const createHref = `/risorse/laboratorio/crea?patient=${encodeURIComponent(patientId)}`;

  return <div className="mt-4 space-y-4 sm:mt-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold">Risorse</h2><p className="mt-0.5 text-sm text-slate-500 sm:mt-1">Schede di attività e materiali collegati al paziente.</p></div>
      <details className="relative"><summary className="btn btn-primary cursor-pointer list-none text-sm">+ Aggiungi</summary><div className="absolute right-0 z-20 mt-2 min-w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><Link href={createHref} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">Crea scheda nel Laboratorio</Link><Link href="/materiali" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">Gestisci materiali nella Libreria</Link></div></details>
    </div>

    <section className="card p-4 sm:p-5" aria-labelledby="patient-worksheets-title">
      <div><h3 id="patient-worksheets-title" className="font-bold">Schede ed esercizi</h3><p className="mt-1 text-sm text-slate-500">Schede concrete preparate nel Laboratorio per questo paziente.</p></div>
      {worksheets.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{worksheets.map((worksheet) => <article key={worksheet.id} className="rounded-2xl border border-sage-100 bg-sage-50/40 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words font-bold text-slate-900">{worksheet.title}</h4><p className="mt-1 text-xs text-slate-500">Aggiornata il {formatDate(worksheet.updatedAt)} · {worksheet.worksheetSnapshot.blocks.length} {worksheet.worksheetSnapshot.blocks.length === 1 ? "attività" : "attività"}</p></div><details className="relative shrink-0"><summary aria-label={`Altre azioni per ${worksheet.title}`} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl text-lg font-bold text-slate-500 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">•••</summary><div className="absolute right-0 z-10 mt-1 min-w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"><button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={() => { const timestamp = new Date().toISOString(); void savePatientWorksheet(duplicatePatientWorksheet(worksheet, uid(), timestamp)); }}>Duplica</button><button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={() => { if (window.confirm(`Eliminare la scheda “${worksheet.title}”?`)) void deletePatientWorksheet(worksheet.id); }}>Elimina</button></div></details></div><div className="mt-4 flex flex-wrap gap-2"><Link href={`${createHref}&worksheet=${encodeURIComponent(worksheet.id)}`} className="btn btn-primary text-sm">Apri</Link><Link href={`${createHref}&worksheet=${encodeURIComponent(worksheet.id)}&view=print`} className="btn btn-secondary text-sm">Stampa</Link></div></article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-sage-200 bg-sage-50/30 p-5 text-center"><p className="text-sm text-slate-600">Nessuna scheda collegata.</p><Link href={createHref} className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-sage-700">Crea la prima scheda</Link></div>}
    </section>

    <section className="card p-4 sm:p-5" aria-labelledby="patient-materials-title">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="patient-materials-title" className="font-bold">Materiali</h3><p className="mt-1 text-sm text-slate-500">File e link della Libreria associati o usati nelle sedute.</p></div><Link href="/materiali" className="text-sm font-bold text-sage-700">Apri Libreria</Link></div>
      <div className="mt-4 grid gap-5 lg:grid-cols-2"><div><h4 className="mb-2 text-sm font-bold text-slate-700">Materiali del paziente</h4>{patientMaterials.length ? <div className="space-y-2">{patientMaterials.map((material) => <PatientMaterialRow key={material.id} material={material} onOpen={() => void openMaterial(material,{newTab:true})} />)}</div> : <p className="text-sm text-slate-500">Nessun materiale associato.</p>}</div><div className="border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><h4 className="mb-2 text-sm font-bold text-slate-700">Usati recentemente</h4>{recentMaterials.length ? <div className="space-y-2">{recentMaterials.map((entry) => <RecentMaterialRow key={entry.materialId} entry={entry} onOpen={entry.material ? () => void openMaterial(entry.material!,{newTab:true}) : undefined} />)}</div> : <p className="text-sm text-slate-500">Nessun materiale utilizzato nelle sedute.</p>}</div></div>
    </section>
  </div>;
}

function PatientMaterialRow({ material, onOpen }: { material: Material; onOpen: () => void }) {
  return <div className="flex min-w-0 items-start justify-between gap-2 rounded-xl bg-slate-50 p-2.5 sm:gap-3 sm:p-3"><div className="min-w-0"><p className="break-words text-sm font-bold">{material.title}</p><p className="mt-1 text-xs text-slate-500">{materialFormatLabel(material)}</p>{material.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{material.tags.map((tag) => <span key={tag} className="rounded-full bg-sage-50 px-2 py-0.5 text-[11px] text-sage-700">{tag}</span>)}</div>}</div><button type="button" onClick={onOpen} className="min-h-10 shrink-0 rounded-lg px-2.5 text-sm font-bold text-sage-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Apri</button></div>;
}

function RecentMaterialRow({ entry, onOpen }: { entry: RecentPatientMaterial; onOpen?: () => void }) {
  return <div className="flex min-w-0 items-start justify-between gap-2 rounded-xl bg-slate-50 p-2.5 sm:gap-3 sm:p-3"><div className="min-w-0"><p className={`break-words text-sm font-bold ${entry.material ? "" : "text-slate-500"}`}>{entry.material?.title || "Materiale non più disponibile"}</p><p className="mt-1 text-xs text-slate-500">Ultimo utilizzo: {new Date(`${entry.lastUsedOn}T12:00:00`).toLocaleDateString("it-IT")}{entry.material ? ` · ${materialFormatLabel(entry.material)}` : ""}</p></div>{onOpen && <button type="button" onClick={onOpen} className="min-h-10 shrink-0 rounded-lg px-2.5 text-sm font-bold text-sage-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Apri</button>}</div>;
}

function materialFormatLabel(material: Material) {
  if (material.externalUrl) return "Link esterno";
  if (material.mimeType === "application/pdf") return "PDF";
  if (material.mimeType.startsWith("image/")) return "Immagine";
  if (material.mimeType.startsWith("audio/")) return "Audio";
  if (material.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "DOCX";
  const extension = material.fileName.split(".").pop()?.toUpperCase();
  return extension && extension !== material.fileName.toUpperCase() ? extension : "File";
}
