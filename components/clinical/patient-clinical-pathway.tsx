"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { createConfiguredClinicalAssessmentV2 } from "@/lib/clinical/assessment-v2";
import { clinicalModuleRegistry } from "@/lib/clinical/module-registry";
import { buildClinicalPathwayOverview, type ClinicalPathwayOverview } from "@/lib/clinical/pathway-overview";
import type { ClinicalAssessment, ClinicalAssessmentTypeV2, ClinicalPathway } from "@/lib/clinical/types";
import type { Goal } from "@/lib/types";
import { today, uid } from "@/lib/types";
import { focusFirstInvalidField, validateClinicalPathwayForm, validateNewAssessmentForm, type FieldErrors } from "@/lib/form-validation";

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("it-IT");
const goalStatusLabel = (status: string) => ({ not_started: "Da iniziare", in_progress: "In corso", consolidation: "Consolidamento", achieved: "Raggiunto", suspended: "Sospeso" }[status] || status);

export function PatientClinicalPathway({ patientId, goals, onNewGoal, onOpenActivity }: { patientId: string; goals: Goal[]; onNewGoal: (pathwayId: string) => void; onOpenActivity: () => void }) {
  const router = useRouter();
  const { data, saveClinicalPathway, closeClinicalPathway, deleteClinicalPathway, createClinicalAssessmentDraft, linkGoalToClinicalPathway, unlinkGoalFromClinicalPathway } = useData();
  const [startOpen, setStartOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClinicalPathway | null>(null);
  const [newAssessmentOpen, setNewAssessmentOpen] = useState(false);
  const [error, setError] = useState("");
  const pathways = data.clinicalPathways
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => (b.startedOn + b.createdAt).localeCompare(a.startedOn + a.createdAt));
  const active = pathways.find((item) => item.status === "active");
  const historical = pathways.filter((item) => item.status === "closed");
  const overviewFor = (pathway: ClinicalPathway) => buildClinicalPathwayOverview(pathway, goals, data.sessions, data.clinicalAssessments);
  const requestDelete = (pathway: ClinicalPathway) => {
    const hasAssessments = data.clinicalAssessments.some((assessment) => assessment.clinicalPathwayId === pathway.id);
    if (hasAssessments) {
      setError("Questo percorso contiene valutazioni. Elimina prima le valutazioni che non vuoi conservare oppure chiudi il percorso.");
      return;
    }
    const hasGoals = goals.some((goal) => goal.clinicalPathwayId === pathway.id);
    if (hasGoals) {
      setError("Questo percorso contiene obiettivi collegati e non può essere eliminato. Chiudi il percorso per conservarne lo storico.");
      return;
    }
    setError("");
    setDeleteTarget(pathway);
  };

  const startV2Assessment = async (pathway: ClinicalPathway, input: { assessmentType: ClinicalAssessmentTypeV2; clinicalDate: string; modules: { code: string; version: number }[] }) => {
    const assessment = createConfiguredClinicalAssessmentV2({ patientId, clinicalPathwayId: pathway.id, ...input });
    await createClinicalAssessmentDraft(assessment);
    router.push(`/pazienti/${patientId}/percorso/${assessment.id}`);
  };

  if (!active && historical.length === 0) {
    return <>
      <section className="card px-6 py-10 text-center sm:px-10">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-xl">◎</div>
        <h2 className="mt-4 text-xl font-bold">Percorso clinico</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Organizza valutazioni, obiettivi e percorso terapeutico del paziente. Puoi continuare a utilizzare Armonia normalmente anche senza attivarlo.</p>
        <button onClick={() => setStartOpen(true)} className="btn btn-primary mt-6">Inizia percorso clinico</button>
      </section>
      {startOpen && <StartPathwayModal patientId={patientId} onClose={() => setStartOpen(false)} onSave={saveClinicalPathway} />}
    </>;
  }

  return <div className="space-y-5">
    {active && (() => { const overview = overviewFor(active); return <section className="card relative p-4 sm:p-6">
      <div className="min-w-0 pr-12 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:pr-0">
        <div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="break-words text-lg font-bold sm:text-xl">{active.title || "Percorso clinico"}</h2><span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-bold text-sage-800 sm:px-2.5 sm:py-1 sm:text-xs">Attivo</span></div><p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">Percorso attivo dal {formatDate(active.startedOn)}</p><p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm">Raccoglie valutazioni e obiettivi riferiti allo stesso percorso clinico.</p></div>
        <details className="absolute right-3 top-3 sm:relative sm:right-auto sm:top-auto"><summary aria-label="Azioni percorso" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl text-lg font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 sm:text-xl">•••</summary><div className="absolute right-0 z-10 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"><button onClick={() => setEditOpen(true)} className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Modifica percorso</button><button onClick={() => setCloseOpen(true)} className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">Chiudi percorso</button><button onClick={() => requestDelete(active)} className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">Elimina percorso</button></div></details>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <PathwayWorkspace overview={overview} patientId={patientId} goals={goals} readOnly={false} onNewGoal={onNewGoal} onOpenActivity={onOpenActivity} onStartAssessment={() => setNewAssessmentOpen(true)} onLink={linkGoalToClinicalPathway} onUnlink={unlinkGoalFromClinicalPathway} />
    </section>; })()}
    {!active && <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Nessun percorso attivo</h2><p className="mt-2 text-sm text-slate-500">I percorsi precedenti restano consultabili qui sotto.</p></div><button onClick={() => setStartOpen(true)} className="btn btn-primary">Inizia nuovo percorso</button></div></section>}
    {historical.length > 0 && <section className="card p-4 sm:p-5"><h2 className="font-bold">Percorsi precedenti</h2><div className="mt-3 space-y-2">{historical.map((pathway) => <details key={pathway.id} className="rounded-xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"><div><p className="font-bold">{pathway.title || "Percorso clinico"}</p><p className="mt-0.5 text-sm text-slate-500">{formatDate(pathway.startedOn)} – {pathway.closedOn ? formatDate(pathway.closedOn) : "Data di chiusura non disponibile"}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Chiuso</span><span aria-hidden="true" className="text-slate-400">⌄</span></div></summary><div className="border-t border-slate-100 p-4"><PathwayWorkspace overview={overviewFor(pathway)} patientId={patientId} goals={goals} readOnly onNewGoal={onNewGoal} onOpenActivity={onOpenActivity} onStartAssessment={() => setNewAssessmentOpen(true)} onLink={linkGoalToClinicalPathway} onUnlink={unlinkGoalFromClinicalPathway} /><div className="mt-4 text-right"><button onClick={() => requestDelete(pathway)} className="text-xs font-bold text-red-600">Elimina percorso</button></div></div></details>)}</div></section>}
    {startOpen && <StartPathwayModal patientId={patientId} onClose={() => setStartOpen(false)} onSave={saveClinicalPathway} />}
    {closeOpen && active && <ClosePathwayModal pathway={active} onClose={() => setCloseOpen(false)} onConfirm={closeClinicalPathway} />}
    {editOpen && active && <EditPathwayModal pathway={active} onClose={() => setEditOpen(false)} onSave={saveClinicalPathway} />}
    {deleteTarget && <DeletePathwayModal pathway={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteClinicalPathway} />}
    {newAssessmentOpen && active && <NewAssessmentModal onClose={() => setNewAssessmentOpen(false)} onCreate={(input) => startV2Assessment(active, input)} />}
  </div>;
}

function GoalRow({goal,action}:{goal:Goal;action?:React.ReactNode}) {
  return <div className="rounded-xl bg-slate-50 p-2.5 sm:p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{goal.title}</p><div className="mt-0.5 flex items-center gap-2 sm:mt-1"><span className="text-xs text-slate-500">{goalStatusLabel(goal.status)}</span><span className="text-xs font-bold text-slate-500">{goal.progress}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-slate-200 sm:mt-2"><div className="h-1.5 rounded-full bg-sage-500" style={{width:`${goal.progress}%`}} /></div></div>{action}</div></div>;
}

const assessmentTypeLabel = (assessment: ClinicalAssessment) => assessment.assessmentType === "initial" ? "Prima valutazione" : assessment.assessmentType === "reassessment" ? "Rivalutazione" : assessment.assessmentType === "interim" ? "Valutazione intermedia" : "Altra valutazione";
const assessmentAreaLabel = (assessment: ClinicalAssessment) => assessment.schemaVersion === 1
  ? "Linguaggio e comunicazione"
  : assessment.data.modules.map((module) => clinicalModuleRegistry.find((item) => item.code === module.code && item.version === module.version)?.label).filter(Boolean).join(" · ");

function AssessmentRow({ assessment, patientId }: { assessment: ClinicalAssessment; patientId: string }) {
  const areas = assessmentAreaLabel(assessment);
  const clinicalDate = assessment.clinicalDate || assessment.createdAt.slice(0, 10);
  const draft = assessment.status === "draft";
  return <div className={`rounded-xl border-l-4 p-2.5 sm:p-3 ${draft ? "border-amber-300 bg-amber-50/60" : "border-violet-200 bg-slate-50"}`}><div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-bold">{assessmentTypeLabel(assessment)}</p><p className="mt-0.5 break-words text-xs leading-5 text-slate-500 sm:mt-1">{formatDate(clinicalDate)}{areas ? ` · ${areas}` : ""}</p></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${draft ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600"}`}>{draft ? "Bozza" : "Completata"}</span></div><Link href={`/pazienti/${patientId}/percorso/${assessment.id}`} className="mt-1.5 inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-sage-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 sm:mt-2">{draft ? "Continua" : "Apri"}</Link></div>;
}

function GoalLinksDisclosure({ pathway, goals, onLink, onUnlink }: { pathway: ClinicalPathway; goals: Goal[]; onLink: (goalId: string, pathwayId: string) => Promise<void>; onUnlink: (goalId: string) => Promise<void> }) {
  const [error,setError]=useState("");
  const linked=goals.filter((goal)=>goal.patientId === pathway.patientId && goal.clinicalPathwayId===pathway.id);
  const unlinked=goals.filter((goal)=>goal.patientId === pathway.patientId && !goal.clinicalPathwayId);
  const run=async(action:()=>Promise<void>)=>{setError("");try{await action();}catch(cause){setError(cause instanceof Error?cause.message:"Operazione non riuscita.");}};
  return <details className="mt-2 sm:mt-3"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400">Collega obiettivi esistenti</summary><div className="mt-2 space-y-2 rounded-xl border border-slate-100 p-2.5 sm:p-3">{linked.map((goal)=><GoalRow goal={goal} key={goal.id} action={<button onClick={()=>void run(()=>onUnlink(goal.id))} className="text-xs font-bold text-slate-500 hover:text-red-600">Scollega</button>}/>)}{unlinked.map((goal)=><GoalRow goal={goal} key={goal.id} action={<button onClick={()=>void run(()=>onLink(goal.id,pathway.id))} className="text-xs font-bold text-sage-700">Collega</button>}/>)}{linked.length === 0 && unlinked.length === 0 && <p className="text-sm text-slate-500">Nessun obiettivo disponibile.</p>}{error&&<p role="alert" className="text-sm font-medium text-red-600">{error}</p>}</div></details>;
}

function PathwayWorkspace({ overview, patientId, goals, readOnly, onNewGoal, onOpenActivity, onStartAssessment, onLink, onUnlink }: { overview: ClinicalPathwayOverview; patientId: string; goals: Goal[]; readOnly: boolean; onNewGoal: (pathwayId: string) => void; onOpenActivity: () => void; onStartAssessment: () => void; onLink: (goalId: string, pathwayId: string) => Promise<void>; onUnlink: (goalId: string) => Promise<void> }) {
  const latest = overview.latestRelevantSession;
  return <div className="mt-4 space-y-4 sm:mt-5"><div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
    <section className="rounded-xl border border-slate-200 p-3 sm:rounded-2xl sm:p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wide text-violet-500 sm:text-xs">Valutazioni</p><h3 className="mt-0.5 font-bold sm:mt-1">Valutazioni del percorso</h3></div>{!readOnly && <button onClick={onStartAssessment} className="min-h-11 shrink-0 text-sm font-bold text-sage-700">+ Nuova</button>}</div>{overview.assessments.length ? <div className="mt-2 space-y-2 sm:mt-3">{overview.assessments.slice(0,4).map((assessment)=><AssessmentRow key={assessment.id} assessment={assessment} patientId={patientId}/>)}{overview.assessments.length>4&&<p className="text-sm text-slate-500">+{overview.assessments.length-4} altre valutazioni</p>}</div>:<p className="mt-2 text-sm text-slate-500 sm:mt-3">Nessuna valutazione collegata.</p>}</section>
    <section className="rounded-xl border border-slate-200 p-3 sm:rounded-2xl sm:p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wide text-sage-600 sm:text-xs">Obiettivi</p><h3 className="mt-0.5 font-bold sm:mt-1">Obiettivi del percorso</h3></div>{!readOnly&&<button onClick={()=>onNewGoal(overview.pathway.id)} className="min-h-11 shrink-0 text-sm font-bold text-sage-700">+ Nuovo</button>}</div>{overview.visibleActiveGoals.length?<div className="mt-2 space-y-2 sm:mt-3">{overview.visibleActiveGoals.map((goal)=><GoalRow goal={goal} key={goal.id}/>)}{overview.hiddenActiveGoalCount>0&&<p className="text-sm text-slate-500">+{overview.hiddenActiveGoalCount} altri obiettivi attivi</p>}</div>:<p className="mt-2 text-sm text-slate-500 sm:mt-3">Nessun obiettivo associato.</p>}{overview.historicalGoals.length>0&&<p className="mt-2 text-xs text-slate-400 sm:mt-3">{overview.historicalGoals.length} obiettiv{overview.historicalGoals.length===1?"o concluso o sospeso":"i conclusi o sospesi"}</p>}{!readOnly&&<GoalLinksDisclosure pathway={overview.pathway} goals={goals} onLink={onLink} onUnlink={onUnlink}/>}</section>
  </div>{overview.relevantSessions.length>0&&<section className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-slate-800">{overview.relevantSessions.length} sedut{overview.relevantSessions.length===1?"a ha":"e hanno"} coinvolto obiettivi di questo percorso</p>{latest&&<p className="mt-1 text-sm text-slate-500">Ultima: {formatDate(latest.date)}</p>}</div><button onClick={onOpenActivity} className="text-sm font-bold text-sky-800">Vedi attività</button></section>}</div>;
}

function EditPathwayModal({ pathway, onClose, onSave }: { pathway: ClinicalPathway; onClose: () => void; onSave: (pathway: ClinicalPathway) => Promise<void> }) {
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({}); const [serverError,setServerError]=useState(""); const [saving,setSaving]=useState(false);
  return <Modal title="Modifica percorso" onClose={()=>!saving&&onClose()}><form noValidate className="space-y-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const startedOn=String(form.get("startedOn")||""); const errors=validateClinicalPathwayForm({startedOn}); if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;} setSaving(true);setFieldErrors({});setServerError("");try { await onSave({ ...pathway, title: String(form.get("title") || "").trim() || undefined, startedOn, updatedAt: new Date().toISOString() }); onClose(); } catch { setServerError("Non è stato possibile salvare il percorso. Riprova.");setSaving(false); } }}><Field id="pathway-edit-start" data-validation-field="startedOn" name="startedOn" label="Data di inizio" type="date" required defaultValue={pathway.startedOn} error={fieldErrors.startedOn} onChange={()=>setFieldErrors({})}/><Field name="title" label="Titolo opzionale" defaultValue={pathway.title || ""} placeholder="Percorso clinico" />{serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</p>}<p className="text-xs leading-5 text-slate-500">Stato e valutazioni del percorso non verranno modificati.</p><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving?"Salvataggio…":"Salva modifiche"}</button></div></form></Modal>;
}

function DeletePathwayModal({ pathway, onClose, onConfirm }: { pathway: ClinicalPathway; onClose: () => void; onConfirm: (id: string) => Promise<void> }) {
  const [error, setError] = useState("");
  const [deleting,setDeleting]=useState(false);
  return <Modal title="Elimina percorso" onClose={()=>!deleting&&onClose()}><p className="text-sm leading-6 text-slate-600">Vuoi eliminare “{pathway.title || "Percorso clinico"}”? L’operazione riguarda soltanto questo percorso vuoto e non modifica il paziente, le sedute o gli obiettivi.</p>{error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}<div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" disabled={deleting} onClick={onClose} className="btn btn-quiet">Annulla</button><button type="button" disabled={deleting} aria-busy={deleting} onClick={async()=>{setDeleting(true);setError("");try{await onConfirm(pathway.id);onClose();}catch{setError("Non è stato possibile eliminare il percorso. Riprova.");setDeleting(false);}}} className="btn bg-red-600 text-white disabled:opacity-60">{deleting?"Eliminazione…":"Conferma eliminazione"}</button></div></Modal>;
}

function NewAssessmentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { assessmentType: ClinicalAssessmentTypeV2; clinicalDate: string; modules: { code: string; version: number }[] }) => Promise<void> }) {
  const [assessmentType, setAssessmentType] = useState<ClinicalAssessmentTypeV2>("initial");
  const [clinicalDate, setClinicalDate] = useState(today());
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({}); const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const typeOptions: { value: ClinicalAssessmentTypeV2; label: string }[] = [{ value: "initial", label: "Prima valutazione" }, { value: "reassessment", label: "Rivalutazione" }, { value: "interim", label: "Valutazione intermedia" }, { value: "other", label: "Altro" }];
  return <Modal title="Nuova valutazione" onClose={()=>!saving&&onClose()}><form noValidate className="space-y-6" onSubmit={async (event) => { event.preventDefault(); const errors=validateNewAssessmentForm({assessmentType,clinicalDate});if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}setFieldErrors({});setServerError("");setSaving(true);try { await onCreate({ assessmentType, clinicalDate, modules: [] }); } catch { setServerError("Non è stato possibile creare la valutazione. Riprova."); setSaving(false); } }}>
    <fieldset data-validation-field="assessmentType" tabIndex={-1} aria-invalid={Boolean(fieldErrors.assessmentType)} aria-describedby={fieldErrors.assessmentType?"assessment-type-error":undefined}><legend className="text-sm font-bold">Tipo di valutazione</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{typeOptions.map((option) => <button type="button" key={option.value} aria-pressed={assessmentType === option.value} onClick={() => {setAssessmentType(option.value);setFieldErrors({});}} className={`rounded-xl border px-4 py-3 text-left text-sm ${assessmentType === option.value ? "border-sage-500 bg-sage-100 font-bold text-sage-700" : "border-sage-100 text-slate-600"}`}>{option.label}</button>)}</div>{fieldErrors.assessmentType&&<p id="assessment-type-error" role="alert" className="mt-2 text-sm text-red-700">{fieldErrors.assessmentType}</p>}</fieldset>
    <Field id="assessment-clinical-date" data-validation-field="clinicalDate" label="Data clinica" type="date" required value={clinicalDate} error={fieldErrors.clinicalDate} onChange={(event) => {setClinicalDate(event.target.value);setFieldErrors({});}} />
    {serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving ? "Creazione…" : "Crea valutazione"}</button></div>
  </form></Modal>;
}

function StartPathwayModal({ patientId, onClose, onSave }: { patientId: string; onClose: () => void; onSave: (pathway: ClinicalPathway) => Promise<void> }) {
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({}); const [serverError,setServerError]=useState(""); const [saving,setSaving]=useState(false);
  return <Modal title="Inizia percorso clinico" onClose={()=>!saving&&onClose()}><form noValidate className="space-y-4" onSubmit={async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget);const startedOn=String(form.get("startedOn")||"");const errors=validateClinicalPathwayForm({startedOn});if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}const timestamp = new Date().toISOString();setSaving(true);setFieldErrors({});setServerError("");try { await onSave({ id: uid(), patientId, status: "active", title: String(form.get("title") || "").trim() || undefined, startedOn, createdAt: timestamp, updatedAt: timestamp }); onClose(); } catch { setServerError("Non è stato possibile salvare il percorso. Riprova.");setSaving(false); } }}><Field id="pathway-start" data-validation-field="startedOn" name="startedOn" label="Data di inizio" type="date" required defaultValue={today()} error={fieldErrors.startedOn} onChange={()=>setFieldErrors({})}/><Field name="title" label="Titolo opzionale" placeholder="Percorso clinico" />{serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving?"Salvataggio…":"Inizia percorso"}</button></div></form></Modal>;
}

function ClosePathwayModal({ pathway, onClose, onConfirm }: { pathway: ClinicalPathway; onClose: () => void; onConfirm: (id: string, closedOn: string) => Promise<void> }) {
  const [fieldErrors,setFieldErrors]=useState<FieldErrors>({}); const [serverError,setServerError]=useState(""); const [saving,setSaving]=useState(false);
  return <Modal title="Chiudi percorso" onClose={()=>!saving&&onClose()}><form noValidate className="space-y-4" onSubmit={async (event) => { event.preventDefault();const form=new FormData(event.currentTarget);const closedOn=String(form.get("closedOn")||"");const errors=validateClinicalPathwayForm({startedOn:pathway.startedOn,closedOn});if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}setSaving(true);setFieldErrors({});setServerError("");try { await onConfirm(pathway.id,closedOn);onClose(); } catch { setServerError("Non è stato possibile chiudere il percorso. Riprova.");setSaving(false); } }}><p className="text-sm leading-6 text-slate-600">La chiusura non elimina valutazioni, obiettivi o sedute. Il percorso resterà consultabile nello storico.</p><Field id="pathway-close" data-validation-field="closedOn" name="closedOn" label="Data di chiusura" type="date" min={pathway.startedOn} required defaultValue={today() < pathway.startedOn ? pathway.startedOn : today()} error={fieldErrors.closedOn} onChange={()=>setFieldErrors({})}/>{serverError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</p>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={onClose} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving?"Salvataggio…":"Conferma chiusura"}</button></div></form></Modal>;
}
