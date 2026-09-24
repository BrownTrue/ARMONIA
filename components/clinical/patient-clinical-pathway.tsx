"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { createLanguageCommunicationAssessmentV1 } from "@/lib/clinical/assessment-v1";
import { createConfiguredClinicalAssessmentV2 } from "@/lib/clinical/assessment-v2";
import { clinicalModuleRegistry } from "@/lib/clinical/module-registry";
import type { ClinicalAssessmentTypeV2, ClinicalPathway } from "@/lib/clinical/types";
import type { Goal } from "@/lib/types";
import { today, uid } from "@/lib/types";

const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("it-IT");
const formatUpdatedAt = (value: string) => new Date(value).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
const goalStatusLabel = (status: string) => ({ not_started: "Da iniziare", in_progress: "In corso", consolidation: "Consolidamento", achieved: "Raggiunto", suspended: "Sospeso" }[status] || status);

export function PatientClinicalPathway({ patientId, goals, onOpenGoals }: { patientId: string; goals: Goal[]; onOpenGoals: () => void }) {
  const router = useRouter();
  const { data, connection, saveClinicalPathway, closeClinicalPathway, deleteClinicalPathway, createClinicalAssessmentDraft, linkGoalToClinicalPathway, unlinkGoalFromClinicalPathway } = useData();
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

  const startAssessment = async (pathway: ClinicalPathway) => {
    setError("");
    try {
      const assessment = createLanguageCommunicationAssessmentV1(patientId, pathway.id);
      await createClinicalAssessmentDraft(assessment);
      router.push(`/pazienti/${patientId}/percorso/${assessment.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossibile creare la valutazione.");
    }
  };
  const startV2Assessment = async (pathway: ClinicalPathway, input: { assessmentType: ClinicalAssessmentTypeV2; clinicalDate: string; modules: { code: string; version: number }[] }) => {
    if (connection.kind !== "local") throw new Error("Le nuove valutazioni modulari sono disponibili soltanto in modalità locale.");
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
    {active && <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><h2 className="text-xl font-bold">{active.title || "Percorso clinico"}</h2><span className="chip">Attivo</span></div><p className="mt-2 text-sm text-slate-500">Attivo dal {formatDate(active.startedOn)}</p></div>
        <div className="flex flex-wrap justify-end gap-2"><button onClick={() => setEditOpen(true)} className="btn btn-quiet text-sm">Modifica percorso</button><button onClick={() => setCloseOpen(true)} className="btn btn-quiet text-sm">Chiudi percorso</button><button onClick={() => requestDelete(active)} className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Elimina percorso</button></div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <AssessmentPanel pathway={active} assessments={data.clinicalAssessments.filter((item) => item.clinicalPathwayId === active.id)} onStart={connection.kind === "local" ? () => setNewAssessmentOpen(true) : () => startAssessment(active)} patientId={patientId} />
        <PathwayGoalsPanel pathway={active} goals={goals} onOpenGoals={onOpenGoals} onLink={linkGoalToClinicalPathway} onUnlink={unlinkGoalFromClinicalPathway} />
      </div>
    </section>}
    {!active && <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Nessun percorso attivo</h2><p className="mt-2 text-sm text-slate-500">I percorsi precedenti restano consultabili qui sotto.</p></div><button onClick={() => setStartOpen(true)} className="btn btn-primary">Inizia nuovo percorso</button></div></section>}
    {historical.length > 0 && <section className="card p-5 sm:p-6"><h2 className="font-bold">Percorsi precedenti</h2><div className="mt-4 space-y-3">{historical.map((pathway) => {
      const assessments = data.clinicalAssessments.filter((item) => item.clinicalPathwayId === pathway.id);
      const linkedGoals = goals.filter((goal) => goal.clinicalPathwayId === pathway.id);
      return <div key={pathway.id} className="rounded-2xl border border-sage-100 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{pathway.title || "Percorso clinico"}</p><p className="mt-1 text-sm text-slate-500">{formatDate(pathway.startedOn)} – {pathway.closedOn ? formatDate(pathway.closedOn) : "—"}</p></div><div className="flex items-center gap-2"><span className="chip">Chiuso</span><button onClick={() => requestDelete(pathway)} className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Elimina</button></div></div>{assessments.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{assessments.map((assessment) => <Link key={assessment.id} href={`/pazienti/${patientId}/percorso/${assessment.id}`} className="btn btn-quiet text-sm">Prima valutazione · {assessment.status === "completed" ? "Completata" : "Bozza"}</Link>)}</div>}{linkedGoals.length > 0 && <div className="mt-4 border-t border-sage-100 pt-4"><p className="text-xs font-bold text-slate-500">OBIETTIVI COLLEGATI</p><div className="mt-2 space-y-2">{linkedGoals.map((goal)=><GoalRow goal={goal} key={goal.id}/>)}</div><p className="mt-3 text-xs text-slate-400">Collegamento storico in sola lettura.</p></div>}</div>;
    })}</div></section>}
    {startOpen && <StartPathwayModal patientId={patientId} onClose={() => setStartOpen(false)} onSave={saveClinicalPathway} />}
    {closeOpen && active && <ClosePathwayModal pathway={active} onClose={() => setCloseOpen(false)} onConfirm={closeClinicalPathway} />}
    {editOpen && active && <EditPathwayModal pathway={active} onClose={() => setEditOpen(false)} onSave={saveClinicalPathway} />}
    {deleteTarget && <DeletePathwayModal pathway={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteClinicalPathway} />}
    {newAssessmentOpen && active && <NewAssessmentModal onClose={() => setNewAssessmentOpen(false)} onCreate={(input) => startV2Assessment(active, input)} />}
  </div>;
}

function GoalRow({goal,action}:{goal:Goal;action?:React.ReactNode}) {
  return <div className="rounded-xl bg-sage-50 p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-bold">{goal.title}</p><p className="mt-1 text-xs text-slate-500">{goalStatusLabel(goal.status)} · {goal.progress}%</p></div>{action}</div></div>;
}

function PathwayGoalsPanel({pathway,goals,onOpenGoals,onLink,onUnlink}:{pathway:ClinicalPathway;goals:Goal[];onOpenGoals:()=>void;onLink:(goalId:string,pathwayId:string)=>Promise<void>;onUnlink:(goalId:string)=>Promise<void>}) {
  const [error,setError]=useState("");
  const linked=goals.filter((goal)=>goal.clinicalPathwayId===pathway.id);
  const unlinked=goals.filter((goal)=>!goal.clinicalPathwayId);
  const run=async(action:()=>Promise<void>)=>{setError("");try{await action();}catch(cause){setError(cause instanceof Error?cause.message:"Operazione non riuscita.");}};
  return <div className="rounded-2xl border border-sage-100 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-500">OBIETTIVI DEL PERCORSO</p><button onClick={onOpenGoals} className="text-xs font-bold text-sage-700">Gestisci obiettivi</button></div>{linked.length?<div className="mt-3 space-y-2">{linked.map((goal)=><GoalRow goal={goal} key={goal.id} action={<button onClick={()=>void run(()=>onUnlink(goal.id))} className="text-xs font-bold text-slate-500 hover:text-red-600">Scollega</button>}/>)}</div>:<p className="mt-3 text-sm text-slate-500">Nessun obiettivo collegato.</p>}{unlinked.length>0&&<div className="mt-5 border-t border-sage-100 pt-4"><p className="text-xs font-bold text-slate-500">ALTRI OBIETTIVI DEL PAZIENTE</p><div className="mt-3 space-y-2">{unlinked.map((goal)=><GoalRow goal={goal} key={goal.id} action={<button onClick={()=>void run(()=>onLink(goal.id,pathway.id))} className="text-xs font-bold text-sage-700">Collega al percorso</button>}/>)}</div></div>}{error&&<p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}</div>;
}

function EditPathwayModal({ pathway, onClose, onSave }: { pathway: ClinicalPathway; onClose: () => void; onSave: (pathway: ClinicalPathway) => Promise<void> }) {
  const [error, setError] = useState("");
  return <Modal title="Modifica percorso" onClose={onClose}><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); try { await onSave({ ...pathway, title: String(form.get("title") || "").trim() || undefined, startedOn: String(form.get("startedOn") || ""), updatedAt: new Date().toISOString() }); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossibile modificare il percorso."); } }}><Field name="startedOn" label="Data di inizio" type="date" required defaultValue={pathway.startedOn} /><Field name="title" label="Titolo opzionale" defaultValue={pathway.title || ""} placeholder="Percorso clinico" />{error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<p className="text-xs leading-5 text-slate-500">Stato e valutazioni del percorso non verranno modificati.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button className="btn btn-primary">Salva modifiche</button></div></form></Modal>;
}

function DeletePathwayModal({ pathway, onClose, onConfirm }: { pathway: ClinicalPathway; onClose: () => void; onConfirm: (id: string) => Promise<void> }) {
  const [error, setError] = useState("");
  return <Modal title="Elimina percorso" onClose={onClose}><p className="text-sm leading-6 text-slate-600">Vuoi eliminare “{pathway.title || "Percorso clinico"}”? L’operazione riguarda soltanto questo percorso vuoto e non modifica il paziente, le sedute o gli obiettivi.</p>{error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}<div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button type="button" onClick={async()=>{setError("");try{await onConfirm(pathway.id);onClose();}catch(cause){setError(cause instanceof Error?cause.message:"Impossibile eliminare il percorso.");}}} className="btn bg-red-600 text-white">Conferma eliminazione</button></div></Modal>;
}

function AssessmentPanel({ assessments, onStart, patientId }: { pathway: ClinicalPathway; assessments: ReturnType<typeof useData>["data"]["clinicalAssessments"]; onStart: () => void; patientId: string }) {
  const sorted = [...assessments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const typeLabel = (assessment: (typeof assessments)[number]) => assessment.schemaVersion === 1 || assessment.assessmentType === "initial" ? "Prima valutazione" : assessment.assessmentType === "reassessment" ? "Rivalutazione" : assessment.assessmentType === "interim" ? "Valutazione intermedia" : "Valutazione";
  const areaLabel = (assessment: (typeof assessments)[number]) => assessment.schemaVersion === 1 ? "Linguaggio e comunicazione" : assessment.data.modules.map((module) => clinicalModuleRegistry.find((item) => item.code === module.code && item.version === module.version)?.label).filter(Boolean).join(" · ");
  return <div className="rounded-2xl border border-sage-100 p-5"><p className="text-sm font-bold text-slate-500">VALUTAZIONI</p>{sorted.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nessuna valutazione registrata.</p> : <div className="mt-4 space-y-3">{sorted.map((assessment) => <div key={assessment.id} className="rounded-xl bg-sage-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{typeLabel(assessment)}</p><p className="mt-1 text-sm text-slate-500">{areaLabel(assessment)}</p></div><span className="chip">{assessment.status === "completed" ? "Completata" : "Bozza"}</span></div><p className="mt-3 text-xs text-slate-400">Ultimo aggiornamento {formatUpdatedAt(assessment.updatedAt)}</p><Link href={`/pazienti/${patientId}/percorso/${assessment.id}`} className="btn btn-quiet mt-4 inline-block text-sm">{assessment.status === "completed" ? "Apri" : "Continua"}</Link></div>)}</div>}<div className="mt-5"><button onClick={onStart} className="btn btn-primary text-sm">Nuova valutazione</button></div></div>;
}

function NewAssessmentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { assessmentType: ClinicalAssessmentTypeV2; clinicalDate: string; modules: { code: string; version: number }[] }) => Promise<void> }) {
  const [assessmentType, setAssessmentType] = useState<ClinicalAssessmentTypeV2>("initial");
  const [clinicalDate, setClinicalDate] = useState(today());
  const [selected, setSelected] = useState(() => clinicalModuleRegistry.length ? [`${clinicalModuleRegistry[0].code}@${clinicalModuleRegistry[0].version}`] : []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const typeOptions: { value: ClinicalAssessmentTypeV2; label: string }[] = [{ value: "initial", label: "Prima valutazione" }, { value: "reassessment", label: "Rivalutazione" }, { value: "interim", label: "Valutazione intermedia" }, { value: "other", label: "Altro" }];
  return <Modal title="Nuova valutazione" onClose={onClose}><form className="space-y-6" onSubmit={async (event) => { event.preventDefault(); setError(""); const modules = clinicalModuleRegistry.filter((module) => selected.includes(`${module.code}@${module.version}`)).map(({ code, version }) => ({ code, version })); if (!modules.length) { setError("Seleziona almeno un’area clinica."); return; } setSaving(true); try { await onCreate({ assessmentType, clinicalDate, modules }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossibile creare la valutazione."); setSaving(false); } }}>
    <fieldset><legend className="text-sm font-bold">Tipo di valutazione</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{typeOptions.map((option) => <button type="button" key={option.value} aria-pressed={assessmentType === option.value} onClick={() => setAssessmentType(option.value)} className={`rounded-xl border px-4 py-3 text-left text-sm ${assessmentType === option.value ? "border-sage-500 bg-sage-100 font-bold text-sage-700" : "border-sage-100 text-slate-600"}`}>{option.label}</button>)}</div></fieldset>
    <Field label="Data clinica" type="date" required value={clinicalDate} onChange={(event) => setClinicalDate(event.target.value)} />
    <fieldset><legend className="text-sm font-bold">Aree da includere nella valutazione</legend><p className="mt-1 text-xs leading-5 text-slate-500">Puoi includere una o più aree cliniche nella stessa valutazione.</p><div className="mt-3 grid gap-3">{clinicalModuleRegistry.map((module) => { const key = `${module.code}@${module.version}`; const checked = selected.includes(key); return <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${checked ? "border-sage-500 bg-sage-50" : "border-sage-100"}`}><input type="checkbox" checked={checked} onChange={() => setSelected((current) => checked ? current.filter((item) => item !== key) : [...current, key])} /><span className="font-bold">{module.label}</span></label>; })}</div></fieldset>
    {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button disabled={saving} className="btn btn-primary">{saving ? "Creazione…" : "Crea valutazione"}</button></div>
  </form></Modal>;
}

function StartPathwayModal({ patientId, onClose, onSave }: { patientId: string; onClose: () => void; onSave: (pathway: ClinicalPathway) => Promise<void> }) {
  const [error, setError] = useState("");
  return <Modal title="Inizia percorso clinico" onClose={onClose}><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const timestamp = new Date().toISOString(); try { await onSave({ id: uid(), patientId, status: "active", title: String(form.get("title") || "").trim() || undefined, startedOn: String(form.get("startedOn") || ""), createdAt: timestamp, updatedAt: timestamp }); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossibile creare il percorso."); } }}><Field name="startedOn" label="Data di inizio" type="date" required defaultValue={today()} /><Field name="title" label="Titolo opzionale" placeholder="Percorso clinico" />{error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button className="btn btn-primary">Inizia percorso</button></div></form></Modal>;
}

function ClosePathwayModal({ pathway, onClose, onConfirm }: { pathway: ClinicalPathway; onClose: () => void; onConfirm: (id: string, closedOn: string) => Promise<void> }) {
  const [error, setError] = useState("");
  return <Modal title="Chiudi percorso" onClose={onClose}><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); try { await onConfirm(pathway.id, String(form.get("closedOn") || "")); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossibile chiudere il percorso."); } }}><p className="text-sm leading-6 text-slate-600">La chiusura non elimina valutazioni, obiettivi o sedute. Il percorso resterà consultabile nello storico.</p><Field name="closedOn" label="Data di chiusura" type="date" min={pathway.startedOn} required defaultValue={today() < pathway.startedOn ? pathway.startedOn : today()} />{error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button className="btn btn-primary">Conferma chiusura</button></div></form></Modal>;
}
