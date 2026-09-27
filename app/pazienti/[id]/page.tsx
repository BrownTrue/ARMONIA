"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PatientClinicalPathway } from "@/components/clinical/patient-clinical-pathway";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { PatientForm } from "@/components/patient-form";
import { buildPatientTimeline } from "@/lib/clinical/timeline";
import { clinicalAssessmentTypeLabel, getPatientOverview } from "@/lib/patient-overview";
import type { PatientOverview } from "@/lib/patient-overview";
import type { Goal, Session } from "@/lib/types";
import { age, fullName, initials, uid } from "@/lib/types";
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("it-IT");
export default function PatientPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter();
  const { data, ready, deletePatient, deleteSession, deleteGoal } = useData();
  const [edit, setEdit] = useState(false),
    [detail, setDetail] = useState<Session | null>(null),
    [goalEdit, setGoalEdit] = useState<Goal | "new" | null>(null),
    [tab, setTab] = useState<"overview" | "clinical" | "activity" | "resources">("overview");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "clinical" || requested === "activity" || requested === "resources" || requested === "overview") setTab(requested);
    if (requested === "sessions") setTab("activity");
  }, []);
  const selectTab = (nextTab: "overview" | "clinical" | "activity" | "resources") => {
    setTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "overview") url.searchParams.delete("tab"); else url.searchParams.set("tab", nextTab);
    window.history.replaceState({}, "", url);
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
  const timeline = buildPatientTimeline(id, data.sessions, data.clinicalAssessments);
  const overview = getPatientOverview(data, id);
  const patientMaterials = data.materials.filter((material) => material.patientIds.includes(id));
  const recentActivity = timeline.slice(0, 3);
  return (
    <AppShell>
      <Link href="/pazienti" className="text-sm font-bold text-sage-700">
        ← Tutti i pazienti
      </Link>
      <header className="mt-5 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-lg font-bold sm:h-16 sm:w-16 sm:rounded-3xl">
            {initials(p)}
          </span>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold sm:text-3xl">{fullName(p)}</h1>
            <p className="mt-1 text-slate-500">
              {age(p.birthDate) ? `${age(p.birthDate)} anni · ` : ""}
              {p.status === "active"
                ? "Attivo"
                : p.status === "suspended"
                  ? "Sospeso"
                  : "Concluso"}
            </p>
            {p.referralReason && <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-slate-600">{p.referralReason}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link href={"/sedute/nuova?p=" + p.id} className="btn btn-primary col-span-2 w-full sm:order-first sm:w-auto">
            Registra seduta
          </Link>
          <button onClick={() => setEdit(true)} className="btn btn-quiet w-full px-3 text-sm sm:w-auto">
            Modifica paziente
          </button>
          <details className="relative"><summary className="grid min-h-11 cursor-pointer list-none place-items-center rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Altre azioni</summary><div className="absolute right-0 z-10 mt-2 min-w-44 rounded-xl border border-sage-100 bg-white p-2 shadow-lg"><button onClick={() => { if (confirm("Eliminare il paziente e tutti i dati collegati?")) { deletePatient(p.id); router.push("/pazienti"); } }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Elimina paziente</button></div></details>
        </div>
      </header>
      <PatientStatusPanel patientId={p.id} overview={overview} onOpenGoals={openGoals} />
      <nav aria-label="Sezioni paziente" className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-sage-100 bg-white p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-8">
        {([['overview','Panoramica'],['clinical','Percorso'],['activity','Attività'],['resources','Risorse']] as const).map(([value,label]) => <button key={value} onClick={() => selectTab(value)} className={`min-w-max flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition sm:px-4 ${tab === value ? "bg-sage-100 text-sage-700" : "text-slate-500 hover:bg-sage-50"}`}>{label}</button>)}
      </nav>
      {tab === "overview" && <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section id="patient-goals" className="card scroll-mt-5 p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-bold">Obiettivi</h2><p className="mt-1 text-sm text-slate-500">Focus attivi e gestione degli obiettivi del paziente.</p></div>
            <button onClick={() => setGoalEdit("new")} className="btn btn-quiet text-sm">+ Nuovo obiettivo</button>
          </div>
          {overview.activeGoals.length ? (
            <div className="mt-5 space-y-4">
              {overview.activeGoals.map((g) => (
                <div key={g.id} className="rounded-xl border border-sage-100 p-3">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{g.title}</span>
                    <b>{g.progress}%</b>
                  </div>
                  <div className="h-2 rounded-full bg-sage-100">
                    <div
                      className="h-2 rounded-full bg-sage-500"
                      style={{ width: g.progress + "%" }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setGoalEdit(g)} className="text-xs font-bold text-sage-700">Modifica</button>
                    <button onClick={() => confirm("Eliminare questo obiettivo?") && deleteGoal(g.id)} className="text-xs font-bold text-red-600">Elimina</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Nessun obiettivo attivo.</p>
          )}
          {goals.some((goal) => goal.status === "achieved" || goal.status === "suspended") && <details className="mt-5 border-t border-sage-100 pt-4"><summary className="cursor-pointer text-sm font-bold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Obiettivi raggiunti o sospesi</summary><div className="mt-3 space-y-2">{goals.filter((goal) => goal.status === "achieved" || goal.status === "suspended").map((goal) => <div key={goal.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"><span className="text-sm font-medium">{goal.title}</span><div className="flex gap-3"><button onClick={() => setGoalEdit(goal)} className="text-xs font-bold text-sage-700">Modifica</button><button onClick={() => confirm("Eliminare questo obiettivo?") && deleteGoal(goal.id)} className="text-xs font-bold text-red-600">Elimina</button></div></div>)}</div></details>}
        </section>
        <section className="card p-5"><h2 className="font-bold">Attività recenti</h2>{recentActivity.length ? <div className="mt-3 divide-y divide-sage-100">{recentActivity.map((item) => <div key={item.id} className="py-3 first:pt-0"><p className="text-xs font-bold text-slate-400">{formatDate(item.occurredOn)}</p><p className="mt-1 text-sm font-bold">{item.type === "session" ? "Seduta" : clinicalAssessmentTypeLabel(item.assessment)}</p><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.subtitle}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Nessuna attività registrata.</p>}<button onClick={() => selectTab("activity")} className="mt-3 text-sm font-bold text-sage-700">Vedi attività</button></section>
        <details className="card p-5 lg:col-span-3"><summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Dati del paziente</summary><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><PatientDatum label="Motivo dell’invio" value={p.referralReason}/><PatientDatum label="Contatto" value={p.contact}/><PatientDatum label="Genitore / tutore" value={p.guardian}/><PatientDatum label="Scuola" value={p.school}/><PatientDatum label="Classe" value={p.schoolClass}/><PatientDatum label="Note" value={p.notes}/></div></details>
      </div>}
      {tab === "clinical" && <div className="mt-5"><PatientClinicalPathway patientId={p.id} goals={goals} onOpenGoals={openGoals} /></div>}
      {tab === "activity" && <div className="mt-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Attività</h2><p className="mt-1 text-sm text-slate-500">Sedute e valutazioni cliniche in ordine cronologico.</p></div><Link href={`/sedute/nuova?p=${p.id}`} className="btn btn-primary">Registra seduta</Link></div>
        <section className="card p-5">
          <h2 className="font-bold">Storia clinica</h2>
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Nessuna seduta o valutazione registrata.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-sage-100">
              {timeline.map((item) => item.type === "session" ? (
                <div className="flex flex-col items-stretch gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center" key={item.id}>
                  <div className="min-w-28">
                    <b>{new Date(item.occurredOn + "T12:00").toLocaleDateString("it-IT")}</b>
                    <p className="text-sm text-slate-500">
                      {item.session.duration} minuti
                    </p>
                  </div>
                  <div className="min-w-48 flex-1">
                    <p className="font-bold">{item.title}</p><p className="mt-1 text-sm">{item.subtitle}</p>
                    <p className="mt-1 text-sm text-sage-700">
                      Prossima volta: {item.session.nextPlan || "—"}
                    </p>
                  </div>
                  <button onClick={() => setDetail(item.session)} className="btn btn-quiet w-full sm:w-auto">Apri / modifica</button>
                  <button onClick={() => confirm("Eliminare questa seduta?") && deleteSession(item.entityId)} className="btn w-full text-red-600 sm:w-auto">Elimina</button>
                </div>
              ) : <div className="flex flex-wrap items-center gap-3 py-4" key={item.id}><div className="min-w-28"><b>{new Date(item.occurredOn+"T12:00").toLocaleDateString("it-IT")}</b><p className="text-sm text-slate-500">Valutazione</p></div><div className="min-w-48 flex-1"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.subtitle}</p></div><Link href={`/pazienti/${p.id}/percorso/${item.entityId}`} className="btn btn-quiet">{item.assessment.status==="completed"?"Apri":"Continua"}</Link>{item.assessment.status==="completed"&&<Link href={`/pazienti/${p.id}/percorso/${item.entityId}?print=1`} className="btn btn-quiet">Stampa</Link>}</div>)}
            </div>
          )}
        </section>
      </div>}
      {tab === "resources" && <div className="mt-5"><section className="card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Risorse</h2><p className="mt-2 text-sm text-slate-500">Materiali già associati a questo paziente nella Libreria terapeutica.</p></div><Link href="/materiali" className="btn btn-quiet">Apri Libreria</Link></div>{patientMaterials.length ? <div className="mt-5 space-y-2">{patientMaterials.map((material) => <div key={material.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-100 p-3"><div><p className="text-sm font-bold">{material.title}</p><p className="mt-1 text-xs text-slate-500">{material.category}</p></div><Link href="/materiali" className="text-sm font-bold text-sage-700">Apri in Libreria</Link></div>)}</div> : <p className="mt-5 text-sm text-slate-500">Nessun materiale associato al paziente.</p>}</section></div>}
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
      {goalEdit && (
        <Modal title={goalEdit === "new" ? "Nuovo obiettivo" : "Modifica obiettivo"} onClose={() => setGoalEdit(null)}>
          <GoalEditor
            goal={goalEdit === "new" ? {id:uid(),patientId:p.id,title:"",description:"",priority:2,status:"not_started",progress:0,createdAt:new Date().toISOString()} : goalEdit}
            onDone={() => setGoalEdit(null)}
          />
        </Modal>
      )}
    </AppShell>
  );
}

function PatientStatusPanel({ patientId, overview, onOpenGoals }: { patientId: string; overview: PatientOverview; onOpenGoals: () => void }) {
  const assessment = overview.latestAssessment;
  const appointment = overview.nextAppointment;
  return <section aria-labelledby="patient-status-title" className="mt-5 rounded-3xl border border-sage-100 bg-gradient-to-br from-white to-sage-50 p-4 sm:mt-6 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><div><p className="text-[10px] font-bold tracking-wide text-sage-700 sm:text-xs">PANORAMICA CLINICA</p><h2 id="patient-status-title" className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-xl">Dove siamo?</h2></div>{overview.workflowNotice && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 sm:px-3 sm:py-1.5 sm:text-xs">{overview.workflowNotice.label}</span>}</div>
    <dl className="mt-4 grid gap-x-8 gap-y-3.5 sm:mt-5 sm:grid-cols-2 sm:gap-y-5 lg:grid-cols-3">
      {overview.activePathway && <StatusDatum label="Percorso attivo"><p className="text-sm"><span className="font-bold">{overview.activePathway.title || "Percorso clinico"}</span><span className="text-slate-500"> · dal {formatDate(overview.activePathway.startedOn)}</span></p></StatusDatum>}
      {assessment && <StatusDatum label="Ultima valutazione"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm"><span className="font-bold">{clinicalAssessmentTypeLabel(assessment)}</span><span className="text-slate-500"> · {assessment.clinicalDate ? formatDate(assessment.clinicalDate) : "Data non indicata"} · {assessment.status === "completed" ? "Completata" : "Bozza"}</span></p><Link href={`/pazienti/${patientId}/percorso/${assessment.id}`} className="text-xs font-bold text-sage-700">{assessment.status === "completed" ? "Apri" : "Continua"}</Link></div></StatusDatum>}
      {overview.focusGoals.length > 0 && <StatusDatum label="Focus attuale"><ul className="space-y-1.5">{overview.focusGoals.map((goal) => <li key={goal.id} className="text-sm font-medium">• {goal.title}</li>)}</ul>{overview.activeGoals.length > overview.focusGoals.length && <button onClick={onOpenGoals} className="mt-2 text-sm font-bold text-sage-700">Vedi tutti</button>}</StatusDatum>}
      {overview.latestSession && <StatusDatum label="Ultima seduta"><p className="text-sm"><span className="font-bold">{formatDate(overview.latestSession.date)}</span>{overview.latestSession.result && <span className="text-slate-600"> · {overview.latestSession.result}</span>}</p></StatusDatum>}
      {overview.latestNextPlan && <StatusDatum label="Prossima azione"><p className="line-clamp-3 text-sm leading-6 text-slate-700">{overview.latestNextPlan}</p></StatusDatum>}
      {appointment && <StatusDatum label="Prossimo appuntamento"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm font-bold">{formatDate(appointment.date)} · {appointment.time}{appointment.locationNameSnapshot && <span className="font-normal text-slate-500"> · {appointment.locationNameSnapshot}</span>}</p><Link href="/calendario" className="text-xs font-bold text-sage-700">Apri calendario</Link></div></StatusDatum>}
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
  return <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); await saveGoal(value); onDone(); }}>
    <label className="block text-sm font-bold">Titolo<input required value={value.title} onChange={(e) => setValue((old) => ({...old,title:e.target.value}))} className="mt-2 w-full rounded-xl border border-sage-100 p-3 font-normal" /></label>
    <label className="block text-sm font-bold">Descrizione<textarea value={value.description} onChange={(e) => setValue((old) => ({...old,description:e.target.value}))} className="mt-2 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">Stato<select value={value.status} onChange={(e) => setValue((old) => ({...old,status:e.target.value}))} className="mt-2 w-full rounded-xl border border-sage-100 p-3 font-normal"><option value="not_started">Da iniziare</option><option value="in_progress">In corso</option><option value="consolidation">Consolidamento</option><option value="achieved">Raggiunto</option><option value="suspended">Sospeso</option></select></label>
      <label className="block text-sm font-bold">Progresso ({value.progress}%)<input type="range" min="0" max="100" value={value.progress} onChange={(e) => setValue((old) => ({...old,progress:Number(e.target.value)}))} className="mt-4 w-full" /></label>
    </div>
    <div className="flex justify-end gap-2"><button type="button" onClick={onDone} className="btn btn-quiet">Annulla</button><button className="btn btn-primary">Salva obiettivo</button></div>
  </form>;
}
function SessionEditor({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const { saveSession } = useData();
  const [v, setV] = useState(session);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await saveSession(v);
        onDone();
      }}
      className="space-y-4"
    >
      <label className="block text-sm font-bold">
        Data
        <input
          type="date"
          value={v.date}
          onChange={(e) => { const value=e.target.value; setV((old) => ({ ...old, date: value })) }}
          className="mt-2 w-full rounded-xl border p-3 font-normal"
        />
      </label>
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
        <button type="button" onClick={onDone} className="btn btn-quiet">
          Annulla
        </button>
        <button className="btn btn-primary">Salva seduta</button>
      </div>
    </form>
  );
}
