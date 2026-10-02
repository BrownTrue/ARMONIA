"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useData } from "@/components/data-provider";
import { ResourceAreaShell } from "@/components/resource-area-shell";
import { ExerciseLabBuilder } from "@/components/exercise-lab-builder";
import { fullName } from "@/lib/types";

export default function ExerciseLabCreatePage() {
  return <Suspense fallback={<ResourceAreaShell title="Nuova scheda" description="Componi attività e materiali da usare in seduta o da stampare." icon="◇" tone="bg-emerald-50 text-emerald-700"><p className="mt-8 text-sm text-slate-500">Caricamento…</p></ResourceAreaShell>}><ExerciseLabCreateContent /></Suspense>;
}

function ExerciseLabCreateContent() {
  const params = useSearchParams();
  const { data, ready } = useData();
  const patientId = params.get("patient") || undefined;
  const worksheetId = params.get("worksheet") || undefined;
  const initialSection = params.get("mode") === "templates" ? "templates" : params.get("mode") === "saved" ? "saved" : undefined;
  const patient = patientId ? data.patients.find((item) => item.id === patientId) : undefined;
  const patientWorksheet = worksheetId ? data.patientWorksheets.find((item) => item.id === worksheetId && item.patientId === patientId) : undefined;
  const invalidContext = ready && ((patientId && !patient) || (worksheetId && !patientWorksheet));

  return <ResourceAreaShell title={patientWorksheet ? "Modifica scheda" : "Nuova scheda"} description="Componi attività e materiali da usare in seduta o da stampare." icon="◇" tone="bg-emerald-50 text-emerald-700">
    <div className="mt-5 flex flex-wrap gap-4"><Link href="/risorse/laboratorio" className="inline-flex text-sm font-bold text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">← Torna al Laboratorio</Link><Link href="/risorse/laboratorio/contenuti" className="inline-flex text-sm font-bold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">Banca contenuti →</Link></div>
    {!ready ? <p className="mt-8 text-sm text-slate-500">Caricamento…</p> : invalidContext ? <section role="alert" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Scheda o paziente non disponibile</h2><p className="mt-2 text-sm text-amber-900">Il collegamento non è valido oppure la risorsa non appartiene a questo paziente.</p><Link href="/pazienti" className="mt-4 inline-flex text-sm font-bold text-amber-950">Torna ai pazienti</Link></section> : <>
      {patient && <aside className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sage-200 bg-sage-50 p-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-sage-700">Scheda paziente</p><p className="mt-1 text-sm text-slate-700">Stai preparando una scheda per <strong>{fullName(patient)}</strong>.</p></div><Link href={`/pazienti/${patient.id}?tab=resources`} className="text-sm font-bold text-sage-800">Torna alle Risorse</Link></aside>}
      <ExerciseLabBuilder patient={patient} patientWorksheet={patientWorksheet} initialPrint={params.get("view") === "print"} initialSection={initialSection} />
    </>}
  </ResourceAreaShell>;
}
