"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClinicalAssessmentPrint } from "@/components/clinical/assessment-print-dispatch";
import { useBranding } from "@/components/branding-provider";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { getClinicalModuleEditor } from "./module-editor-registry";
import { ClinicalAutosaveQueue } from "@/lib/clinical/autosave-queue";
import { addClinicalModule, clinicalAssessmentTypeLabel, createAssessmentTestV2, INITIAL_ASSESSMENT_STEP, isClinicalAssessmentV2ReadOnly, removeClinicalModule, requiresClinicalModuleRemovalConfirmation, setClinicalAssessmentV2Section, shouldAutosaveClinicalAssessmentV2, type ClinicalModuleInstance } from "@/lib/clinical/assessment-v2";
import type { AssessmentTestEntryV1 } from "@/lib/clinical/assessment-v1";
import type { ClinicalAssessmentV2 } from "@/lib/clinical/types";
import { clinicalModuleRegistry, getClinicalModuleDefinition } from "@/lib/clinical/module-registry";
import { formatMultilineList, parseMultilineList } from "@/lib/clinical/multiline-list";
import { waitForPrintableLogo } from "@/lib/branding/image";
import { fullName } from "@/lib/types";

const steps = ["Motivo dell’accesso", "Anamnesi", "Aree cliniche", "Test / strumenti", "Sintesi", "Obiettivi / pianificazione"];

export function AssessmentV2Editor({ source }: { source: ClinicalAssessmentV2 }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, connection, autosaveClinicalAssessmentDraft, completeClinicalAssessment, correctClinicalAssessment, deleteClinicalAssessment } = useData();
  const { logoSrc, ready: brandingReady } = useBranding();
  const [draft, setDraft] = useState(source);
  const draftRef = useRef(source);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef(new ClinicalAutosaveQueue());
  const revisionRef = useRef(0);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const originalCompletedRef = useRef<ClinicalAssessmentV2 | null>(null);
  const printRequestedRef = useRef(false);
  const [step, setStep] = useState(INITIAL_ASSESSMENT_STEP);
  const [expandedModules, setExpandedModules] = useState(() => new Set(source.data.modules.slice(0, 1).map((module) => `${module.code}@${module.version}`)));

  const persist = async (candidate: ClinicalAssessmentV2, revision: number) => {
    setSaveState("saving"); setMessage("");
    try {
      if (!shouldAutosaveClinicalAssessmentV2(candidate, correcting)) return;
      await queueRef.current.enqueue(() => autosaveClinicalAssessmentDraft(candidate));
      if (revision === revisionRef.current) { setDirty(false); setSaveState("saved"); }
    } catch (cause) {
      setSaveState("error"); setMessage(cause instanceof Error ? cause.message : "Salvataggio non riuscito."); throw cause;
    }
  };
  useEffect(() => {
    if (!dirty || !shouldAutosaveClinicalAssessmentV2(draft, correcting)) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const revision = revisionRef.current;
    timerRef.current = setTimeout(() => void persist(draftRef.current, revision).catch(() => undefined), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dirty, draft]);
  useEffect(() => { if (draft.status !== "completed" || !brandingReady || printRequestedRef.current) return; if (new URLSearchParams(window.location.search).get("print") !== "1") return; printRequestedRef.current = true; void waitForPrintableLogo().then(() => window.print()); }, [draft.status, brandingReady, logoSrc]);

  const updateDraft = (next: ClinicalAssessmentV2) => {
    if (draftRef.current.status === "completed" && !correcting) return;
    const timestamped = { ...next, updatedAt: new Date().toISOString() };
    revisionRef.current += 1; draftRef.current = timestamped; setDraft(timestamped); setDirty(true); setSaveState(correcting ? "saved" : "saving");
  };
  const updateModule = (index: number, module: ClinicalModuleInstance) => updateDraft({ ...draftRef.current, data: { ...draftRef.current.data, modules: draftRef.current.data.modules.map((current, currentIndex) => currentIndex === index ? module : current) } });
  const forceSave = async () => { if (timerRef.current) clearTimeout(timerRef.current); await persist(draftRef.current, revisionRef.current); };
  const patient = data.patients.find((item) => item.id === id);
  if (!patient || draft.patientId !== patient.id) return <AppShell><p>Valutazione non trovata o non coerente con il paziente.</p></AppShell>;
  if (connection.kind !== "local") return <AppShell><p>Questa valutazione modulare è disponibile soltanto in modalità locale durante questa fase.</p><Link href={`/pazienti/${id}?tab=clinical`} className="mt-4 inline-block font-bold text-sage-700">Torna al paziente</Link></AppShell>;
  const pathway = data.clinicalPathways.find((item) => item.id === draft.clinicalPathwayId);
  const pathwayGoals = data.goals.filter((goal) => goal.clinicalPathwayId === draft.clinicalPathwayId);
  const readOnly = isClinicalAssessmentV2ReadOnly(draft, correcting);

  const complete = async () => { setCompleteOpen(false); setMessage(""); try { await forceSave(); await completeClinicalAssessment(draft.id); const completed = { ...draftRef.current, status: "completed" as const, updatedAt: new Date().toISOString() }; draftRef.current = completed; setDraft(completed); setDirty(false); setSaveState("saved"); setMessage("Valutazione completata. Ora è disponibile in sola lettura."); } catch (cause) { setSaveState("error"); setMessage(cause instanceof Error ? cause.message : "Non è stato possibile completare la valutazione."); } };
  const startCorrection = () => { originalCompletedRef.current = draftRef.current; setCorrecting(true); setCorrectOpen(false); setDirty(false); setMessage(""); };
  const cancelCorrection = () => { const original = originalCompletedRef.current; if (original) { draftRef.current = original; setDraft(original); } setCorrecting(false); setDirty(false); setSaveState("saved"); setMessage(""); originalCompletedRef.current = null; };
  const saveCorrection = async () => { setMessage(""); try { const corrected = await correctClinicalAssessment(draftRef.current); if (corrected.schemaVersion !== 2) throw new Error("La correzione restituita non è compatibile con questa valutazione."); draftRef.current = corrected; setDraft(corrected); setCorrecting(false); setDirty(false); setSaveState("saved"); originalCompletedRef.current = null; setMessage("Correzioni salvate. La valutazione resta completata."); } catch (cause) { setSaveState("error"); setMessage(cause instanceof Error ? cause.message : "Non è stato possibile salvare le correzioni."); } };

  return <AppShell>{readOnly && <ClinicalAssessmentPrint patientName={fullName(patient)} assessment={draft} pathwayTitle={pathway?.title} professional={data.profile} logoSrc={logoSrc} goals={pathwayGoals} />}<div className="assessment-screen-only mx-auto max-w-5xl">
    <Link href={`/pazienti/${id}?tab=clinical`} className="text-sm font-bold text-sage-700">← Percorso clinico</Link>
    <header className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-sage-700">{fullName(patient)}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{clinicalAssessmentTypeLabel(draft.assessmentType)}</h1><p className="mt-2 text-sm text-slate-500">Data clinica {draft.clinicalDate ? new Date(`${draft.clinicalDate}T12:00:00`).toLocaleDateString("it-IT") : "non indicata"}</p></div><div className="text-right"><span className="chip">{correcting ? "Correzione in corso" : readOnly ? "Completata" : "Bozza locale"}</span><p className={`mt-2 text-xs ${saveState === "error" ? "text-red-600" : "text-slate-400"}`}>{correcting ? (dirty ? "Modifiche non salvate · autosave disattivato" : "Salvataggio manuale · autosave disattivato") : readOnly ? "Sola lettura" : saveState === "saving" ? "Salvataggio…" : saveState === "error" ? "Errore di salvataggio" : "Salvato"}</p></div></header>
    <nav aria-label="Passaggi della valutazione" className="mt-7 overflow-x-auto pb-2"><ol className="flex min-w-max gap-2">{steps.map((label, index) => <li key={label}><button type="button" onClick={() => setStep(index)} aria-current={step === index ? "step" : undefined} className={`rounded-xl border px-3 py-2 text-left text-sm ${step === index ? "border-sage-500 bg-sage-100 font-bold text-sage-700" : "border-sage-100 bg-white text-slate-500"}`}><span className="mr-2 text-xs">{index + 1}</span>{label}</button></li>)}</ol></nav>
    <fieldset disabled={readOnly}><main className="mt-5">{step === 0 ? <AccessReasonStep draft={draft} onUpdate={updateDraft} /> : step === 1 ? <AnamnesisStep draft={draft} onUpdate={updateDraft} /> : step === 2 ? <ClinicalAreasStep draft={draft} expanded={expandedModules} setExpanded={setExpandedModules} onUpdateModule={updateModule} onUpdateAssessment={updateDraft} /> : step === 3 ? <TestsStep draft={draft} onUpdate={updateDraft} /> : step === 4 ? <SummaryStep draft={draft} onUpdate={updateDraft} /> : <PlanningStep draft={draft} goals={pathwayGoals} patientId={id} onUpdate={updateDraft} />}</main></fieldset>
    {message && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">{!readOnly && !correcting ? <button type="button" onClick={async () => { if (timerRef.current) clearTimeout(timerRef.current); await deleteClinicalAssessment(draft.id); router.push(`/pazienti/${id}?tab=clinical`); }} className="text-sm font-bold text-red-600">Elimina bozza</button> : <span />}<div className="flex flex-wrap gap-2"><button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="btn btn-quiet">Indietro</button>{step < steps.length - 1 && <button type="button" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="btn btn-quiet">Avanti</button>}{readOnly && <><button type="button" onClick={() => setCorrectOpen(true)} className="btn btn-quiet">Correggi valutazione</button><button type="button" disabled={!brandingReady} onClick={async () => { await waitForPrintableLogo(); window.print(); }} className="btn btn-primary">Stampa</button></>}{correcting ? <><button type="button" onClick={cancelCorrection} className="btn btn-quiet">Annulla correzione</button><button type="button" onClick={saveCorrection} className="btn btn-primary">Salva correzioni</button></> : !readOnly && <><button type="button" onClick={async () => { try { await forceSave(); router.push(`/pazienti/${id}?tab=clinical`); } catch {} }} className="btn btn-quiet">Salva e chiudi</button><button type="button" onClick={() => setCompleteOpen(true)} className="btn btn-primary">Completa valutazione</button></>}</div></div>
  </div>{completeOpen && <Modal title="Completa valutazione" onClose={() => setCompleteOpen(false)}><p className="text-sm leading-6 text-slate-600">La valutazione verrà salvata e diventerà disponibile in sola lettura. Potrai modificarla successivamente soltanto tramite una correzione esplicita.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCompleteOpen(false)} className="btn btn-quiet">Annulla</button><button type="button" onClick={complete} className="btn btn-primary">Conferma completamento</button></div></Modal>}{correctOpen && <Modal title="Correggi valutazione" onClose={() => setCorrectOpen(false)}><p className="text-sm leading-6 text-slate-600">L’autosave resterà disattivato. Potrai annullare oppure salvare esplicitamente le correzioni mantenendo la valutazione completata.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCorrectOpen(false)} className="btn btn-quiet">Annulla</button><button type="button" onClick={startCorrection} className="btn btn-primary">Inizia correzione</button></div></Modal>}</AppShell>;
}

function ClinicalAreasStep({ draft, expanded, setExpanded, onUpdateModule, onUpdateAssessment }: { draft: ClinicalAssessmentV2; expanded: Set<string>; setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>; onUpdateModule: (index: number, module: ClinicalModuleInstance) => void; onUpdateAssessment: (assessment: ClinicalAssessmentV2) => void }) {
  const manageEnabled = clinicalModuleRegistry.length > 1;
  return <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Aree cliniche</h2><p className="mt-2 text-sm text-slate-500">Compila soltanto ciò che è pertinente alla valutazione.</p></div>{manageEnabled && <details className="relative"><summary className="btn btn-quiet cursor-pointer list-none text-sm">Gestisci aree</summary><div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-sage-100 bg-white p-3 shadow-xl">{clinicalModuleRegistry.map((definition) => { const present = draft.data.modules.some((module) => module.code === definition.code && module.version === definition.version); return <button type="button" key={`${definition.code}@${definition.version}`} className="flex w-full justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-sage-50" onClick={() => { if (!present) { onUpdateAssessment(addClinicalModule(draft, definition.code, definition.version)); return; } const module = draft.data.modules.find((item) => item.code === definition.code && item.version === definition.version)!; if (requiresClinicalModuleRemovalConfirmation(module) && !window.confirm(`Rimuovere ${definition.label}? I dati compilati in questa area verranno eliminati.`)) return; try { onUpdateAssessment(removeClinicalModule(draft, definition.code, definition.version)); } catch (cause) { window.alert(cause instanceof Error ? cause.message : "Impossibile rimuovere l’area."); } }}>{definition.label}<span>{present ? "Rimuovi" : "Aggiungi"}</span></button>; })}</div></details>}</div>
    <div className="space-y-4">{draft.data.modules.map((module, index) => { const definition = getClinicalModuleDefinition(module.code, module.version); const Editor = getClinicalModuleEditor(module.code, module.version); const key = `${module.code}@${module.version}`; const open = expanded.has(key); if (!definition || !Editor || !definition.validate(module.data)) return <div key={key} className="card p-5 text-sm text-red-600">Area clinica non compatibile.</div>; return <article key={key} className="overflow-hidden rounded-2xl border border-sage-100 bg-white"><button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open} onClick={() => setExpanded((current) => { const next = new Set(current); if (open) next.delete(key); else next.add(key); return next; })}><span><span className="block text-lg font-bold">{definition.label}</span><span className="mt-1 block text-xs text-slate-500">Area inclusa nella valutazione</span></span><span aria-hidden="true" className="text-xl text-sage-700">{open ? "⌃" : "⌄"}</span></button>{open && <div className="border-t border-sage-100 bg-slate-50/30 p-3 sm:p-5"><Editor value={module.data} readOnly={false} onChange={(value) => onUpdateModule(index, { ...module, data: value })} /></div>}</article>; })}</div>
  </section>;
}

type CommonStepProps = { draft: ClinicalAssessmentV2; onUpdate: (assessment: ClinicalAssessmentV2) => void };
const updateSection = <K extends Exclude<keyof ClinicalAssessmentV2["data"], "modules">>(draft: ClinicalAssessmentV2, key: K, section: ClinicalAssessmentV2["data"][K]) => ({ ...draft, data: setClinicalAssessmentV2Section(draft.data, key, section) });

function AccessReasonStep({ draft, onUpdate }: CommonStepProps) {
  const value = draft.data.accessReason || {};
  const patch = (change: Partial<typeof value>) => onUpdate(updateSection(draft, "accessReason", { ...value, ...change }));
  return <StepCard title="Motivo dell’accesso" description="Registra soltanto le informazioni utili a contestualizzare questa valutazione."><TextArea label="Motivo della valutazione" value={value.reason} onChange={(reason) => patch({ reason })} /><TextInput label="Inviante / modalità di accesso" placeholder="Es. pediatra, medico, scuola, famiglia, accesso autonomo" value={value.referralSource} onChange={(referralSource) => patch({ referralSource })} /><TextInput label="Informazioni riferite da" placeholder="Es. paziente, genitore, caregiver, insegnante" value={value.reportedBy} onChange={(reportedBy) => patch({ reportedBy })} /><TextArea label="Contesto o informazioni iniziali rilevanti" value={value.relevantContext} onChange={(relevantContext) => patch({ relevantContext })} /></StepCard>;
}

function AnamnesisStep({ draft, onUpdate }: CommonStepProps) {
  const value = draft.data.anamnesis || {};
  const patch = (change: Partial<typeof value>) => onUpdate(updateSection(draft, "anamnesis", { ...value, ...change }));
  const categories = [
    ["relevantClinicalHistory", "Storia clinica rilevante"], ["developmentAndHistory", "Sviluppo e storia personale rilevante"],
    ["educationWorkContext", "Contesto scolastico / formativo / lavorativo"], ["familySocialContext", "Contesto familiare e sociale"],
    ["previousAssessmentsInterventions", "Valutazioni o interventi precedenti"], ["additionalNotes", "Altre informazioni anamnestiche"],
  ] as const;
  const [active, setActive] = useState(() => new Set(categories.filter(([key]) => Boolean(value[key])).map(([key]) => key)));
  return <StepCard title="Anamnesi" description="Scegli soltanto le categorie pertinenti. Le altre rimangono non documentate."><div className="flex flex-wrap gap-2">{categories.map(([key, label]) => <button type="button" key={key} aria-pressed={active.has(key)} onClick={() => setActive((current) => { const next = new Set(current); if (next.has(key) && !value[key]) next.delete(key); else next.add(key); return next; })} className={`rounded-full border px-3 py-2 text-sm ${active.has(key) ? "border-sage-500 bg-sage-100 font-bold text-sage-700" : "border-sage-100 bg-white text-slate-600"}`}>{active.has(key) ? "✓ " : "+ "}{label}</button>)}</div><div className="space-y-4">{categories.filter(([key]) => active.has(key)).map(([key, label]) => <div key={key} className="rounded-2xl border border-sage-100 bg-sage-50/40 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">{label}</h3><button type="button" onClick={() => { patch({ [key]: undefined }); setActive((current) => { const next = new Set(current); next.delete(key); return next; }); }} className="text-xs font-bold text-red-600">Rimuovi</button></div><textarea autoFocus={!value[key]} value={value[key] || ""} onChange={(event) => { const text = event.target.value || undefined; patch({ [key]: text }); if (!text) setActive((current) => { const next = new Set(current); next.delete(key); return next; }); }} className={`${fieldClass} min-h-24`} /></div>)}</div></StepCard>;
}

function TestsStep({ draft, onUpdate }: CommonStepProps) {
  const value = draft.data.tests || {};
  const items = value.items || [];
  const patch = (change: Partial<typeof value>) => onUpdate(updateSection(draft, "tests", { ...value, ...change }));
  const updateItem = (id: string, change: Partial<AssessmentTestEntryV1>) => patch({ items: items.map((item) => item.id === id ? { ...item, ...change } : item) });
  return <StepCard title="Test / strumenti" description="Armonia registra i risultati inseriti dal professionista e non interpreta automaticamente il test."><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(value.notAdministered)} onChange={(event) => patch({ notAdministered: event.target.checked || undefined })} /> Test non somministrati</label><div className="space-y-4">{items.map((item, index) => <div key={item.id} className="rounded-2xl border border-sage-100 p-4"><div className="flex justify-between gap-3"><h3 className="font-bold">Test / strumento {index + 1}</h3><button type="button" onClick={() => patch({ items: items.filter((entry) => entry.id !== item.id) })} className="text-sm font-bold text-red-600">Rimuovi</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextInput label="Nome" value={item.name} onChange={(name) => updateItem(item.id, { name })} /><TextInput label="Area" value={item.area} onChange={(area) => updateItem(item.id, { area })} /><DateInput label="Data" value={item.date} onChange={(date) => updateItem(item.id, { date })} /><TextInput label="Punteggio grezzo" value={String(item.rawScore ?? "")} onChange={(rawScore) => updateItem(item.id, { rawScore })} /><TextInput label="Punteggio standardizzato" value={String(item.standardizedScore ?? "")} onChange={(standardizedScore) => updateItem(item.id, { standardizedScore })} /><TextInput label="Percentile" value={String(item.percentile ?? "")} onChange={(percentile) => updateItem(item.id, { percentile })} /></div><div className="mt-4"><TextArea label="Note" value={item.notes} onChange={(notes) => updateItem(item.id, { notes })} /></div></div>)}</div><button type="button" onClick={() => patch({ items: [...items, createAssessmentTestV2()] })} className="btn btn-quiet">+ Aggiungi test / strumento</button><TextArea label="Note generali sui test" value={value.notes} onChange={(notes) => patch({ notes })} /></StepCard>;
}

function SummaryStep({ draft, onUpdate }: CommonStepProps) {
  const value = draft.data.summary || {};
  const patch = (change: Partial<typeof value>) => onUpdate(updateSection(draft, "summary", { ...value, ...change }));
  return <StepCard title="Sintesi" description="La sintesi è compilata manualmente dalla professionista e non viene generata o interpretata automaticamente."><TextArea label="Sintesi clinica" value={value.clinicalSummary} onChange={(clinicalSummary) => patch({ clinicalSummary })} /><ListInput label="Punti di forza" value={value.strengths || []} onChange={(strengths) => patch({ strengths })} /><ListInput label="Difficoltà / aspetti rilevanti" value={value.difficulties || []} onChange={(difficulties) => patch({ difficulties })} /><TextArea label="Conclusioni" value={value.conclusions} onChange={(conclusions) => patch({ conclusions })} /><TextArea label="Indicazioni / raccomandazioni" value={value.recommendations} onChange={(recommendations) => patch({ recommendations })} /><TextArea label="Note" value={value.notes} onChange={(notes) => patch({ notes })} /></StepCard>;
}

function PlanningStep({ draft, onUpdate, goals, patientId }: CommonStepProps & { goals: ReturnType<typeof useData>["data"]["goals"]; patientId: string }) {
  const value = draft.data.planning || {};
  return <StepCard title="Obiettivi / pianificazione" description="Le note non duplicano gli obiettivi strutturati già collegati al Percorso clinico."><TextArea label="Note di pianificazione" value={value.notes} onChange={(notes) => onUpdate(updateSection(draft, "planning", { notes }))} /><div className="rounded-2xl bg-sage-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">Obiettivi del percorso</p><Link href={`/pazienti/${patientId}?tab=overview`} className="text-sm font-bold text-sage-700">Gestisci obiettivi</Link></div>{goals.length ? <ul className="mt-3 space-y-2 text-sm">{goals.map((goal) => <li key={goal.id} className="flex justify-between gap-3"><span>{goal.title}</span><span className="text-sage-700">{goal.progress}%</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Nessun obiettivo collegato al percorso.</p>}</div></StepCard>;
}

function StepCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="card p-5 sm:p-7"><h2 className="text-2xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><div className="mt-6 space-y-5">{children}</div></section>; }
const fieldClass = "mt-2 w-full rounded-xl border border-sage-100 bg-white px-3 py-2.5 font-normal outline-none focus:border-sage-500";
function TextInput({ label, value, placeholder, onChange }: { label: string; value?: string; placeholder?: string; onChange: (value?: string) => void }) { return <label className="block text-sm font-bold">{label}<input value={value || ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value || undefined)} className={fieldClass} /></label>; }
function DateInput({ label, value, onChange }: { label: string; value?: string; onChange: (value?: string) => void }) { return <label className="block text-sm font-bold">{label}<input type="date" value={value || ""} onChange={(event) => onChange(event.target.value || undefined)} className={fieldClass} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value?: string) => void }) { return <label className="block text-sm font-bold">{label}<textarea value={value || ""} onChange={(event) => onChange(event.target.value || undefined)} className={`${fieldClass} min-h-24`} /></label>; }
function ListInput({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) { const external = formatMultilineList(value); const [text, setText] = useState(external); useEffect(() => { if (formatMultilineList(parseMultilineList(text)) !== external) setText(external); }, [external, text]); return <label className="block text-sm font-bold">{label} · una voce per riga<textarea value={text} onChange={(event) => { setText(event.target.value); onChange(parseMultilineList(event.target.value)); }} className={`${fieldClass} min-h-24`} /></label>; }
