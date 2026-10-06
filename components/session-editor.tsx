"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/components/data-provider";
import { Field, Select } from "@/components/form-controls";
import { Modal } from "@/components/modal";
import { centsToEuroInput, euroInputToCents, selectableAppointmentServices } from "@/lib/calendar-v2";
import { resolveNewSessionDraft, sessionWithAppointmentSnapshot, sessionWithService } from "@/lib/economy";
import { focusFirstInvalidField, validateSessionForm, type FieldErrors } from "@/lib/form-validation";
import { fullName, today, uid, type Session } from "@/lib/types";

export type SessionEditorProps = { appointmentId?: string; fallbackPatientId?: string; fallbackDate?: string; presentation?: "page" | "panel"; onCancel?: () => void; onOpenDuplicate?: (session: Session) => void; onSaved: (session: Session) => void };

export function SessionEditor({ appointmentId, fallbackPatientId, fallbackDate, presentation = "page", onCancel, onOpenDuplicate, onSaved }: SessionEditorProps) {
  const { data, ready, saveSession } = useData();
  const [session, setSession] = useState<Session | null>(null);
  const [price, setPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [appointmentMissing, setAppointmentMissing] = useState(false);
  const [pendingWithoutActivities, setPendingWithoutActivities] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !ready) return;
    const resolution = resolveNewSessionDraft(null, { dataReady: ready, appointmentId, appointments: data.appointments, fallbackPatientId: fallbackPatientId || data.patients[0]?.id || "", fallbackDate: fallbackDate || today(), createId: uid, createdAt: () => new Date().toISOString() });
    if (!resolution.session) return;
    initializedRef.current = true;
    setSession(resolution.session);
    setPrice(centsToEuroInput(resolution.session.effectivePriceCents));
    setAppointmentMissing(resolution.appointmentMissing);
  }, [appointmentId, data.appointments, data.patients, fallbackDate, fallbackPatientId, ready]);

  if (!session) return <p className="p-5 text-sm text-slate-500">Caricamento seduta…</p>;
  const patient = data.patients.find((item) => item.id === session.patientId);
  const duplicate = session.appointmentId ? data.sessions.find((item) => item.appointmentId === session.appointmentId) : undefined;
  if (duplicate) return <div className="p-6"><h2 className="text-xl font-bold">Seduta già registrata</h2><p className="mt-2 text-sm text-slate-600">Per questo appuntamento esiste già una seduta. Aprila dalla timeline del paziente per modificarla.</p>{onOpenDuplicate ? <button type="button" className="btn btn-primary mt-5" onClick={() => onOpenDuplicate(duplicate)}>Apri timeline paziente</button> : onCancel ? <button type="button" className="btn btn-primary mt-5" onClick={onCancel}>Torna all’appuntamento</button> : null}</div>;
  if (!patient) return <p className="p-5">Crea prima un paziente.</p>;

  const update = (change: (current: Session) => Session) => setSession((current) => current ? change(current) : current);
  const previous = data.sessions.filter((item) => item.patientId === patient.id && item.date <= session.date).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))[0];
  const appointmentsForDate = data.appointments.filter((item) => item.patientId === session.patientId && item.date === session.date && item.type !== "cancelled");
  const activePathway = data.clinicalPathways.find((item) => item.patientId === session.patientId && item.status === "active");
  const activeGoals = data.goals.filter((item) => item.patientId === session.patientId && item.status !== "achieved" && item.status !== "suspended");
  const pathwayGoals = activePathway ? activeGoals.filter((item) => item.clinicalPathwayId === activePathway.id) : [];
  const otherGoals = activeGoals.filter((item) => !item.clinicalPathwayId);
  const clearError = (field: string) => setFieldErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  const choiceButtons = (labels: string[], key: "response" | "helpLevel") => <div className="flex flex-wrap gap-2">{labels.map((label) => <button type="button" key={label} className={`chip ${session[key] === label ? "!bg-sage-700 !text-white" : ""}`} onClick={() => update((current) => ({ ...current, [key]: label }))}>{label}</button>)}</div>;
  const persist = async (value: Session) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setServerError("");
    try { await saveSession(value); onSaved(value); }
    catch { savingRef.current = false; setServerError("Non è stato possibile salvare la seduta. Riprova."); setSaving(false); }
  };

  return <div className={presentation === "panel" ? "min-h-0" : undefined}>
    <header className={presentation === "panel" ? "px-6 pb-4 pt-1" : "mb-7"}>
      {presentation === "page" ? <><p className="text-sm font-bold text-sage-700">REGISTRA SEDUTA · {new Date(`${session.date}T12:00`).toLocaleDateString("it-IT")}</p><h1 className="mt-2 text-2xl font-bold">Seduta con {fullName(patient)}</h1></> : null}
      {previous?.nextPlan ? <p className="mt-3 rounded-xl bg-[#fff8ed] p-3 text-sm text-[#8b6843]"><b>Dalla seduta precedente:</b> {previous.nextPlan}</p> : null}
      {appointmentMissing ? <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">L’appuntamento richiesto non è disponibile. Puoi continuare registrando una seduta manuale.</p> : null}
    </header>
    <form className={presentation === "panel" ? "space-y-4 px-6 pb-6" : "mx-auto max-w-3xl space-y-5"} noValidate onSubmit={async (event) => {
      event.preventDefault();
      if (session.appointmentId && data.sessions.some((item) => item.appointmentId === session.appointmentId && item.id !== session.id)) { const errors = { appointmentId: "Per questo appuntamento esiste già una seduta. Aprila dalla timeline del paziente per modificarla." }; setFieldErrors(errors); setServerError(""); focusFirstInvalidField(errors); return; }
      const form = new FormData(event.currentTarget);
      const errors = validateSessionForm({ patientId: session.patientId, date: session.date, duration: session.duration, price, latestDate: today() });
      if (Object.keys(errors).length) { setFieldErrors(errors); setServerError(""); focusFirstInvalidField(errors); return; }
      setFieldErrors({}); setServerError("");
      const value = { ...session, effectivePriceCents: euroInputToCents(price), activities: String(form.get("activities") || "").trim(), result: String(form.get("result") || ""), nextPlan: String(form.get("nextPlan") || ""), homework: String(form.get("homework") || ""), notes: String(form.get("notes") || "") };
      if (!value.activities) { setPendingWithoutActivities(value); return; }
      await persist(value);
    }}>
      {Object.keys(fieldErrors).length > 1 ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Ci sono alcune informazioni da controllare.</p><p className="mt-1">Correggi i campi evidenziati e riprova.</p></div> : null}
      <EditorSection title="Data e paziente"><div className="grid gap-4 sm:grid-cols-2">
        <Select id="session-patient" data-validation-field="patientId" label="Paziente" value={session.patientId} error={fieldErrors.patientId} onChange={(event) => { update((current) => ({ ...current, patientId: event.target.value, appointmentId: undefined })); clearError("patientId"); }}>{data.patients.map((item) => <option value={item.id} key={item.id}>{fullName(item)}</option>)}</Select>
        <Field id="session-date" data-validation-field="date" label="Data effettiva" type="date" max={today()} required value={session.date} error={fieldErrors.date} onChange={(event) => { update((current) => ({ ...current, date: event.target.value, appointmentId: undefined })); clearError("date"); }} />
        <div className="sm:col-span-2"><Select id="session-appointment" data-validation-field="appointmentId" label="Appuntamento collegato" value={session.appointmentId || ""} error={fieldErrors.appointmentId} onChange={(event) => { clearError("appointmentId"); const selected = data.appointments.find((item) => item.id === event.target.value); if (!selected) return update((current) => ({ ...current, appointmentId: undefined })); update((current) => sessionWithAppointmentSnapshot(current, selected)); setPrice(centsToEuroInput(selected.effectivePriceCents)); }}><option value="">Nessun appuntamento</option>{appointmentsForDate.map((item) => <option value={item.id} key={item.id}>{item.time} · {item.duration} min</option>)}</Select></div>
      </div></EditorSection>
      <EditorSection title="Prestazione" description="Questi dati diventano lo storico economico della seduta."><div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Prestazione<select value={session.serviceId || ""} onChange={(event) => { const service = data.services.find((item) => item.id === event.target.value) || null; update((current) => sessionWithService(current, service)); if (service) { setPrice(centsToEuroInput(service.defaultPriceCents)); clearError("duration"); clearError("price"); } }} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal"><option value="">Nessuna prestazione</option>{session.serviceId && !data.services.some((item) => item.id === session.serviceId) ? <option value={session.serviceId}>{session.serviceNameSnapshot || "Prestazione non disponibile"} — Non disponibile</option> : null}{selectableAppointmentServices(data.services, session.serviceId).map((item) => <option value={item.id} key={item.id}>{item.name}{item.archivedAt ? " — Non più nel catalogo" : !item.isActive ? " — Non attiva" : ""}</option>)}</select></label>
        <Field id="session-duration" data-validation-field="duration" label="Durata (minuti)" type="number" min={1} required value={session.duration || ""} error={fieldErrors.duration} onChange={(event) => { update((current) => ({ ...current, duration: event.target.value === "" ? Number.NaN : Number(event.target.value) })); clearError("duration"); }} />
        <div><Field id="session-price" data-validation-field="price" label="Prezzo (facoltativo)" inputMode="decimal" placeholder="es. 45,00" value={price} error={fieldErrors.price} onChange={(event) => { setPrice(event.target.value); clearError("price"); }} /><span className="mt-1 block text-xs text-slate-500">Vuoto = non specificato · 0 = gratuita</span></div>
      </div></EditorSection>
      <EditorSection title="Attività svolte"><textarea aria-label="Attività svolte" name="activities" defaultValue={session.activities} placeholder="Esercizi, giochi e attività…" className="min-h-24 w-full rounded-xl border border-sage-100 p-3" /></EditorSection>
      <EditorSection title="Risposta e risultato"><label className="text-sm font-bold">Risposta del paziente</label><div className="mt-3">{choiceButtons(["Ottima", "Buona", "Discreta", "Difficoltosa"], "response")}</div><label className="mt-5 block text-sm font-bold">Livello di aiuto</label><div className="mt-3">{choiceButtons(["Nessuno", "Minimo", "Moderato", "Elevato"], "helpLevel")}</div><label className="mt-5 block text-sm font-bold">Risultato</label><textarea aria-label="Risultato" name="result" defaultValue={session.result} className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3" /></EditorSection>
      <EditorSection title="Obiettivi della seduta">{pathwayGoals.length === 0 && otherGoals.length === 0 ? <p className="text-sm text-slate-500">Nessun obiettivo attivo per questo paziente.</p> : <div className="space-y-5">{pathwayGoals.length ? <GoalChoices title="OBIETTIVI DEL PERCORSO ATTIVO" goals={pathwayGoals} selected={session.goalIds} onToggle={(id, checked) => update((current) => ({ ...current, goalIds: checked ? [...current.goalIds, id] : current.goalIds.filter((item) => item !== id) }))} /> : null}{otherGoals.length ? <GoalChoices title={activePathway ? "ALTRI OBIETTIVI ATTIVI" : "OBIETTIVI ATTIVI"} goals={otherGoals} selected={session.goalIds} onToggle={(id, checked) => update((current) => ({ ...current, goalIds: checked ? [...current.goalIds, id] : current.goalIds.filter((item) => item !== id) }))} /> : null}</div>}</EditorSection>
      <EditorSection title="Materiali utilizzati">{data.materials.length === 0 ? <p className="text-sm text-slate-500">Nessun materiale in libreria.</p> : <div className="space-y-2">{data.materials.map((material) => <label className="flex items-center gap-2 text-sm" key={material.id}><input type="checkbox" checked={session.materialIds.includes(material.id)} onChange={(event) => update((current) => ({ ...current, materialIds: event.target.checked ? [...current.materialIds, material.id] : current.materialIds.filter((id) => id !== material.id) }))} />{material.title}</label>)}</div>}</EditorSection>
      <EditorSection title="Continuità clinica"><TextArea label="Cosa fare nella prossima seduta" name="nextPlan" value={session.nextPlan} /><TextArea label="Compito a casa" name="homework" value={session.homework} /><TextArea label="Note libere" name="notes" value={session.notes} /></EditorSection>
      {serverError ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{serverError}</p> : null}
      <div className={presentation === "panel" ? "sticky bottom-0 z-10 -mx-6 flex justify-end gap-2 border-t border-sage-100 bg-white/95 px-6 py-4 backdrop-blur" : "sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-2 rounded-2xl border border-sage-100 bg-white/95 p-2 shadow-lg backdrop-blur sm:bottom-4"}>
        {onCancel ? <button type="button" className="btn btn-quiet" disabled={saving} onClick={onCancel}>Annulla</button> : null}
        <button disabled={saving} aria-busy={saving} className={`btn btn-primary ${presentation === "page" ? "w-full py-4 text-base" : ""} disabled:cursor-wait disabled:opacity-60`}>{saving ? "Salvataggio…" : presentation === "panel" ? "Salva seduta" : "Concludi e salva seduta"}</button>
      </div>
    </form>
    {pendingWithoutActivities ? <Modal title="Registrare senza attività svolte?" onClose={() => setPendingWithoutActivities(null)}><p className="text-sm leading-6 text-slate-600">Non hai inserito attività svolte per questa seduta. Vuoi registrarla comunque?</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingWithoutActivities(null)} className="btn btn-quiet">Torna alla seduta</button><button type="button" disabled={saving} onClick={() => void persist(pendingWithoutActivities)} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">{saving ? "Salvataggio…" : "Registra comunque"}</button></div></Modal> : null}
  </div>;
}

function EditorSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) { return <section className="card p-5"><h2 className="text-sm font-bold">{title}</h2>{description ? <p className="mb-3 mt-1 text-sm text-slate-500">{description}</p> : <div className="h-3" />}{children}</section>; }
function GoalChoices({ title, goals, selected, onToggle }: { title: string; goals: ReturnType<typeof useData>["data"]["goals"]; selected: string[]; onToggle: (id: string, checked: boolean) => void }) { return <fieldset><legend className="text-xs font-bold text-slate-500">{title}</legend><div className="mt-2 space-y-2">{goals.map((goal) => <label className="flex items-center gap-2 text-sm" key={goal.id}><input type="checkbox" checked={selected.includes(goal.id)} onChange={(event) => onToggle(goal.id, event.target.checked)} />{goal.title}</label>)}</div></fieldset>; }
function TextArea({ label, name, value }: { label: string; name: string; value: string }) { return <label className="mb-5 block text-sm font-bold last:mb-0">{label}<textarea aria-label={label} name={name} defaultValue={value} className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal" /></label>; }
