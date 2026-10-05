"use client";

import Link from "next/link";
import { PatientAdministrativeDetailsCard } from "@/components/patient-administrative-details";
import { clinicalAssessmentTypeLabel, type PatientOverview } from "@/lib/patient-overview";
import type { PatientTimelineItem } from "@/lib/clinical/timeline";
import type { Appointment, Goal, Patient } from "@/lib/types";

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("it-IT");
const money = (cents: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

export function MobilePatientOverview({ patient, overview, hasHistoricalPathways, recentActivity, futureAppointments, economySummary, onOpenGoals, onNewGoal, onEditGoal, onDeleteGoal, onOpenActivity }: {
  patient: Patient;
  overview: PatientOverview;
  hasHistoricalPathways: boolean;
  recentActivity: PatientTimelineItem[];
  futureAppointments: Appointment[];
  economySummary: { outstandingCents: number; availableCreditCents: number; unpaidSessions: number };
  onOpenGoals: () => void;
  onNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  onOpenActivity: () => void;
}) {
  return <div className="space-y-7 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 md:hidden">
    <section aria-labelledby="mobile-patient-current-title" className="rounded-[1.4rem] bg-[#edf2e9] px-4 py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sage-700">Panoramica clinica</p>
      <h2 id="mobile-patient-current-title" className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#24352f]">Dove siamo adesso?</h2>
      <dl className="mt-4 divide-y divide-sage-200/70">
        <OverviewRow label="Percorso" value={overview.activePathway ? `${overview.activePathway.title || "Percorso clinico"} · dal ${formatDate(overview.activePathway.startedOn)}` : hasHistoricalPathways ? "Nessun percorso attivo" : "Non ancora creato"}/>
        <OverviewRow label="Ultima seduta" value={overview.latestSession ? `${formatDate(overview.latestSession.date)}${overview.latestSession.result ? ` · ${overview.latestSession.result}` : ""}` : "Nessuna seduta registrata"}/>
        <OverviewRow label="Prossimo appuntamento" value={overview.nextAppointment ? `${formatDate(overview.nextAppointment.date)} · ${overview.nextAppointment.time}${overview.nextAppointment.serviceNameSnapshot ? ` · ${overview.nextAppointment.serviceNameSnapshot}` : ""}` : "Nessun appuntamento futuro"}/>
        {overview.latestAssessment && <div className="py-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ultima valutazione</dt><dd className="mt-1 flex items-start justify-between gap-3 text-sm leading-5 text-slate-700"><span>{clinicalAssessmentTypeLabel(overview.latestAssessment)} · {overview.latestAssessment.status === "completed" ? "Completata" : "Bozza"}</span><Link href={`/pazienti/${patient.id}/percorso/${overview.latestAssessment.id}`} className="shrink-0 font-bold text-sage-800">Apri</Link></dd></div>}
      </dl>
    </section>

    <section id="patient-goals" className="scroll-mt-32" aria-labelledby="mobile-patient-goals-title">
      <SectionHeading id="mobile-patient-goals-title" title="Obiettivi" action="Nuovo" onAction={onNewGoal}/>
      {overview.activeGoals.length ? <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">{overview.activeGoals.slice(0, 3).map((goal) => <div key={goal.id} className="py-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-slate-800">{goal.title}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-sage-500" style={{ width: `${goal.progress}%` }}/></div></div><span className="text-xs font-bold text-slate-500">{goal.progress}%</span></div><div className="mt-2 flex gap-4"><button type="button" onClick={() => onEditGoal(goal)} className="min-h-11 text-xs font-bold text-sage-700">Modifica</button><button type="button" onClick={() => onDeleteGoal(goal)} className="min-h-11 text-xs font-bold text-red-600">Elimina</button></div></div>)}</div> : <EmptyLine>Nessun obiettivo attivo.</EmptyLine>}
      {overview.activeGoals.length > 3 && <button type="button" onClick={onOpenGoals} className="mt-2 min-h-11 text-sm font-bold text-sage-700">Vedi altri {overview.activeGoals.length - 3}</button>}
    </section>

    <section aria-labelledby="mobile-patient-activity-title">
      <SectionHeading id="mobile-patient-activity-title" title="Attività recenti" action="Vedi tutte" onAction={onOpenActivity}/>
      {recentActivity.length ? <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">{recentActivity.map((item) => <div key={item.id} className="flex gap-3 py-3.5"><span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.type === "session" ? "bg-sky-300" : item.assessment.status === "draft" ? "bg-amber-300" : "bg-violet-300"}`}/><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{formatDate(item.occurredOn)}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{item.type === "session" ? "Seduta" : clinicalAssessmentTypeLabel(item.assessment)}</p>{item.subtitle && <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500">{item.subtitle}</p>}</div></div>)}</div> : <EmptyLine>Nessuna attività registrata.</EmptyLine>}
    </section>

    <section aria-labelledby="mobile-patient-appointments-title">
      <SectionHeading id="mobile-patient-appointments-title" title="Prossimi appuntamenti" href="/calendario" action="Calendario"/>
      {futureAppointments.length ? <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">{futureAppointments.slice(0, 3).map((appointment) => <div key={appointment.id} className="py-3.5"><p className="text-sm font-semibold text-slate-800">{formatDate(appointment.date)} · {appointment.time}</p><p className="mt-1 text-sm leading-5 text-slate-500">{[appointment.serviceNameSnapshot, appointment.locationNameSnapshot, `${appointment.duration} min`].filter(Boolean).join(" · ")}</p></div>)}</div> : <EmptyLine>Nessun appuntamento futuro.</EmptyLine>}
    </section>

    <section aria-labelledby="mobile-patient-economy-title">
      <SectionHeading id="mobile-patient-economy-title" title="Situazione economica" href={`/economia?patient=${patient.id}`} action="Apri"/>
      <dl className="mt-2 divide-y divide-sage-100 rounded-2xl bg-sage-50/70 px-4"><EconomyRow label="Da incassare" value={money(economySummary.outstandingCents)}/><EconomyRow label="Credito disponibile" value={money(economySummary.availableCreditCents)}/><EconomyRow label="Prestazioni da saldare" value={String(economySummary.unpaidSessions)}/></dl>
    </section>

    <PatientAdministrativeDetailsCard patient={patient}/>

    <details className="border-y border-slate-200 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><span>Dati del paziente</span><span aria-hidden="true" className="text-sage-700">⌄</span></summary><dl className="space-y-4 pb-4 pt-3"><PatientDatum label="Motivo dell’invio" value={patient.referralReason}/><PatientDatum label="Contatto" value={patient.contact}/><PatientDatum label="Genitore / tutore" value={patient.guardian}/><PatientDatum label="Scuola" value={patient.school}/><PatientDatum label="Classe" value={patient.schoolClass}/><PatientDatum label="Note" value={patient.notes}/></dl></details>
  </div>;
}

function OverviewRow({ label, value }: { label: string; value: string }) { return <div className="py-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm leading-5 text-slate-700">{value}</dd></div>; }
function EconomyRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 py-3.5"><dt className="text-sm text-slate-600">{label}</dt><dd className="font-bold text-slate-800">{value}</dd></div>; }
function EmptyLine({ children }: { children: React.ReactNode }) { return <p className="mt-2 border-y border-slate-200 py-4 text-sm text-slate-500">{children}</p>; }
function PatientDatum({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || "Non indicato"}</dd></div>; }
function SectionHeading({ id, title, action, onAction, href }: { id: string; title: string; action: string; onAction?: () => void; href?: string }) { return <div className="flex min-h-11 items-center justify-between gap-3"><h2 id={id} className="text-lg font-bold tracking-[-0.015em] text-[#24352f]">{title}</h2>{href ? <Link href={href} className="inline-flex min-h-11 items-center text-sm font-bold text-sage-700">{action}</Link> : <button type="button" onClick={onAction} className="min-h-11 text-sm font-bold text-sage-700">{action}</button>}</div>; }
