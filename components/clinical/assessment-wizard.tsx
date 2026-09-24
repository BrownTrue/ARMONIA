"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AssessmentSummary } from "@/components/clinical/assessment-summary";
import { useBranding } from "@/components/branding-provider";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import type { AssessmentTestEntryV1, ClinicalChoice, ClinicalValue, LanguageCommunicationAssessmentV1 } from "@/lib/clinical/assessment-v1";
import { ClinicalAutosaveQueue } from "@/lib/clinical/autosave-queue";
import { formatMultilineList, parseMultilineList } from "@/lib/clinical/multiline-list";
import { waitForPrintableLogo } from "@/lib/branding/image";
import type { ClinicalAssessment } from "@/lib/clinical/types";
import { fullName, uid } from "@/lib/types";

const STEPS = ["Motivo dell’accesso", "Anamnesi", "Osservazione", "Test / strumenti", "Sintesi", "Obiettivi / pianificazione"];
const inputClass = "mt-2 w-full rounded-xl border border-sage-100 bg-white px-3 py-2.5 font-normal outline-none focus:border-sage-500 disabled:bg-slate-50 disabled:text-slate-500";
const textAreaClass = `${inputClass} min-h-24`;
type Option = { code: string; label: string };

export function AssessmentWizard() {
  const { id, assessmentId } = useParams<{ id: string; assessmentId: string }>();
  const router = useRouter();
  const { data, ready, autosaveClinicalAssessmentDraft, completeClinicalAssessment, correctClinicalAssessment, deleteClinicalAssessment } = useData();
  const { logoSrc, ready: brandingReady } = useBranding();
  const source = data.clinicalAssessments.find((item) => item.id === assessmentId);
  const [draft, setDraft] = useState<ClinicalAssessment | null>(null);
  const draftRef = useRef<ClinicalAssessment | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveQueueRef = useRef<ClinicalAutosaveQueue | null>(null);
  if (!autosaveQueueRef.current) autosaveQueueRef.current = new ClinicalAutosaveQueue();
  const revisionRef = useRef(0);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [correctConfirmOpen, setCorrectConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const originalCompletedRef = useRef<ClinicalAssessment | null>(null);
  const printRequestedRef = useRef(false);

  useEffect(() => {
    if (!source || draftRef.current) return;
    setDraft(source);
    draftRef.current = source;
  }, [source]);
  useEffect(() => {
    if (!correcting && source?.status === "completed" && draftRef.current?.status !== "completed") {
      setDraft(source);
      draftRef.current = source;
      setDirty(false);
      setSaveState("saved");
    }
  }, [source, correcting]);
  useEffect(() => {
    if (draft?.status !== "completed" || !brandingReady || printRequestedRef.current) return;
    if (new URLSearchParams(window.location.search).get("print") !== "1") return;
    printRequestedRef.current = true;
    void waitForPrintableLogo().then(() => window.print());
  }, [draft?.status, brandingReady, logoSrc]);

  const persist = async (candidate: ClinicalAssessment, revision: number) => {
    if (candidate.status === "completed") return;
    setSaveState("saving");
    setMessage("");
    try {
      await autosaveQueueRef.current!.enqueue(() => autosaveClinicalAssessmentDraft(candidate));
      if (revision === revisionRef.current) {
        setDirty(false);
        setSaveState("saved");
      }
    } catch (cause) {
      setSaveState("error");
      setMessage(cause instanceof Error ? cause.message : "Salvataggio non riuscito.");
      throw cause;
    }
  };

  useEffect(() => {
    if (!dirty || !draft || draft.status === "completed") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const revision = revisionRef.current;
    timerRef.current = setTimeout(() => void persist(draft, revision).catch(() => undefined), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dirty, draft]);

  const updateDraft = (change: (current: ClinicalAssessment) => ClinicalAssessment) => {
    if (!draftRef.current || (draftRef.current.status === "completed" && !correcting)) return;
    const next = { ...change(draftRef.current), updatedAt: new Date().toISOString() };
    revisionRef.current += 1;
    draftRef.current = next;
    setDraft(next);
    setDirty(true);
    setSaveState(correcting ? "saved" : "saving");
    setMessage("");
  };
  const updateData = (change: (current: LanguageCommunicationAssessmentV1) => LanguageCommunicationAssessmentV1) => updateDraft((current) => ({ ...current, data: change(current.data) }));
  const forceSave = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const candidate = draftRef.current;
    if (candidate?.status === "draft") await persist(candidate, revisionRef.current);
  };

  if (!ready || !draft) return <AppShell><p>Caricamento…</p></AppShell>;
  const patient = data.patients.find((item) => item.id === id);
  const pathway = data.clinicalPathways.find((item) => item.id === draft.clinicalPathwayId);
  if (!patient || !pathway || draft.patientId !== patient.id) return <AppShell><p>Valutazione non trovata o non coerente con il paziente.</p><Link href={`/pazienti/${id}?tab=clinical`} className="mt-4 inline-block font-bold text-sage-700">Torna al paziente</Link></AppShell>;
  const readOnly = draft.status === "completed" && !correcting;

  const saveAndClose = async () => {
    try { await forceSave(); router.push(`/pazienti/${id}?tab=clinical`); }
    catch { /* Il messaggio è già mostrato nel wizard. */ }
  };
  const complete = async () => {
    setMessage("");
    try {
      await forceSave();
      await completeClinicalAssessment(draft.id);
      const completed = { ...draftRef.current!, status: "completed" as const, updatedAt: new Date().toISOString() };
      draftRef.current = completed;
      setDraft(completed);
      setDirty(false);
      setSaveState("saved");
      setMessage("Valutazione completata. Ora è disponibile in sola lettura.");
    } catch (cause) {
      setSaveState("error");
      setMessage(cause instanceof Error ? cause.message : "Non è stato possibile completare la valutazione.");
    }
  };
  const startCorrection = () => {
    const original = source || draftRef.current;
    if (!original || original.status !== "completed") return;
    originalCompletedRef.current = original;
    draftRef.current = original;
    setDraft(original);
    setDirty(false);
    setMessage("");
    setCorrecting(true);
    setCorrectConfirmOpen(false);
  };
  const cancelCorrection = () => {
    const original = originalCompletedRef.current || source;
    if (original) { draftRef.current = original; setDraft(original); }
    setDirty(false);
    setSaveState("saved");
    setMessage("");
    setCorrecting(false);
    originalCompletedRef.current = null;
  };
  const saveCorrection = async () => {
    const candidate = draftRef.current;
    if (!candidate) return;
    setMessage("");
    try {
      const corrected = await correctClinicalAssessment(candidate);
      draftRef.current = corrected;
      setDraft(corrected);
      setDirty(false);
      setSaveState("saved");
      setCorrecting(false);
      originalCompletedRef.current = null;
      setMessage("Correzioni salvate. La valutazione resta completata.");
    } catch (cause) {
      setSaveState("error");
      setMessage(cause instanceof Error ? cause.message : "Non è stato possibile salvare le correzioni.");
    }
  };
  const removeAssessment = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await deleteClinicalAssessment(draft.id);
      router.push(`/pazienti/${id}?tab=clinical`);
    } catch (cause) {
      setDeleteOpen(false);
      setSaveState("error");
      setMessage(cause instanceof Error ? cause.message : "Non è stato possibile eliminare la valutazione.");
    }
  };

  return <AppShell>
    {readOnly && <AssessmentSummary patientName={fullName(patient)} assessment={draft} pathwayTitle={pathway.title} professional={data.profile} logoSrc={logoSrc} />}
    <div className="assessment-screen-only mx-auto max-w-4xl">
      <Link href={`/pazienti/${id}?tab=clinical`} className="text-sm font-bold text-sage-700">← Percorso clinico</Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-semibold text-sage-700">{fullName(patient)}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Prima valutazione</h1><p className="mt-2 text-sm text-slate-500">Linguaggio e comunicazione · Strumento operativo, non protocollo diagnostico validato.</p></div>
        <div className="text-right"><span className="chip">{correcting ? "Correzione in corso" : readOnly ? "Completata" : "Bozza"}</span><p aria-live="polite" className={`mt-2 text-xs ${saveState === "error" ? "text-red-600" : "text-slate-400"}`}>{correcting ? (dirty ? "Modifiche non salvate · autosave disattivato" : "Salvataggio manuale · autosave disattivato") : readOnly ? "Sola lettura" : saveState === "saving" ? "Salvataggio…" : saveState === "error" ? "Errore di salvataggio" : "Salvato"}</p></div>
      </header>
      <div className="card mt-6 p-4 sm:p-6">
        <label className="block max-w-xs text-sm font-bold">Data clinica<input type="date" disabled={readOnly} value={draft.clinicalDate || ""} onInput={(event) => updateDraft((current) => ({ ...current, clinicalDate: event.currentTarget.value || undefined }))} className={inputClass} /></label>
        <nav aria-label="Passaggi valutazione" className="mt-6 flex gap-2 overflow-x-auto pb-2">{STEPS.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={`min-w-[9.5rem] rounded-xl px-3 py-2 text-left text-xs font-bold ${index === step ? "bg-sage-100 text-sage-700" : "bg-slate-50 text-slate-500"}`}><span className="mr-2">{index + 1}</span>{label}</button>)}</nav>
        <div className="mt-7 min-h-[24rem]">
          {step === 0 && <AccessReasonStep value={draft.data} onChange={updateData} readOnly={readOnly} />}
          {step === 1 && <AnamnesisStep value={draft.data} onChange={updateData} readOnly={readOnly} />}
          {step === 2 && <ObservationStep value={draft.data} onChange={updateData} readOnly={readOnly} />}
          {step === 3 && <TestsStep value={draft.data} onChange={updateData} readOnly={readOnly} />}
          {step === 4 && <SummaryStep value={draft.data} onChange={updateData} readOnly={readOnly} />}
          {step === 5 && <PlanningStep value={draft.data} onChange={updateData} readOnly={readOnly} goals={data.goals.filter((goal) => goal.patientId === patient.id)} />}
        </div>
        {message && <p role={saveState === "error" ? "alert" : "status"} className={`mt-5 rounded-xl px-4 py-3 text-sm ${saveState === "error" ? "bg-red-50 text-red-700" : "bg-sage-50 text-sage-700"}`}>{message}</p>}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-sage-100 pt-5">
          <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="btn btn-quiet disabled:cursor-not-allowed disabled:opacity-40">Indietro</button>
          <div className="flex flex-wrap justify-end gap-2">
            {readOnly && <><button type="button" onClick={() => setCorrectConfirmOpen(true)} className="btn btn-quiet">Correggi valutazione</button><button type="button" disabled={!brandingReady} onClick={async() => { await waitForPrintableLogo(); window.print(); }} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">Stampa valutazione</button></>}
            {correcting ? <><button type="button" onClick={cancelCorrection} className="btn btn-quiet">Annulla correzione</button><button type="button" onClick={saveCorrection} className="btn btn-primary">Salva correzioni</button></> : <><button type="button" onClick={saveAndClose} className="btn btn-quiet">{readOnly ? "Chiudi" : "Salva e chiudi"}</button>{step < STEPS.length - 1 ? <button type="button" onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))} className="btn btn-primary">Avanti</button> : !readOnly && <button type="button" onClick={complete} className="btn btn-primary">Completa valutazione</button>}</>}
          </div>
        </div>
      </div>
      {!correcting && <div className="mt-5 rounded-2xl border border-red-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Area riservata</p><button type="button" onClick={() => setDeleteOpen(true)} className="mt-2 text-sm font-bold text-red-600">{draft.status === "draft" ? "Elimina bozza" : "Elimina valutazione"}</button></div>}
    </div>
    {correctConfirmOpen && <Modal title="Correggi valutazione" onClose={() => setCorrectConfirmOpen(false)}><p className="text-sm leading-6 text-slate-600">Stai per modificare una valutazione già completata. L’autosave resterà disattivato: potrai annullare le modifiche oppure salvarle esplicitamente mantenendo la valutazione completata.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCorrectConfirmOpen(false)} className="btn btn-quiet">Annulla</button><button type="button" onClick={startCorrection} className="btn btn-primary">Inizia correzione</button></div></Modal>}
    {deleteOpen && (draft.status === "draft" ? <DeleteDraftModal onClose={() => setDeleteOpen(false)} onConfirm={removeAssessment} /> : <DeleteCompletedModal assessment={draft} onClose={() => setDeleteOpen(false)} onConfirm={removeAssessment} />)}
  </AppShell>;
}

function DeleteDraftModal({onClose,onConfirm}:{onClose:()=>void;onConfirm:()=>Promise<void>}) {
  return <Modal title="Elimina bozza" onClose={onClose}><p className="text-sm leading-6 text-slate-600">Vuoi eliminare questa bozza? Verrà eliminata soltanto la valutazione; il percorso clinico, il paziente, le sedute e gli obiettivi resteranno invariati.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button type="button" onClick={onConfirm} className="btn bg-red-600 text-white">Elimina bozza</button></div></Modal>;
}

function DeleteCompletedModal({assessment,onClose,onConfirm}:{assessment:ClinicalAssessment;onClose:()=>void;onConfirm:()=>Promise<void>}) {
  const [confirmation,setConfirmation]=useState("");
  const date=assessment.clinicalDate?new Date(`${assessment.clinicalDate}T12:00:00`).toLocaleDateString("it-IT"):"non indicata";
  return <Modal title="Elimina valutazione completata" onClose={onClose}><div className="space-y-4 text-sm leading-6 text-slate-600"><p><strong>Prima valutazione · Linguaggio e comunicazione</strong><br/>Data clinica: {date}</p><p>L’operazione è permanente ed elimina esclusivamente questa valutazione. Il Percorso clinico non verrà eliminato; sedute, appuntamenti e obiettivi resteranno invariati.</p><label className="block font-bold text-ink">Digita ELIMINA per confermare<input value={confirmation} onChange={(event)=>setConfirmation(event.target.value)} className={inputClass}/></label></div><div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-quiet">Annulla</button><button type="button" disabled={confirmation!=="ELIMINA"} onClick={onConfirm} className="btn bg-red-600 text-white disabled:cursor-not-allowed disabled:opacity-40">Elimina definitivamente</button></div></Modal>;
}

function AccessReasonStep({ value, onChange, readOnly }: StepProps) {
  const section = value.accessReason || {};
  const concerns = section.concerns || [];
  const concernOptions: Option[] = [
    { code: "expressive_difficulty", label: "Difficoltà espressive" }, { code: "comprehension_difficulty", label: "Difficoltà di comprensione" },
    { code: "low_intelligibility", label: "Linguaggio poco intelligibile" }, { code: "late_language_emergence", label: "Ritardo nell’emergere del linguaggio" },
    { code: "communication_difficulty", label: "Difficoltà comunicative" }, { code: "school_referral", label: "Segnalazione scolastica" },
    { code: "professional_referral", label: "Invio da altro professionista" }, { code: "review", label: "Controllo / rivalutazione" }, { code: "other", label: "Altro" },
  ];
  const referralOptions: Option[] = [{ code: "family", label: "Famiglia" }, { code: "pediatrician", label: "Pediatra" }, { code: "neuropsychiatry", label: "Neuropsichiatria" }, { code: "school", label: "Scuola" }, { code: "other_professional", label: "Altro professionista" }, { code: "other", label: "Altro" }];
  const patch = (next: typeof section) => onChange((current) => ({ ...current, accessReason: next }));
  return <StepSection title="Motivo dell’accesso" description="Seleziona una o più motivazioni e aggiungi liberamente il contesto utile.">
    <ChoiceChips label="Motivazioni riferite" options={concernOptions} values={concerns} multiple readOnly={readOnly} onChange={(next) => patch({ ...section, concerns: next })} />
    <ChoiceChips label="Chi richiede o invia" options={referralOptions} values={section.reportedBy?.value ? [section.reportedBy.value] : []} readOnly={readOnly} onChange={(next) => patch({ ...section, reportedBy: { ...section.reportedBy, value: next[0], availability: next[0] ? "available" : undefined } })} />
    <TextArea label="Descrizione" value={section.description || ""} readOnly={readOnly} onChange={(text) => patch({ ...section, description: text })} />
    <TextArea label="Note" value={section.notes || ""} readOnly={readOnly} onChange={(text) => patch({ ...section, notes: text })} />
  </StepSection>;
}

function AnamnesisStep({ value, onChange, readOnly }: StepProps) {
  const section = value.anamnesis || {};
  const patch = (next: typeof section) => onChange((current) => ({ ...current, anamnesis: next }));
  return <StepSection title="Anamnesi rapida" description="Raccogli solo le informazioni disponibili e pertinenti. Tutti i campi sono facoltativi.">
    <ClinicalChoiceField label="Gravidanza e parto" value={section.pregnancyBirth} options={[{code:"typical",label:"Nella norma"},{code:"relevant",label:"Elementi rilevanti"}]} readOnly={readOnly} onChange={(next) => patch({...section,pregnancyBirth:next})} showNoteFor="relevant" unavailableLabel="Non disponibile" />
    <ClinicalChoiceField label="Sviluppo motorio" value={section.motorDevelopment} options={[{code:"typical",label:"Nella norma"},{code:"reported_delay",label:"Ritardo riferito"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next) => patch({...section,motorDevelopment:next})} unavailableLabel="Non disponibile" />
    <div className="grid gap-4 sm:grid-cols-2"><MonthsField label="Prime parole (mesi)" value={section.firstWordsMonths} readOnly={readOnly} onChange={(next) => patch({...section,firstWordsMonths:next})} /><MonthsField label="Prime combinazioni (mesi)" value={section.firstCombinationsMonths} readOnly={readOnly} onChange={(next) => patch({...section,firstCombinationsMonths:next})} /></div>
    <ChoiceChips label="Udito" options={[{code:"no_reported_difficulty",label:"Nessuna difficoltà riferita"},{code:"recurrent_otitis",label:"Otiti ricorrenti"},{code:"audiology_assessments",label:"Accertamenti audiologici"},{code:"reported_difficulty",label:"Difficoltà riferite"},{code:"other",label:"Altro"}]} values={section.hearing?.value || []} multiple readOnly={readOnly} unavailable={section.hearing?.availability === "not_available"} onUnavailable={(checked) => patch({...section,hearing:{...section.hearing,availability:checked?"not_available":"available",value:checked?undefined:section.hearing?.value}})} onChange={(next) => patch({...section,hearing:{...section.hearing,value:next,availability:"available"}})} />
    <TextInput label="Scolarizzazione" value={section.educational || ""} readOnly={readOnly} onChange={(text) => patch({...section,educational:text})} />
    <ListInput label="Lingue parlate in famiglia" value={section.languages || []} readOnly={readOnly} onChange={(items) => patch({...section,languages:items})} />
    <ListInput label="Altri professionisti coinvolti" value={section.professionals || []} readOnly={readOnly} onChange={(items) => patch({...section,professionals:items})} />
    <TextArea label="Note anamnestiche" value={section.notes || ""} readOnly={readOnly} onChange={(text) => patch({...section,notes:text})} />
  </StepSection>;
}

function ObservationStep({ value, onChange, readOnly }: StepProps) {
  const section = value.observation || {};
  const patch = (next: typeof section) => onChange((current) => ({ ...current, observation: next }));
  return <StepSection title="Osservazione" description="Indicazioni descrittive V1: non costituiscono criteri diagnostici validati.">
    <ClinicalChoiceField label="Comunicazione" value={section.communication} options={[{code:"adequate",label:"Adeguata"},{code:"partly_adequate",label:"Parzialmente adeguata"},{code:"difficulty_observed",label:"Difficoltà osservate"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next)=>patch({...section,communication:next})} />
    <ClinicalChoiceField label="Intenzionalità comunicativa" value={section.communicativeIntent} options={[{code:"present",label:"Presente"},{code:"inconsistent",label:"Discontinua"},{code:"reduced",label:"Ridotta"}]} readOnly={readOnly} onChange={(next)=>patch({...section,communicativeIntent:next})} />
    <ClinicalChoiceField label="Comprensione" value={section.comprehensionProfile} options={[{code:"adequate",label:"Adeguata"},{code:"mild_difficulty",label:"Lieve difficoltà"},{code:"significant_difficulty",label:"Difficoltà significativa"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next)=>patch({...section,comprehensionProfile:next})} />
    <div className="space-y-3"><ChoiceChips label="Produzione" options={[{code:"vocalizations",label:"Vocalizzazioni"},{code:"single_word",label:"Parola singola"},{code:"combinations",label:"Combinazioni"},{code:"simple_sentence",label:"Frase semplice"},{code:"complex_sentence",label:"Frase complessa"},{code:"spontaneous_language",label:"Linguaggio spontaneo"}]} values={section.production?.value || []} multiple readOnly={readOnly} unavailable={section.production?.availability === "not_available"} unavailableLabel="Non valutata" onUnavailable={(checked)=>patch({...section,production:{...section.production,availability:checked?"not_available":"available",value:checked?undefined:section.production?.value}})} onChange={(next)=>patch({...section,production:{...section.production,value:next,availability:"available"}})} /><TextArea label="Nota facoltativa sulla produzione" value={section.production?.note||""} readOnly={readOnly} onChange={(note)=>patch({...section,production:{...section.production,note}})}/></div>
    <ClinicalChoiceField label="Intelligibilità" value={section.intelligibility} options={[{code:"good",label:"Buona"},{code:"fair",label:"Discreta"},{code:"reduced",label:"Ridotta"},{code:"severely_reduced",label:"Fortemente ridotta"}]} readOnly={readOnly} onChange={(next)=>patch({...section,intelligibility:next})} unavailableLabel="Non valutabile" />
    <div className="grid gap-5 lg:grid-cols-3"><ClinicalChoiceField label="Lessico" compact value={section.vocabulary} options={[{code:"adequate",label:"Adeguato"},{code:"difficulty",label:"Difficoltà"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next)=>patch({...section,vocabulary:next})} /><ClinicalChoiceField label="Morfosintassi" compact value={section.morphosyntax} options={[{code:"adequate",label:"Adeguata"},{code:"difficulty",label:"Difficoltà"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next)=>patch({...section,morphosyntax:next})} /><ClinicalChoiceField label="Pragmatica" compact value={section.pragmatics} options={[{code:"adequate",label:"Adeguata"},{code:"difficulty",label:"Difficoltà"},{code:"investigate",label:"Da approfondire"}]} readOnly={readOnly} onChange={(next)=>patch({...section,pragmatics:next})} /></div>
    <TextArea label="Osservazioni generali" value={section.notes || ""} readOnly={readOnly} onChange={(text)=>patch({...section,notes:text})} />
  </StepSection>;
}

function TestsStep({ value, onChange, readOnly }: StepProps) {
  const section = value.tests || {};
  const items = section.items || [];
  const patch = (next: typeof section) => onChange((current) => ({ ...current, tests: next }));
  const updateItem = (id: string, change: Partial<AssessmentTestEntryV1>) => patch({...section,items:items.map((item)=>item.id===id?{...item,...change}:item)});
  return <StepSection title="Test / strumenti" description="Inserisci soltanto dati essenziali. Armonia non interpreta automaticamente i risultati.">
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" disabled={readOnly} checked={Boolean(section.notAdministered)} onChange={(event)=>patch({...section,notAdministered:event.target.checked})} /> Test non somministrati</label>
    <div className="space-y-4">{items.map((item,index)=><div key={item.id} className="rounded-2xl border border-sage-100 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Test {index+1}</h3>{!readOnly&&<button type="button" onClick={()=>patch({...section,items:items.filter((entry)=>entry.id!==item.id)})} className="text-sm font-bold text-red-600">Rimuovi</button>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><TextInput label="Nome" value={item.name||""} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{name:text})}/><TextInput label="Area" value={item.area||""} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{area:text})}/><DateInput label="Data" value={item.date||""} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{date:text||undefined})}/><TextInput label="Punteggio grezzo" value={String(item.rawScore??"")} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{rawScore:text})}/><TextInput label="Punteggio standardizzato" value={String(item.standardizedScore??"")} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{standardizedScore:text})}/><TextInput label="Percentile" value={String(item.percentile??"")} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{percentile:text})}/></div><div className="mt-4"><TextArea label="Note" value={item.notes||""} readOnly={readOnly} onChange={(text)=>updateItem(item.id,{notes:text})}/></div></div>)}</div>
    {!readOnly&&<button type="button" onClick={()=>patch({...section,items:[...items,{id:uid()}]})} className="btn btn-quiet">+ Aggiungi test</button>}
    <TextArea label="Note generali sui test" value={section.notes||""} readOnly={readOnly} onChange={(text)=>patch({...section,notes:text})}/>
  </StepSection>;
}

function SummaryStep({ value, onChange, readOnly }: StepProps) {
  const section = value.summary || {};
  const patch = (next: typeof section) => onChange((current) => ({ ...current, summary: next }));
  return <StepSection title="Sintesi" description="Compilazione manuale. In questa fase non vengono usati AI o template automatici."><TextArea label="Sintesi clinica" value={section.clinicalSummary||""} readOnly={readOnly} onChange={(text)=>patch({...section,clinicalSummary:text})}/><ListInput label="Punti di forza" value={section.strengths||[]} readOnly={readOnly} onChange={(items)=>patch({...section,strengths:items})}/><ListInput label="Difficoltà" value={section.difficulties||[]} readOnly={readOnly} onChange={(items)=>patch({...section,difficulties:items})}/><TextArea label="Conclusioni" value={section.conclusions||""} readOnly={readOnly} onChange={(text)=>patch({...section,conclusions:text})}/><TextArea label="Raccomandazioni" value={section.recommendations||""} readOnly={readOnly} onChange={(text)=>patch({...section,recommendations:text})}/><TextArea label="Note" value={section.notes||""} readOnly={readOnly} onChange={(text)=>patch({...section,notes:text})}/></StepSection>;
}

function PlanningStep({ value, onChange, readOnly, goals }: StepProps & { goals: ReturnType<typeof useData>["data"]["goals"] }) {
  const section = value.goals || {};
  return <StepSection title="Obiettivi / pianificazione" description="Le note raccolte qui non duplicano gli obiettivi strutturati già presenti in Armonia."><TextArea label="Note di pianificazione" value={section.planningNotes||""} readOnly={readOnly} onChange={(text)=>onChange((current)=>({...current,goals:{...section,planningNotes:text}}))}/><div className="rounded-2xl bg-sage-50 p-4"><p className="font-bold">Obiettivi esistenti</p>{goals.length?<ul className="mt-3 space-y-2 text-sm">{goals.map((goal)=><li key={goal.id} className="flex justify-between gap-3"><span>{goal.title}</span><span className="text-sage-700">{goal.progress}%</span></li>)}</ul>:<p className="mt-2 text-sm text-slate-500">Nessun obiettivo presente.</p>}<p className="mt-4 text-xs leading-5 text-slate-500">Il collegamento strutturato degli obiettivi al Percorso clinico verrà introdotto nella fase successiva.</p></div></StepSection>;
}

type StepProps = { value: LanguageCommunicationAssessmentV1; onChange: (change: (current: LanguageCommunicationAssessmentV1) => LanguageCommunicationAssessmentV1) => void; readOnly: boolean };
function StepSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><div className="mt-6 space-y-6">{children}</div></section>; }
function TextInput({label,value,onChange,readOnly}:{label:string;value:string;onChange:(value:string)=>void;readOnly:boolean}){return <label className="block text-sm font-bold">{label}<input disabled={readOnly} value={value} onChange={(event)=>onChange(event.target.value)} className={inputClass}/></label>}
function DateInput({label,value,onChange,readOnly}:{label:string;value:string;onChange:(value:string)=>void;readOnly:boolean}){return <label className="block text-sm font-bold">{label}<input type="date" disabled={readOnly} value={value} onInput={(event)=>onChange(event.currentTarget.value)} className={inputClass}/></label>}
function TextArea({label,value,onChange,readOnly}:{label:string;value:string;onChange:(value:string)=>void;readOnly:boolean}){return <label className="block text-sm font-bold">{label}<textarea disabled={readOnly} value={value} onChange={(event)=>onChange(event.target.value)} className={textAreaClass}/></label>}
function ListInput({label,value,onChange,readOnly}:{label:string;value:string[];onChange:(value:string[])=>void;readOnly:boolean}){
  const externalText = formatMultilineList(value);
  const [text, setText] = useState(externalText);
  useEffect(() => {
    if (formatMultilineList(parseMultilineList(text)) !== externalText) setText(externalText);
  }, [externalText, text]);
  return <label className="block text-sm font-bold">{label} · una voce per riga<textarea disabled={readOnly} value={text} onKeyDown={(event)=>{if(event.key==="Enter")event.stopPropagation();}} onChange={(event)=>{const next=event.target.value;setText(next);onChange(parseMultilineList(next));}} className={textAreaClass}/></label>;
}

function ChoiceChips({label,options,values,onChange,multiple=false,readOnly,unavailable=false,onUnavailable,unavailableLabel="Non disponibile"}:{label:string;options:Option[];values:string[];onChange:(values:string[])=>void;multiple?:boolean;readOnly:boolean;unavailable?:boolean;onUnavailable?:(checked:boolean)=>void;unavailableLabel?:string}){
  return <fieldset disabled={readOnly}><legend className="text-sm font-bold">{label}</legend><div className="mt-3 flex flex-wrap gap-2">{options.map((option)=>{const selected=values.includes(option.code);return <button type="button" key={option.code} aria-pressed={selected} disabled={readOnly||unavailable} onClick={()=>onChange(multiple?(selected?values.filter((item)=>item!==option.code):[...values,option.code]):selected?[]:[option.code])} className={`rounded-full border px-3 py-2 text-sm ${selected?"border-sage-500 bg-sage-100 font-bold text-sage-700":"border-sage-100 bg-white text-slate-600"}`}>{option.label}</button>})}{onUnavailable&&<label className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${unavailable?"border-sage-500 bg-sage-100 font-bold text-sage-700":"border-sage-100"}`}><input type="checkbox" checked={unavailable} onChange={(event)=>onUnavailable(event.target.checked)}/>{unavailableLabel}</label>}</div></fieldset>;
}

function ClinicalChoiceField({label,value,options,onChange,readOnly,showNoteFor,unavailableLabel="Non valutata",compact=false}:{label:string;value?:ClinicalValue<string>;options:Option[];onChange:(value:ClinicalValue<string>)=>void;readOnly:boolean;showNoteFor?:string;unavailableLabel?:string;compact?:boolean}){
  const unavailable=value?.availability==="not_available";
  return <div className={compact?"rounded-2xl border border-sage-100 p-4":"space-y-3"}><ChoiceChips label={label} options={options} values={value?.value?[value.value]:[]} readOnly={readOnly} unavailable={unavailable} unavailableLabel={unavailableLabel} onUnavailable={(checked)=>onChange({...value,availability:checked?"not_available":"available",value:checked?undefined:value?.value})} onChange={(items)=>onChange({...value,value:items[0],availability:items[0]?"available":undefined})}/>{(!showNoteFor||value?.value===showNoteFor||value?.note)&&<TextArea label="Nota facoltativa" value={value?.note||""} readOnly={readOnly} onChange={(note)=>onChange({...value,note})}/>}</div>;
}

function MonthsField({label,value,onChange,readOnly}:{label:string;value?:ClinicalValue<number>;onChange:(value:ClinicalValue<number>)=>void;readOnly:boolean}){
  const unavailable=value?.availability==="not_available";
  return <div><label className="block text-sm font-bold">{label}<input type="number" min="0" disabled={readOnly||unavailable} value={value?.value??""} onChange={(event)=>onChange({...value,value:event.target.value===""?undefined:Number(event.target.value),availability:"available"})} className={inputClass}/></label><label className="mt-2 flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" disabled={readOnly} checked={unavailable} onChange={(event)=>onChange({...value,availability:event.target.checked?"not_available":"available",value:event.target.checked?undefined:value?.value})}/> Dato non disponibile</label></div>;
}
