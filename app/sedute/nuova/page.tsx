"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { centsToEuroInput, euroInputToCents, selectableAppointmentServices } from "@/lib/calendar-v2";
import { resolveNewSessionDraft, sessionWithAppointmentSnapshot, sessionWithService } from "@/lib/economy";
import { fullName, today, uid } from "@/lib/types";
import type { Session } from "@/lib/types";
import { Modal } from "@/components/modal";
import { Field, Select } from "@/components/form-controls";
import { focusFirstInvalidField, validateSessionForm, type FieldErrors } from "@/lib/form-validation";
function Form() {
  const q = useSearchParams(),
    router = useRouter(),
    { data, ready, saveSession } = useData();
  const requestedAppointmentId = q.get("a") || undefined;
  const [v, setV] = useState<Session | null>(null);
  const [price, setPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [appointmentMissing, setAppointmentMissing] = useState(false);
  const [pendingWithoutActivities, setPendingWithoutActivities] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || !ready) return;
    const resolution = resolveNewSessionDraft(null, {
      dataReady: ready,
      appointmentId: requestedAppointmentId,
      appointments: data.appointments,
      fallbackPatientId: q.get("p") || data.patients[0]?.id || "",
      fallbackDate: q.get("date") || today(),
      createId: uid,
      createdAt: () => new Date().toISOString(),
    });
    if (!resolution.session) return;
    initializedRef.current = true;
    setV(resolution.session);
    setPrice(centsToEuroInput(resolution.session.effectivePriceCents));
    setAppointmentMissing(resolution.appointmentMissing);
  }, [data.appointments, data.patients, q, ready, requestedAppointmentId]);
  if (!v) return <AppShell><p className="text-sm text-slate-500">Caricamento seduta…</p></AppShell>;
  const updateSession = (update: (current: Session) => Session) => setV((current) => current ? update(current) : current);
  const p = data.patients.find((x) => x.id === v.patientId);
  const previous = p
    ? data.sessions
        .filter((s) => s.patientId === p.id && s.date <= v.date)
        .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))[0]
    : undefined;
  const appointmentsForDate = data.appointments.filter((a) => a.patientId === v.patientId && a.date === v.date && a.type !== "cancelled");
  const duplicate = v.appointmentId ? data.sessions.find((s) => s.appointmentId === v.appointmentId) : undefined;
  const activePathway = data.clinicalPathways.find((pathway) => pathway.patientId === v.patientId && pathway.status === "active");
  const activeGoals = data.goals.filter((goal) => goal.patientId === v.patientId && goal.status !== "achieved" && goal.status !== "suspended");
  const pathwayGoals = activePathway ? activeGoals.filter((goal) => goal.clinicalPathwayId === activePathway.id) : [];
  const otherGoals = activeGoals.filter((goal) => !goal.clinicalPathwayId);
  if (duplicate)
    return <AppShell><div className="card mx-auto max-w-2xl p-8"><h1 className="text-2xl font-bold">Seduta già registrata</h1><p className="mt-2 text-slate-500">Per questo appuntamento esiste già una seduta. Aprila dalla timeline del paziente per modificarla.</p><button onClick={() => router.push(`/pazienti/${duplicate.patientId}`)} className="btn btn-primary mt-6">Apri timeline paziente</button></div></AppShell>;
  if (!p)
    return (
      <AppShell>
        <p>Crea prima un paziente.</p>
      </AppShell>
    );
  const opts = (labels: string[], key: "response" | "helpLevel") => (
    <div className="flex flex-wrap gap-2">
      {labels.map((x) => (
        <button
          type="button"
          onClick={() => updateSession((old) => ({ ...old, [key]: x }))}
          className={"chip " + (v[key] === x ? "!bg-sage-700 !text-white" : "")}
          key={x}
        >
          {x}
        </button>
      ))}
    </div>
  );
  const persistSession = async (session: Session) => {
    setSaving(true);
    setServerError("");
    try { await saveSession(session); router.push("/pazienti/" + p.id); }
    catch { setServerError("Non è stato possibile salvare la seduta. Riprova."); setSaving(false); }
  };
  const clearFieldError = (field: string) => setFieldErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-sm font-bold text-sage-700">
          REGISTRA SEDUTA · {new Date(v.date + "T12:00").toLocaleDateString("it-IT")}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Seduta con {fullName(p)}</h1>
        {previous?.nextPlan && (
          <p className="mt-3 rounded-xl bg-[#fff8ed] p-3 text-sm text-[#8b6843]">
            <b>Dalla seduta precedente:</b> {previous.nextPlan}
          </p>
        )}
        {appointmentMissing && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">L’appuntamento richiesto non è disponibile. Puoi continuare registrando una seduta manuale.</p>}
      </header>
      <form
        className="mx-auto max-w-3xl space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (v.appointmentId && data.sessions.some((s) => s.appointmentId === v.appointmentId && s.id !== v.id)) { const errors={appointmentId:"Per questo appuntamento esiste già una seduta. Aprila dalla timeline del paziente per modificarla."}; setFieldErrors(errors); setServerError(""); focusFirstInvalidField(errors); return; }
          const f=new FormData(e.currentTarget);
          const errors=validateSessionForm({patientId:v.patientId,date:v.date,duration:v.duration,price,latestDate:today()});
          if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}
          setFieldErrors({}); setServerError("");
          const effectivePriceCents=euroInputToCents(price);
          const session={...v,effectivePriceCents,activities:String(f.get('activities')||'').trim(),result:String(f.get('result')||''),nextPlan:String(f.get('nextPlan')||''),homework:String(f.get('homework')||''),notes:String(f.get('notes')||'')};
          if (!session.activities) { setPendingWithoutActivities(session); return; }
          await persistSession(session);
        }}
      >
        {Object.keys(fieldErrors).length > 1 && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Ci sono alcune informazioni da controllare.</p><p className="mt-1">Correggi i campi evidenziati e riprova.</p></div>}
        <section className="card p-5">
          <h2 className="text-sm font-bold">Data e paziente</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select id="session-patient" data-validation-field="patientId" label="Paziente" value={v.patientId} error={fieldErrors.patientId} onChange={(e) => {updateSession((old) => ({...old,patientId:e.target.value,appointmentId:undefined}));clearFieldError("patientId");}}>{data.patients.map((patient) => <option value={patient.id} key={patient.id}>{fullName(patient)}</option>)}</Select>
            <Field id="session-date" data-validation-field="date" label="Data effettiva" type="date" max={today()} required value={v.date} error={fieldErrors.date} onChange={(e) => {updateSession((old) => ({...old,date:e.target.value,appointmentId:undefined}));clearFieldError("date");}} />
            <div className="sm:col-span-2"><Select id="session-appointment" data-validation-field="appointmentId" label="Appuntamento collegato" value={v.appointmentId || ""} error={fieldErrors.appointmentId} onChange={(e) => { clearFieldError("appointmentId"); const appointment=data.appointments.find((a)=>a.id===e.target.value); if (!appointment) { updateSession((old)=>({...old,appointmentId:undefined})); return; } updateSession((old)=>sessionWithAppointmentSnapshot(old,appointment)); setPrice(centsToEuroInput(appointment.effectivePriceCents)); }}><option value="">Nessun appuntamento</option>{appointmentsForDate.map((a)=><option value={a.id} key={a.id}>{a.time} · {a.duration} min</option>)}</Select></div>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-bold">Prestazione</h2>
          <p className="mt-1 text-sm text-slate-500">Questi dati diventano lo storico economico della seduta.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Prestazione<select value={v.serviceId || ""} onChange={(event)=>{const service=data.services.find((item)=>item.id===event.target.value)||null;updateSession((old)=>sessionWithService(old,service));if(service){setPrice(centsToEuroInput(service.defaultPriceCents));clearFieldError("duration");clearFieldError("price");}}} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal"><option value="">Nessuna prestazione</option>{v.serviceId&&!data.services.some((item)=>item.id===v.serviceId)&&<option value={v.serviceId}>{v.serviceNameSnapshot||"Prestazione non disponibile"} — Non disponibile</option>}{selectableAppointmentServices(data.services,v.serviceId).map((service)=><option value={service.id} key={service.id}>{service.name}{!service.isActive?" — Non attiva":""}</option>)}</select></label>
            <div><Field id="session-duration" data-validation-field="duration" label="Durata (minuti)" type="number" min={1} required value={v.duration || ""} error={fieldErrors.duration} onChange={(event)=>{updateSession((old)=>({...old,duration:event.target.value===""?Number.NaN:Number(event.target.value)}));clearFieldError("duration");}} /></div>
            <div><Field id="session-price" data-validation-field="price" label="Prezzo (facoltativo)" inputMode="decimal" placeholder="es. 45,00" value={price} error={fieldErrors.price} onChange={(event)=>{setPrice(event.target.value);clearFieldError("price");}}/><span className="mt-1 block text-xs text-slate-500">Vuoto = non specificato · 0 = gratuita</span></div>
          </div>
        </section>
        <section className="card p-5">
          <label className="text-sm font-bold">Attività svolte</label>
          <textarea
            aria-label="Attività svolte"
            name="activities"
            defaultValue={v.activities}
            placeholder="Esercizi, giochi e attività…"
            className="mt-3 min-h-24 w-full rounded-xl border border-sage-100 p-3"
          />
        </section>
        <section className="card p-5">
          <label className="text-sm font-bold">Risposta del paziente</label>
          <div className="mt-3">
            {opts(["Ottima", "Buona", "Discreta", "Difficoltosa"], "response")}
          </div>
          <label className="mt-6 block text-sm font-bold">
            Livello di aiuto
          </label>
          <div className="mt-3">
            {opts(["Nessuno", "Minimo", "Moderato", "Elevato"], "helpLevel")}
          </div>
          <label className="mt-6 block text-sm font-bold">Risultato</label>
          <textarea
            aria-label="Risultato"
            name="result" defaultValue={v.result}
            className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3"
          />
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-bold">Obiettivi della seduta</h2>
          {pathwayGoals.length === 0 && otherGoals.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nessun obiettivo attivo per questo paziente.</p>
          ) : (
            <div className="mt-4 space-y-5">
              {pathwayGoals.length > 0 && <GoalChoices
                title="OBIETTIVI DEL PERCORSO ATTIVO"
                goals={pathwayGoals}
                selected={v.goalIds}
                onToggle={(goalId,checked)=>updateSession((old)=>({...old,goalIds:checked?[...old.goalIds,goalId]:old.goalIds.filter((id)=>id!==goalId)}))}
              />}
              {otherGoals.length > 0 && <GoalChoices
                title={activePathway?"ALTRI OBIETTIVI ATTIVI":"OBIETTIVI ATTIVI"}
                goals={otherGoals}
                selected={v.goalIds}
                onToggle={(goalId,checked)=>updateSession((old)=>({...old,goalIds:checked?[...old.goalIds,goalId]:old.goalIds.filter((id)=>id!==goalId)}))}
              />}
            </div>
          )}
        </section>
        <section className="card p-5">
          <label className="text-sm font-bold">Materiali utilizzati</label>
          {data.materials.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Nessun materiale in libreria.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.materials.map((m) => (
                <label className="flex items-center gap-2 text-sm" key={m.id}>
                  <input
                    type="checkbox"
                    checked={v.materialIds.includes(m.id)}
                    onChange={(e) => { const checked=e.target.checked; updateSession((old) => ({
                        ...old,
                        materialIds: checked ? [...old.materialIds, m.id] : old.materialIds.filter((x) => x !== m.id),
                      })) }}
                  />
                  {m.title}
                </label>
              ))}
            </div>
          )}
        </section>
        <section className="card space-y-5 p-5">
          <label className="block text-sm font-bold">
            Cosa fare nella prossima seduta
            <textarea
              aria-label="Cosa fare nella prossima seduta"
              name="nextPlan" defaultValue={v.nextPlan}
              className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal"
            />
          </label>
          <label className="block text-sm font-bold">
            Compito a casa
            <textarea
              aria-label="Compito a casa"
              name="homework" defaultValue={v.homework}
              className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal"
            />
          </label>
          <label className="block text-sm font-bold">
            Note libere
            <textarea
              aria-label="Note libere"
              name="notes" defaultValue={v.notes}
              className="mt-3 min-h-20 w-full rounded-xl border border-sage-100 p-3 font-normal"
            />
          </label>
        </section>
        {serverError&&<p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{serverError}</p>}
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-2 rounded-2xl border border-sage-100 bg-white/95 p-2 shadow-lg backdrop-blur sm:bottom-4"><button disabled={saving} aria-busy={saving} className="btn btn-primary w-full py-4 text-base disabled:cursor-wait disabled:opacity-60">{saving ? "Salvataggio…" : "Concludi e salva seduta"}</button></div>
      </form>
      {pendingWithoutActivities && <Modal title="Registrare senza attività svolte?" onClose={() => setPendingWithoutActivities(null)}><p className="text-sm leading-6 text-slate-600">Non hai inserito attività svolte per questa seduta. Vuoi registrarla comunque?</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingWithoutActivities(null)} className="btn btn-quiet">Torna alla seduta</button><button type="button" disabled={saving} onClick={() => void persistSession(pendingWithoutActivities)} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">{saving ? "Salvataggio…" : "Registra comunque"}</button></div></Modal>}
    </AppShell>
  );
}

function GoalChoices({title,goals,selected,onToggle}:{title:string;goals:ReturnType<typeof useData>["data"]["goals"];selected:string[];onToggle:(goalId:string,checked:boolean)=>void}) {
  return <fieldset><legend className="text-xs font-bold text-slate-500">{title}</legend><div className="mt-2 space-y-2">{goals.map((goal)=><label className="flex items-center gap-2 text-sm" key={goal.id}><input type="checkbox" checked={selected.includes(goal.id)} onChange={(event)=>onToggle(goal.id,event.target.checked)}/>{goal.title}</label>)}</div></fieldset>;
}
export default function NewSession() {
  return (
    <Suspense fallback={<p>Caricamento…</p>}>
      <Form />
    </Suspense>
  );
}
