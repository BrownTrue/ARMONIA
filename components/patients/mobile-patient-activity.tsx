"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { clinicalAssessmentTypeLabel } from "@/lib/patient-overview";
import { groupMobilePatientActivity, type MobilePatientActivityItem } from "@/lib/patient-mobile-activity";
import type { PatientTimelineFilter } from "@/lib/clinical/timeline";
import type { Session } from "@/lib/types";

export function MobilePatientActivity({ patientId, items, filter, query, onFilterChange, onQueryChange, onOpenSession, onDeleteSession }: {
  patientId: string;
  items: MobilePatientActivityItem[];
  filter: PatientTimelineFilter;
  query: string;
  onFilterChange: (filter: PatientTimelineFilter) => void;
  onQueryChange: (query: string) => void;
  onOpenSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}) {
  const [actions, setActions] = useState<Extract<MobilePatientActivityItem, { kind: "session" }> | null>(null);
  const groups = groupMobilePatientActivity(items);
  return <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 md:hidden">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-[1.35rem] font-bold tracking-[-0.025em] text-[#24352f]">Attività</h2><p className="mt-1 text-sm leading-5 text-slate-500">Sedute, appuntamenti e valutazioni in ordine cronologico.</p></div><Link href={`/sedute/nuova?p=${patientId}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-white px-3 text-xs font-semibold text-sage-800 transition-colors active:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">Registra seduta</Link></div>
    <div className="mt-5 space-y-3">
      <label className="block"><span className="sr-only">Cerca nelle attività</span><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cerca nelle attività…" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sage-400 focus-visible:ring-2 focus-visible:ring-sage-300"/></label>
      <div aria-label="Filtra la storia clinica" className="flex gap-1 rounded-xl bg-sage-50 p-1">{([['all','Tutte'],['sessions','Sedute'],['assessments','Valutazioni']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => onFilterChange(value)} className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${filter === value ? "bg-white text-sage-800 shadow-sm" : "text-slate-500"}`}>{label}</button>)}</div>
    </div>

    {groups.length ? <div className="mt-7 space-y-8">{groups.map((group) => <section key={group.date} aria-labelledby={`activity-date-${group.date}`}><h3 id={`activity-date-${group.date}`} className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{group.label}</h3><div className="divide-y divide-slate-200 border-y border-slate-200">{group.items.map((item) => item.kind === "session" ? <SessionActivityRow key={item.id} item={item} onOpen={() => onOpenSession(item.item.session)} onActions={() => setActions(item)}/> : item.kind === "appointment" ? <AppointmentActivityRow key={item.id} item={item}/> : <AssessmentActivityRow key={item.id} item={item} patientId={patientId}/>)}</div></section>)}</div> : <div className="mt-8 rounded-2xl bg-sage-50/70 px-5 py-7 text-center"><p className="font-bold text-slate-800">{query.trim() || filter !== "all" ? "Nessuna attività corrisponde ai filtri." : "Nessuna attività registrata."}</p><p className="mt-2 text-sm leading-5 text-slate-500">Puoi registrare una seduta manuale quando serve.</p><Link href={`/sedute/nuova?p=${patientId}`} className="btn btn-primary mt-5 min-h-11">Registra seduta</Link></div>}

    {actions && <Modal title="Azioni seduta" onClose={() => setActions(null)}><div className="divide-y divide-slate-100"><button type="button" onClick={() => { const session = actions.item.session; setActions(null); onOpenSession(session); }} className="flex min-h-14 w-full items-center text-left text-sm font-bold text-slate-800">Apri o modifica seduta</button><button type="button" onClick={() => { const session = actions.item.session; setActions(null); onDeleteSession(session); }} className="flex min-h-14 w-full items-center text-left text-sm font-bold text-red-600">Elimina seduta</button></div></Modal>}
  </div>;
}

function SessionActivityRow({ item, onOpen, onActions }: { item: Extract<MobilePatientActivityItem, { kind: "session" }>; onOpen: () => void; onActions: () => void }) {
  const session = item.item.session;
  const location = item.item.appointment?.locationNameSnapshot;
  const summary = session.result.trim() || session.activities.trim();
  return <article className="flex items-stretch gap-1 py-3.5"><button type="button" onClick={onOpen} aria-label={`Apri seduta del ${formatDate(item.occurredOn)}`} className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left active:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-sage-500"/><p className="text-sm font-bold text-slate-800">{item.time || "Seduta"}</p><span className="text-xs text-slate-400">{session.duration} min</span></div><p className="mt-1.5 text-sm font-semibold text-slate-800">{session.serviceNameSnapshot || "Seduta registrata"}</p><p className="mt-0.5 text-xs font-bold text-sage-700">✓ Registrata</p>{location && <p className="mt-1 text-sm text-slate-500">{location}</p>}{summary && <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{summary}</p>}</button><button type="button" aria-label={`Altre azioni per la seduta del ${formatDate(item.occurredOn)}`} onClick={onActions} className="grid min-h-11 w-11 shrink-0 place-items-center self-start rounded-xl text-lg font-bold text-slate-500 active:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">•••</button></article>;
}

function AppointmentActivityRow({ item }: { item: Extract<MobilePatientActivityItem, { kind: "appointment" }> }) {
  const appointment = item.appointment;
  const metadata = [appointment.serviceNameSnapshot, appointment.locationNameSnapshot, `${appointment.duration} min`].filter(Boolean).join(" · ");
  if (item.state === "cancelled") return <article className="py-4 opacity-60"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-slate-400"/><p className="text-sm font-bold text-slate-700 line-through">{item.time} · Appuntamento annullato</p></div>{metadata && <p className="ml-[1.125rem] mt-1 text-sm text-slate-500">{metadata}</p>}<p className="ml-[1.125rem] mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Annullato</p></article>;
  if (item.state === "pending") return <article className="py-4"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber-400"/><p className="text-sm font-bold text-slate-800">{item.time} · Seduta da registrare</p></div>{metadata && <p className="ml-[1.125rem] mt-1 text-sm text-slate-500">{metadata}</p>}<Link href={`/sedute/nuova?a=${appointment.id}&p=${appointment.patientId}`} className="btn btn-primary ml-[1.125rem] mt-3 min-h-11 text-sm">Registra seduta</Link></article>;
  return <Link href="/calendario" aria-label={`Apri appuntamento del ${formatDate(item.occurredOn)} alle ${item.time} nel calendario`} className="block rounded-xl py-4 active:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><div className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border-2 border-sage-400 bg-white"/><p className="text-sm font-bold text-slate-700">{item.time} · Appuntamento futuro</p></div>{metadata && <p className="ml-[1.125rem] mt-1 text-sm text-slate-500">{metadata}</p>}<p className="ml-[1.125rem] mt-1 text-xs font-bold text-sage-700">Apri calendario</p></Link>;
}

function AssessmentActivityRow({ item, patientId }: { item: Extract<MobilePatientActivityItem, { kind: "assessment" }>; patientId: string }) {
  const completed = item.item.assessment.status === "completed";
  return <Link href={`/pazienti/${patientId}/percorso/${item.item.entityId}`} className="block rounded-xl py-4 active:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><div className="flex items-center gap-2"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${completed ? "bg-violet-300" : "bg-amber-300"}`}/><p className="text-sm font-bold text-slate-800">{clinicalAssessmentTypeLabel(item.item.assessment)}</p></div><p className="ml-[1.125rem] mt-1 text-sm text-slate-500">{item.item.moduleLabels.join(" · ") || "Valutazione clinica"}</p><p className="ml-[1.125rem] mt-1 text-xs font-bold text-sage-700">{completed ? "Apri valutazione" : "Continua valutazione"}</p></Link>;
}

function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("it-IT"); }
