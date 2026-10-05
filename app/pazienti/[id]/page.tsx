"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { PatientClinicalPathway, type MobileClinicalSection } from "@/components/clinical/patient-clinical-pathway";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { PatientAdministrativeDetailsCard } from "@/components/patient-administrative-details";
import { PatientForm } from "@/components/patient-form";
import { Field } from "@/components/form-controls";
import { PatientResourcesSection } from "@/components/patient-resources-section";
import { MobilePatientOverview } from "@/components/patients/mobile-patient-overview";
import { MobilePatientActivity } from "@/components/patients/mobile-patient-activity";
import { buildPatientTimeline, filterPatientTimeline } from "@/lib/clinical/timeline";
import type { PatientTimelineFilter, PatientTimelineItem } from "@/lib/clinical/timeline";
import { centsToEuroInput, euroInputToCents, formatEuroCents, selectableAppointmentServices } from "@/lib/calendar-v2";
import { sessionWithService } from "@/lib/economy";
import { clinicalAssessmentTypeLabel, getPatientOverview } from "@/lib/patient-overview";
import type { PatientOverview } from "@/lib/patient-overview";
import { getFuturePatientAppointments } from "@/lib/patient-resources";
import { patientEconomicSummary } from "@/lib/payments";
import { buildMobilePatientActivity, filterMobilePatientActivity } from "@/lib/patient-mobile-activity";
import type { Appointment, Goal, Material, Session } from "@/lib/types";
import { age, fullName, initials, uid } from "@/lib/types";
import { focusFirstInvalidField, validateGoalForm, validateSessionForm, type FieldErrors } from "@/lib/form-validation";
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("it-IT");
export default function PatientPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter();
  const { data, ready, deletePatient, deleteSession, deleteGoal, openMaterial } = useData();
  const [edit, setEdit] = useState(false),
    [detail, setDetail] = useState<Session | null>(null),
    [goalEdit, setGoalEdit] = useState<Goal | "new" | null>(null),
    [newGoalPathwayId, setNewGoalPathwayId] = useState<string | undefined>(),
    [deleteSessionTarget, setDeleteSessionTarget] = useState<Session | null>(null),
    [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null),
    [deletePatientOpen, setDeletePatientOpen] = useState(false),
    [patientActionsOpen, setPatientActionsOpen] = useState(false),
    [activityFilter, setActivityFilter] = useState<PatientTimelineFilter>("all"),
    [activityQuery, setActivityQuery] = useState(""),
    [tab, setTab] = useState<"overview" | "clinical" | "activity" | "resources">("overview"),
    [clinicalSection, setClinicalSection] = useState<MobileClinicalSection>("clinical-overview"),
    [clinicalHistoryPathwayId, setClinicalHistoryPathwayId] = useState<string | undefined>();
  const mobileLayout = useMobilePatientLayout();
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("tab");
      if (requested === "clinical" || requested === "activity" || requested === "resources" || requested === "overview") setTab(requested);
      else if (requested === "sessions") setTab("activity");
      else setTab("overview");
      const requestedSection = params.get("section");
      const nextSection = isMobileClinicalSection(requestedSection) ? requestedSection : "clinical-overview";
      setClinicalSection(nextSection === "history-detail" && !params.get("pathway") ? "history" : nextSection);
      setClinicalHistoryPathwayId(params.get("pathway") || undefined);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);
  const selectTab = (nextTab: "overview" | "clinical" | "activity" | "resources") => {
    setTab(nextTab);
    setClinicalSection("clinical-overview");
    setClinicalHistoryPathwayId(undefined);
    const url = new URL(window.location.href);
    if (nextTab === "overview") url.searchParams.delete("tab"); else url.searchParams.set("tab", nextTab);
    url.searchParams.delete("section");
    url.searchParams.delete("pathway");
    window.history.replaceState({}, "", url);
  };
  const navigateClinicalSection = (section: MobileClinicalSection, historyPathwayId?: string, replace = false) => {
    setClinicalSection(section);
    setClinicalHistoryPathwayId(historyPathwayId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "clinical");
    if (section === "clinical-overview") url.searchParams.delete("section"); else url.searchParams.set("section", section);
    if (historyPathwayId) url.searchParams.set("pathway", historyPathwayId); else url.searchParams.delete("pathway");
    if (replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
  };
  const openGoals = () => {
    selectTab("overview");
    window.requestAnimationFrame(() => document.getElementById("patient-goals")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const p = data.patients.find((x) => x.id === id);
  if (!ready)
    return (
      <AppShell>
        <p>Caricamento…</p>
      </AppShell>
    );
  if (!p)
    return (
      <AppShell>
        <p>Paziente non trovato.</p>
        <Link href="/pazienti" className="text-sage-700">
          Torna ai pazienti
        </Link>
      </AppShell>
    );
  const sessions = data.sessions
    .filter((s) => s.patientId === id)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  const goals = data.goals.filter((g) => g.patientId === id);
  const timeline = buildPatientTimeline(id, data.sessions, data.clinicalAssessments, data.goals, data.materials, data.appointments);
  const visibleTimeline = filterPatientTimeline(timeline, activityFilter, activityQuery);
  const mobileActivity = buildMobilePatientActivity(id, timeline, data.appointments, data.sessions);
  const visibleMobileActivity = filterMobilePatientActivity(mobileActivity, activityFilter, activityQuery);
  const overview = getPatientOverview(data, id);
  const futureAppointments = getFuturePatientAppointments(data.appointments, id);
  const recentActivity = timeline.slice(0, 3);
  const economySummary = patientEconomicSummary(id, data.sessions, data.payments, data.paymentAllocations);
  const clinicalDrillDown = mobileLayout && tab === "clinical" && clinicalSection !== "clinical-overview";
  const clinicalSectionTitle = clinicalSection === "assessments" ? "Valutazioni" : clinicalSection === "goals" ? "Obiettivi" : clinicalSection === "linked-activity" ? "Attività collegate" : clinicalSection === "history" ? "Percorsi precedenti" : "Percorso precedente";
  const closeClinicalDrillDown = () => navigateClinicalSection(clinicalSection === "history-detail" ? "history" : "clinical-overview", undefined, true);
  return (
    <AppShell mobileFullScreen mobileHeader={clinicalDrillDown ? { variant: "detail", title: clinicalSectionTitle, backHref: `/pazienti/${p.id}?tab=clinical`, backLabel: clinicalSection === "history-detail" ? "Torna ai percorsi precedenti" : "Torna al percorso", onBack: closeClinicalDrillDown } : { variant: "detail", title: fullName(p), backHref: "/pazienti", backLabel: "Torna ai pazienti" }}>
      <Link href="/pazienti" className="hidden text-sm font-bold text-sage-700 md:inline-block">
        ← Tutti i pazienti
      </Link>
      <header className="mt-5 hidden flex-wrap items-center justify-between gap-4 md:flex">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-100 text-base font-bold text-sage-800 sm:h-14 sm:w-14 sm:text-lg">
            {initials(p)}
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold sm:text-[1.75rem]">{fullName(p)}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {age(p.birthDate) ? `${age(p.birthDate)} anni · ` : ""}
              {p.status === "active"
                ? "Attivo"
                : p.status === "suspended"
                  ? "Sospeso"
                  : "Concluso"}
            </p>
            {p.referralReason && <p className="mt-1 line-clamp-1 max-w-2xl text-sm text-slate-600">{p.referralReason}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link href={"/sedute/nuova?p=" + p.id} className="btn btn-primary col-span-2 w-full sm:order-first sm:w-auto">
            Registra seduta
          </Link>
          <button onClick={() => setEdit(true)} className="btn btn-quiet w-full px-3 text-sm sm:w-auto">
            Modifica paziente
          </button>
          <details className="relative"><summary aria-label="Altre azioni paziente" className="grid min-h-11 cursor-pointer list-none place-items-center rounded-xl px-4 text-xl font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">•••</summary><div className="absolute right-0 z-10 mt-2 min-w-44 rounded-xl border border-sage-100 bg-white p-2 shadow-lg"><button onClick={() => setDeletePatientOpen(true)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Elimina paziente</button></div></details>
        </div>
      </header>
      {!clinicalDrillDown && <section className="px-4 pb-4 pt-5 md:hidden" aria-labelledby="mobile-patient-name">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-lg font-bold text-sage-800">{initials(p)}</span>
          <div className="min-w-0"><h1 id="mobile-patient-name" className="truncate text-[1.35rem] font-bold tracking-[-0.025em] text-[#24352f]">{fullName(p)}</h1><p className="mt-0.5 text-sm text-slate-500">{age(p.birthDate) ? `${age(p.birthDate)} anni · ` : ""}{p.status === "active" ? "Attivo" : p.status === "suspended" ? "Sospeso" : "Concluso"}</p>{p.contact && <p className="mt-0.5 truncate text-sm text-slate-500">{p.contact}</p>}</div>
        </div>
        <div className="mt-4 flex items-center gap-2"><Link href={`/sedute/nuova?p=${p.id}`} className="btn btn-primary min-h-11 flex-1">Registra seduta</Link><button type="button" aria-label="Altre azioni paziente" onClick={() => setPatientActionsOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sage-100 bg-white text-lg font-bold text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">•••</button></div>
      </section>}
      <nav aria-label="Sezioni paziente" className={`sticky top-[calc(3.65rem+env(safe-area-inset-top))] z-20 gap-1 overflow-x-auto border-y border-slate-200 bg-[#f7f7f2]/95 px-3 py-1 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:static md:mt-7 md:flex md:gap-3 md:overflow-visible md:border-x-0 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none ${clinicalDrillDown ? "hidden" : "flex"}`}>
        {([['overview','Panoramica'],['clinical','Percorso'],['activity','Attività'],['resources','Risorse']] as const).map(([value,label]) => <button key={value} aria-current={tab === value ? "page" : undefined} onClick={() => selectTab(value)} className={`min-h-11 shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 md:min-w-max md:flex-1 md:rounded-none md:border-x-0 md:border-t-0 md:border-b-2 md:px-5 md:py-2.5 md:text-sm ${tab === value ? "border-sage-300 bg-sage-100 text-sage-800 md:border-sage-600 md:bg-transparent" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"}`}>{label}</button>)}
      </nav>
      {tab === "overview" && (mobileLayout ? <MobilePatientOverview patient={p} overview={overview} hasHistoricalPathways={data.clinicalPathways.some((pathway) => pathway.patientId === p.id && pathway.status === "closed")} recentActivity={recentActivity} futureAppointments={futureAppointments} economySummary={economySummary} onOpenGoals={openGoals} onNewGoal={() => { setNewGoalPathwayId(undefined); setGoalEdit("new"); }} onEditGoal={setGoalEdit} onDeleteGoal={setDeleteGoalTarget} onOpenActivity={() => selectTab("activity")}/> : <div className="mt-5 hidden gap-4 md:grid lg:grid-cols-12">
        <div className="lg:col-span-12"><PatientStatusPanel patientId={p.id} overview={overview} hasHistoricalPathways={data.clinicalPathways.some((pathway) => pathway.patientId === p.id && pathway.status === "closed")} onOpenGoals={openGoals} /></div>
        <section id="patient-goals" className="card scroll-mt-5 p-4 sm:p-5 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-bold">Obiettivi</h2><p className="mt-1 text-sm text-slate-500">Focus attivi e gestione degli obiettivi del paziente.</p></div>
            <button onClick={() => { setNewGoalPathwayId(undefined); setGoalEdit("new"); }} className="text-sm font-bold text-sage-700">+ Nuovo obiettivo</button>
          </div>
          {overview.activeGoals.length ? (
            <div className="mt-3 space-y-2.5 sm:mt-5 sm:space-y-4">
              {overview.activeGoals.slice(0,3).map((g) => (
                <div key={g.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{g.title}</span>
                    <b>{g.progress}%</b>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200" aria-label={`Progresso registrato ${g.progress}%`}>
                    <div
                      className="h-1.5 rounded-full bg-sage-500"
                      style={{ width: g.progress + "%" }}
                    />
                  </div>
                  <button onClick={() => setGoalEdit(g)} className="mt-2 text-xs font-bold text-sage-700">Modifica</button>
                  <button onClick={() => setDeleteGoalTarget(g)} className="ml-3 mt-2 text-xs font-bold text-red-600">Elimina</button>
                </div>
              ))}
              {overview.activeGoals.length > 3 && <p className="text-sm text-slate-500">+{overview.activeGoals.length - 3} altri obiettivi attivi</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nessun obiettivo attivo.</p>
          )}
        </section>
        <section className="card p-4 sm:p-5 lg:col-span-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Attività recenti</h2><button onClick={() => selectTab("activity")} className="text-sm font-bold text-sage-700">Vedi tutte</button></div>{recentActivity.length ? <div className="mt-2 divide-y divide-slate-100 sm:mt-3">{recentActivity.map((item) => <div key={item.id} className="flex gap-2.5 py-2.5 first:pt-0 sm:gap-3 sm:py-3"><span aria-hidden="true" className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.type === "session" ? "bg-sky-300" : item.assessment.status === "draft" ? "bg-amber-300" : "bg-violet-300"}`} /><div className="min-w-0"><p className="text-[11px] font-bold text-slate-400 sm:text-xs">{formatDate(item.occurredOn)}</p><p className="text-sm font-bold sm:mt-0.5">{item.type === "session" ? "Seduta" : clinicalAssessmentTypeLabel(item.assessment)}</p>{item.subtitle && <p className="line-clamp-1 text-sm text-slate-600 sm:mt-0.5">{item.subtitle}</p>}</div></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Nessuna attività registrata.</p>}</section>
        <section className="card p-4 sm:p-5 lg:col-span-12"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Prossimi appuntamenti</h2><p className="mt-1 text-sm text-slate-500">I prossimi impegni già pianificati.</p></div><Link href="/calendario" className="text-sm font-bold text-sage-700">Apri calendario</Link></div>{futureAppointments.length ? <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{futureAppointments.slice(0, 3).map((appointment) => <FutureAppointmentRow key={appointment.id} appointment={appointment} />)}</div> : <p className="mt-3 text-sm text-slate-500">Nessun appuntamento futuro.</p>}</section>
        <section className="card p-4 sm:p-5 lg:col-span-12" aria-labelledby="patient-economy-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="patient-economy-title" className="font-bold">Situazione economica</h2><p className="mt-1 text-sm text-slate-500">Sintesi dei pagamenti registrati per il paziente.</p></div><Link href={`/economia?patient=${p.id}`} className="text-sm font-bold text-sage-700">Apri in Economia</Link></div><div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm"><PatientEconomyDatum label="Da incassare" value={new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(economySummary.outstandingCents/100)}/><PatientEconomyDatum label="Credito disponibile" value={new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(economySummary.availableCreditCents/100)}/><PatientEconomyDatum label="Prestazioni da saldare" value={String(economySummary.unpaidSessions)}/></div></section>
        <PatientAdministrativeDetailsCard patient={p} />
        <details className="card p-4 sm:p-5 lg:col-span-12"><summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Dati del paziente</summary><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><PatientDatum label="Motivo dell’invio" value={p.referralReason}/><PatientDatum label="Contatto" value={p.contact}/><PatientDatum label="Genitore / tutore" value={p.guardian}/><PatientDatum label="Scuola" value={p.school}/><PatientDatum label="Classe" value={p.schoolClass}/><PatientDatum label="Note" value={p.notes}/></div></details>
      </div>)}
      {tab === "clinical" && <div className={`${clinicalDrillDown ? "pb-6 pt-3" : "px-4 pb-6 pt-5"} md:px-0 md:pb-0 md:pt-5`}><PatientClinicalPathway patientId={p.id} goals={goals} presentation={mobileLayout ? "mobile" : "desktop"} mobileSection={clinicalSection} mobileHistoryPathwayId={clinicalHistoryPathwayId} onMobileSectionChange={navigateClinicalSection} onNewGoal={(pathwayId) => { setNewGoalPathwayId(pathwayId); setGoalEdit("new"); }} onEditGoal={setGoalEdit} onDeleteGoal={setDeleteGoalTarget} onOpenActivity={() => selectTab("activity")} /></div>}
      {tab === "activity" && (mobileLayout ? <MobilePatientActivity patientId={p.id} items={visibleMobileActivity} filter={activityFilter} query={activityQuery} onFilterChange={setActivityFilter} onQueryChange={setActivityQuery} onOpenSession={setDetail} onDeleteSession={setDeleteSessionTarget}/> : <div className="hidden space-y-4 px-4 pb-6 pt-4 md:block md:space-y-5 md:px-0 md:pb-0 md:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><div className="min-w-0"><h2 className="text-xl font-bold">Attività</h2><p className="mt-0.5 text-sm text-slate-500 sm:mt-1">Sedute e valutazioni cliniche in ordine cronologico.</p></div><Link href={`/sedute/nuova?p=${p.id}`} className="btn btn-primary px-3 text-sm sm:px-4 sm:text-base">Registra seduta</Link></div>
        <section className="card p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block sm:max-w-xs sm:flex-1"><span className="sr-only">Cerca nelle attività</span><input type="search" value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Cerca nelle attività…" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sage-400 focus-visible:ring-2 focus-visible:ring-sage-300" /></label>
            <div aria-label="Filtra la storia clinica" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {([['all','Tutte'],['sessions','Sedute'],['assessments','Valutazioni']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={activityFilter === value} onClick={() => setActivityFilter(value)} className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 sm:min-h-9 sm:min-w-max sm:flex-none sm:px-3 ${activityFilter === value ? "bg-sage-100 text-sage-800" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>{label}</button>)}
            </div>
          </div>
          {visibleTimeline.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{timeline.length === 0 ? "Nessuna seduta o valutazione registrata." : "Nessuna attività corrisponde al filtro selezionato."}</p>
          ) : (
            <div className="mt-4 space-y-3 sm:space-y-2">
              {visibleTimeline.map((item) => item.type === "session" ? <SessionTimelineCard key={item.id} item={item} onEdit={() => setDetail(item.session)} onDelete={() => setDeleteSessionTarget(item.session)} onOpenMaterial={(material) => void openMaterial(material)} /> : <AssessmentTimelineCard key={item.id} item={item} patientId={p.id} />)}
            </div>
          )}
        </section>
      </div>)}
      {tab === "resources" && <div className="px-4 pb-6 md:px-0 md:pb-0"><PatientResourcesSection patientId={p.id} /></div>}
      {patientActionsOpen && <Modal title="Azioni paziente" onClose={() => setPatientActionsOpen(false)}><div className="divide-y divide-slate-100"><button type="button" onClick={() => { setPatientActionsOpen(false); setEdit(true); }} className="flex min-h-14 w-full items-center text-left text-sm font-bold text-slate-800">Modifica paziente</button><button type="button" onClick={() => { setPatientActionsOpen(false); setDeletePatientOpen(true); }} className="flex min-h-14 w-full items-center text-left text-sm font-bold text-red-600">Elimina paziente</button></div></Modal>}
      {edit && (
        <Modal title="Modifica paziente" onClose={() => setEdit(false)}>
          <PatientForm patient={p} onDone={() => setEdit(false)} />
        </Modal>
      )}
      {detail && (
        <Modal title="Dettaglio seduta" onClose={() => setDetail(null)}>
          <SessionEditor session={detail} onDone={() => setDetail(null)} />
        </Modal>
      )}
      {goalEdit && (mobileLayout && tab === "clinical" ? <MobileGoalEditorPanel title={goalEdit === "new" ? "Nuovo obiettivo" : "Modifica obiettivo"} onClose={() => { setGoalEdit(null); setNewGoalPathwayId(undefined); }}><GoalEditor goal={goalEdit === "new" ? {id:uid(),patientId:p.id,clinicalPathwayId:newGoalPathwayId,title:"",description:"",priority:2,status:"not_started",progress:0,createdAt:new Date().toISOString()} : goalEdit} onDone={() => { setGoalEdit(null); setNewGoalPathwayId(undefined); }} /></MobileGoalEditorPanel> :
        <Modal title={goalEdit === "new" ? "Nuovo obiettivo" : "Modifica obiettivo"} onClose={() => { setGoalEdit(null); setNewGoalPathwayId(undefined); }}>
          <GoalEditor
            goal={goalEdit === "new" ? {id:uid(),patientId:p.id,clinicalPathwayId:newGoalPathwayId,title:"",description:"",priority:2,status:"not_started",progress:0,createdAt:new Date().toISOString()} : goalEdit}
            onDone={() => { setGoalEdit(null); setNewGoalPathwayId(undefined); }}
          />
        </Modal>
      )}
      {deletePatientOpen && <DeletePatientModal patientName={fullName(p)} onClose={() => setDeletePatientOpen(false)} onConfirm={async () => { await deletePatient(p.id); router.push("/pazienti"); }} />}
      {deleteSessionTarget && <DeleteEntityModal title="Eliminare questa seduta?" description="La seduta verrà eliminata definitivamente. L’appuntamento collegato resterà disponibile nel calendario." actionLabel="Elimina seduta" onClose={() => setDeleteSessionTarget(null)} onConfirm={async()=>{await deleteSession(deleteSessionTarget.id);setDeleteSessionTarget(null);}} />}
      {deleteGoalTarget && <DeleteEntityModal title="Eliminare questo obiettivo?" description="L’obiettivo verrà eliminato e rimosso dalle sedute collegate. Questa operazione non può essere annullata." actionLabel="Elimina obiettivo" onClose={() => setDeleteGoalTarget(null)} onConfirm={async()=>{await deleteGoal(deleteGoalTarget.id);setDeleteGoalTarget(null);}} />}
    </AppShell>
  );
}

function useMobilePatientLayout() {
  return useSyncExternalStore(
    (notify) => { const media = window.matchMedia("(max-width: 767px)"); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

function isMobileClinicalSection(value: string | null): value is MobileClinicalSection {
  return value === "clinical-overview" || value === "assessments" || value === "goals" || value === "linked-activity" || value === "history" || value === "history-detail";
}

function MobileGoalEditorPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, []);
  return <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="mobile-goal-editor-title" className="fixed inset-0 z-50 flex flex-col bg-[#f7f7f2] md:hidden"><header className="flex min-h-[calc(3.65rem+env(safe-area-inset-top))] shrink-0 items-end border-b border-sage-100 bg-[#f7f7f2] px-3 pb-2 pt-[max(0.45rem,env(safe-area-inset-top))]"><button type="button" onClick={onClose} aria-label="Torna agli obiettivi" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf1e9] text-[#526159] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"><span aria-hidden="true" className="text-xl">‹</span></button><h2 id="mobile-goal-editor-title" className="min-w-0 flex-1 truncate px-2.5 pb-[0.7rem] text-[0.98rem] font-semibold text-[#24352f]">{title}</h2></header><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div></div>;
}

function DeletePatientModal({ patientName, onClose, onConfirm }: { patientName: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try { await onConfirm(); }
    catch { setError("Non è stato possibile eliminare il paziente. Riprova tra poco."); setDeleting(false); }
  };
  return <Modal title="Eliminare questo paziente?" onClose={() => { if (!deleting) onClose(); }}><div className="space-y-4 text-sm leading-6 text-slate-600"><p>Stai per eliminare definitivamente <strong>{patientName}</strong> e i dati collegati secondo il comportamento attuale di ARMONIA. Questa operazione non può essere annullata.</p>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 font-medium text-red-700">{error}</p>}</div><div className="form-actions mt-6"><button type="button" disabled={deleting} onClick={onClose} className="btn btn-quiet disabled:opacity-50">Annulla</button><button type="button" disabled={deleting} aria-busy={deleting} onClick={() => void remove()} className="btn bg-red-600 text-white disabled:cursor-wait disabled:opacity-60">{deleting ? "Eliminazione…" : error ? "Riprova eliminazione" : "Elimina paziente"}</button></div></Modal>;
}

function DeleteEntityModal({title,description,actionLabel,onClose,onConfirm}:{title:string;description:string;actionLabel:string;onClose:()=>void;onConfirm:()=>Promise<void>}) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  return <Modal title={title} onClose={()=>!busy&&onClose()}><p className="text-sm leading-6 text-slate-600">{description}</p>{error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}<div className="form-actions mt-6"><button type="button" disabled={busy} onClick={onClose} className="btn btn-quiet">Annulla</button><button type="button" disabled={busy} aria-busy={busy} onClick={async()=>{setBusy(true);setError("");try{await onConfirm();}catch{setError("Non è stato possibile completare l’eliminazione. Riprova.");setBusy(false);}}} className="btn bg-red-600 text-white disabled:opacity-60">{busy?"Eliminazione…":actionLabel}</button></div></Modal>;
}

function PatientEconomyDatum({label,value}:{label:string;value:string}) { return <div className="min-w-0"><p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words font-bold text-slate-800">{value}</p></div>; }

type SessionTimelineItem = Extract<PatientTimelineItem, { type: "session" }>;
type AssessmentTimelineItem = Extract<PatientTimelineItem, { type: "clinical_assessment" }>;

function FutureAppointmentRow({ appointment }: { appointment: Appointment }) {
  return <div className="flex flex-col gap-0.5 rounded-xl bg-slate-50 p-2.5 sm:justify-between sm:gap-1 sm:p-3">
    <p className="text-sm font-bold text-slate-700">{formatDate(appointment.date)} · {appointment.time}</p>
    <p className="text-sm text-slate-500">{[appointment.serviceNameSnapshot, appointment.locationNameSnapshot, `${appointment.duration} min`].filter(Boolean).join(" · ")}</p>
  </div>;
}


function SessionTimelineCard({ item, onEdit, onDelete, onOpenMaterial }: { item: SessionTimelineItem; onEdit: () => void; onDelete: () => void; onOpenMaterial: (material: Material) => void }) {
  const { session } = item;
  const activityPreview = compactTimelineText(session.activities);
  const resultPreview = compactTimelineText(session.result);
  const indicators = [
    item.goals.length ? `${item.goals.length} ${item.goals.length === 1 ? "obiettivo" : "obiettivi"}` : null,
    item.materials.length ? `${item.materials.length} ${item.materials.length === 1 ? "materiale" : "materiali"}` : null,
    session.homework ? "Compiti" : null,
    session.nextPlan ? "Prossima volta" : null,
  ].filter((value): value is string => Boolean(value));
  return <article className="rounded-xl border border-slate-200 border-l-4 border-l-sky-300 bg-white p-3 sm:rounded-2xl sm:p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><time dateTime={item.occurredOn} className="text-sm font-bold text-slate-700">{formatDate(item.occurredOn)}</time><span className="text-xs text-slate-400">Seduta · {session.duration} min</span></div>
        {activityPreview && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-700"><span className="font-bold">Attività:</span> {activityPreview}</p>}
        {resultPreview && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600"><span className="font-bold">Risultato:</span> {resultPreview}</p>}
        {indicators.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{indicators.map((indicator) => <span key={indicator} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800">{indicator}</span>)}</div>}
      </div>
      <button onClick={onEdit} className="self-start rounded-lg px-2 py-1.5 text-sm font-bold text-sage-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:min-h-11 sm:rounded-xl sm:bg-sage-50 sm:px-4 sm:py-3">Apri / modifica</button>
    </div>
    <details className="mt-2 border-t border-sage-100 pt-2 sm:mt-3 sm:pt-3">
      <summary className="-mx-1 block min-h-11 cursor-pointer list-none rounded-lg px-1 py-2.5 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:py-3">Dettagli seduta <span aria-hidden="true" className="ml-1 text-slate-400">⌄</span></summary>
      <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
        <TimelineField label="Attività" value={session.activities} />
        <TimelineField label="Risposta" value={session.response} />
        <TimelineField label="Livello di aiuto" value={session.helpLevel} />
        <TimelineField label="Risultato" value={session.result} />
        <TimelineField label="Prestazione" value={session.serviceNameSnapshot} />
        {session.effectivePriceCents !== undefined && <TimelineField label="Prezzo" value={session.effectivePriceCents === 0 ? "Gratuita" : formatEuroCents(session.effectivePriceCents)} />}
        {item.goals.length > 0 && <TimelineField label="Obiettivi"><ul className="space-y-1">{item.goals.map((goal) => <li key={goal.id} className={goal.available ? "" : "text-slate-400"}>• {goal.title}</li>)}</ul></TimelineField>}
        {item.materials.length > 0 && <TimelineField label="Materiali"><div className="flex flex-wrap gap-2">{item.materials.map((entry) => entry.material ? <button key={entry.id} type="button" onClick={() => onOpenMaterial(entry.material!)} className="rounded-lg border border-sage-100 px-2.5 py-1.5 text-left text-sm font-bold text-sage-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">{entry.title}</button> : <span key={entry.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-400">{entry.title}</span>)}</div></TimelineField>}
        <TimelineField label="Compiti" value={session.homework} />
        <TimelineField label="Prossima volta" value={session.nextPlan} />
        <TimelineField label="Note" value={session.notes} />
        {item.appointment && <TimelineField label="Appuntamento collegato" value={`${formatDate(item.appointment.date)} · ${item.appointment.time}${item.appointment.serviceNameSnapshot ? ` · ${item.appointment.serviceNameSnapshot}` : ""}${item.appointment.locationNameSnapshot ? ` · ${item.appointment.locationNameSnapshot}` : ""}`} />}
      </div>
      <div className="mt-4 flex justify-end border-t border-sage-100 pt-3"><button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Elimina seduta</button></div>
    </details>
  </article>;
}

function AssessmentTimelineCard({ item, patientId }: { item: AssessmentTimelineItem; patientId: string }) {
  const completed = item.assessment.status === "completed";
  return <article className={`rounded-xl border border-slate-200 border-l-4 bg-white p-3 sm:rounded-2xl sm:p-5 ${completed ? "border-l-violet-200" : "border-l-amber-300"}`}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><time dateTime={item.occurredOn} className="text-sm font-bold text-slate-700">{formatDate(item.occurredOn)}</time><span className="text-xs text-slate-400">Valutazione</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${completed ? "bg-sage-50 text-sage-700" : "bg-amber-50 text-amber-800"}`}>{completed ? "Completata" : "Bozza"}</span></div><h3 className="mt-2 font-bold">{item.title}</h3>{item.moduleLabels.length > 0 && <p className="mt-1 text-sm text-slate-500">{item.moduleLabels.join(" · ")}</p>}</div>
      <div className="flex flex-wrap gap-3 sm:w-auto sm:gap-2"><Link href={`/pazienti/${patientId}/percorso/${item.entityId}`} className="rounded-lg px-2 py-1.5 text-sm font-bold text-sage-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:min-h-11 sm:rounded-xl sm:bg-sage-50 sm:px-4 sm:py-3">{completed ? "Apri" : "Continua"}</Link>{completed && <Link href={`/pazienti/${patientId}/percorso/${item.entityId}?print=1`} className="rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:min-h-11 sm:rounded-xl sm:bg-sage-50 sm:px-4 sm:py-3 sm:text-sage-700">Stampa</Link>}</div>
    </div>
    <details className="mt-2 border-t border-sage-100 pt-2 sm:mt-3 sm:pt-3"><summary className="-mx-1 block min-h-11 cursor-pointer list-none rounded-lg px-1 py-2.5 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:py-3">Dettagli valutazione <span aria-hidden="true" className="ml-1 text-slate-400">⌄</span></summary><div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4"><TimelineField label="Tipo" value={item.title} /><TimelineField label="Stato" value={completed ? "Completata" : "Bozza"} />{item.moduleLabels.length > 0 && <TimelineField label="Moduli" value={item.moduleLabels.join(" · ")} />}<TimelineField label="Ultimo aggiornamento" value={new Date(item.assessment.updatedAt).toLocaleDateString("it-IT")} /></div></details>
  </article>;
}

function TimelineField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  if (!children && !value?.trim()) return null;
  return <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{children || value}</div></div>;
}

function compactTimelineText(value: string) {
  const trimmed = value.trim();
  return trimmed && !/^(?:-{1,3}|n\/?a|non indicato)$/i.test(trimmed) ? trimmed : undefined;
}

function PatientStatusPanel({ patientId, overview, hasHistoricalPathways, onOpenGoals }: { patientId: string; overview: PatientOverview; hasHistoricalPathways: boolean; onOpenGoals: () => void }) {
  const assessment = overview.latestAssessment;
  return <section aria-labelledby="patient-status-title" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div><p className="text-[10px] font-bold tracking-wide text-sage-700 sm:text-xs">PANORAMICA CLINICA</p><h2 id="patient-status-title" className="mt-0.5 text-lg font-bold">Dove siamo adesso?</h2></div>
    <dl className="mt-3 grid gap-x-8 gap-y-3 sm:mt-4 sm:grid-cols-2 sm:gap-y-4 lg:grid-cols-4">
      <StatusDatum label="Percorso"><p className="text-sm">{overview.activePathway ? <><span className="font-bold">{overview.activePathway.title || "Percorso clinico"}</span><span className="text-slate-500"> · dal {formatDate(overview.activePathway.startedOn)}</span></> : <span className="text-slate-500">{hasHistoricalPathways ? "Nessun percorso attivo" : "Percorso clinico non ancora creato"}</span>}</p></StatusDatum>
      {assessment && <StatusDatum label="Ultima valutazione"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm"><span className="font-bold">{clinicalAssessmentTypeLabel(assessment)}</span><span className="text-slate-500"> · {assessment.clinicalDate ? formatDate(assessment.clinicalDate) : "Data non indicata"} · {assessment.status === "completed" ? "Completata" : "Bozza"}</span></p><Link href={`/pazienti/${patientId}/percorso/${assessment.id}`} className="text-xs font-bold text-sage-700">{assessment.status === "completed" ? "Apri" : "Continua"}</Link></div></StatusDatum>}
      {overview.focusGoals.length > 0 && <StatusDatum label="Focus attuale"><ul className="space-y-1.5">{overview.focusGoals.map((goal) => <li key={goal.id} className="text-sm font-medium">• {goal.title}</li>)}</ul>{overview.activeGoals.length > overview.focusGoals.length && <button onClick={onOpenGoals} className="mt-2 text-sm font-bold text-sage-700">Vedi tutti</button>}</StatusDatum>}
      {overview.latestSession && <StatusDatum label="Ultima seduta"><p className="text-sm"><span className="font-bold">{formatDate(overview.latestSession.date)}</span>{overview.latestSession.result && <span className="text-slate-600"> · {overview.latestSession.result}</span>}</p></StatusDatum>}
    </dl>
  </section>;
}

function StatusDatum({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="mb-1 text-[10px] font-bold text-slate-400 sm:mb-2 sm:text-xs">{label.toUpperCase()}</dt><dd>{children}</dd></div>;
}

function PatientDatum({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold text-slate-400">{label.toUpperCase()}</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{value || "Non indicato"}</p></div>;
}

function GoalEditor({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const { saveGoal } = useData();
  const [value, setValue] = useState(goal);
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({}); const [serverError,setServerError]=useState(""); const [saving,setSaving]=useState(false);
  return <form noValidate className="space-y-4" onSubmit={async (event) => { event.preventDefault();const errors=validateGoalForm({title:value.title});if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}setSaving(true);setFieldErrors({});setServerError("");try{await saveGoal({...value,title:value.title.trim()});onDone();}catch{setServerError("Non è stato possibile salvare l’obiettivo. Riprova.");setSaving(false);}}}>
    <Field id="goal-title" data-validation-field="title" label="Titolo" required value={value.title} error={fieldErrors.title} onChange={(e) => {setValue((old) => ({...old,title:e.target.value}));setFieldErrors({});}} />
    <label className="block text-sm font-bold">Descrizione<textarea value={value.description} onChange={(e) => setValue((old) => ({...old,description:e.target.value}))} className="mt-2 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">Stato<select value={value.status} onChange={(e) => setValue((old) => ({...old,status:e.target.value}))} className="mt-2 w-full rounded-xl border border-sage-100 p-3 font-normal"><option value="not_started">Da iniziare</option><option value="in_progress">In corso</option><option value="consolidation">Consolidamento</option><option value="achieved">Raggiunto</option><option value="suspended">Sospeso</option></select></label>
      <label className="block text-sm font-bold">Progresso ({value.progress}%)<input type="range" min="0" max="100" value={value.progress} onChange={(e) => setValue((old) => ({...old,progress:Number(e.target.value)}))} className="mt-4 w-full" /></label>
    </div>
    {serverError&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onDone} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving?"Salvataggio…":"Salva obiettivo"}</button></div>
  </form>;
}
function SessionEditor({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const { data, saveSession } = useData();
  const [v, setV] = useState(session);
  const [price, setPrice] = useState(centsToEuroInput(session.effectivePriceCents));
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving,setSaving]=useState(false);
  return (
    <form noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const errors=validateSessionForm({patientId:v.patientId,date:v.date,duration:v.duration,price});if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}
        const effectivePriceCents=euroInputToCents(price);setSaving(true);setFieldErrors({});setServerError("");try{await saveSession({ ...v, effectivePriceCents });onDone();}catch{setServerError("Non è stato possibile salvare la seduta. Riprova.");setSaving(false);}
      }}
      className="space-y-4"
    >
      <Field id="session-edit-date" data-validation-field="date" label="Data" type="date" required value={v.date} error={fieldErrors.date} onChange={(e) => {setV((old)=>({...old,date:e.target.value}));setFieldErrors({});}} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Prestazione<select value={v.serviceId || ""} onChange={(event)=>{const service=data.services.find((item)=>item.id===event.target.value)||null;setV((old)=>sessionWithService(old,service));if(service)setPrice(centsToEuroInput(service.defaultPriceCents));}} className="mt-2 w-full rounded-xl border p-3 font-normal"><option value="">Nessuna prestazione</option>{v.serviceId&&!data.services.some((item)=>item.id===v.serviceId)&&<option value={v.serviceId}>{v.serviceNameSnapshot||"Prestazione non disponibile"} — Non disponibile</option>}{selectableAppointmentServices(data.services,v.serviceId).map((service)=><option value={service.id} key={service.id}>{service.name}{service.archivedAt?" — Non più nel catalogo":!service.isActive?" — Non attiva":""}</option>)}</select></label>
        <div><Field id="session-edit-duration" data-validation-field="duration" label="Durata (minuti)" type="number" min={1} required value={Number.isNaN(v.duration)?"":v.duration} error={fieldErrors.duration} onChange={(event)=>{setV((old)=>({...old,duration:event.target.value===""?Number.NaN:Number(event.target.value)}));setFieldErrors({});}} /></div>
        <div><Field id="session-edit-price" data-validation-field="price" label="Prezzo (facoltativo)" inputMode="decimal" value={price} error={fieldErrors.price} onChange={(event)=>{setPrice(event.target.value);setFieldErrors({});}}/><span className="mt-1 block text-xs text-slate-500">Vuoto = non specificato · 0 = gratuita</span></div>
      </div>
      <label className="block text-sm font-bold">
        Attività
        <textarea
          value={v.activities}
          onChange={(e) => { const value=e.target.value; setV((old) => ({ ...old, activities: value })) }}
          className="mt-2 min-h-20 w-full rounded-xl border p-3 font-normal"
        />
      </label>
      <label className="block text-sm font-bold">
        Risultato
        <textarea
          value={v.result}
          onChange={(e) => { const value=e.target.value; setV((old) => ({ ...old, result: value })) }}
          className="mt-2 min-h-20 w-full rounded-xl border p-3 font-normal"
        />
      </label>
      <label className="block text-sm font-bold">
        Prossima volta
        <textarea
          value={v.nextPlan}
          onChange={(e) => { const value=e.target.value; setV((old) => ({ ...old, nextPlan: value })) }}
          className="mt-2 min-h-20 w-full rounded-xl border p-3 font-normal"
        />
      </label>
      <div className="flex justify-end gap-2">
        {serverError && <p role="alert" className="mr-auto self-center text-sm font-bold text-red-700">{serverError}</p>}
        <button type="button" disabled={saving} onClick={onDone} className="btn btn-quiet">
          Annulla
        </button>
        <button disabled={saving} className="btn btn-primary">{saving?"Salvataggio…":"Salva seduta"}</button>
      </div>
    </form>
  );
}
