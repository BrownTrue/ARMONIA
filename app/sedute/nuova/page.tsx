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
function Form() {
  const q = useSearchParams(),
    router = useRouter(),
    { data, ready, saveSession } = useData();
  const requestedAppointmentId = q.get("a") || undefined;
  const [v, setV] = useState<Session | null>(null);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
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
    setError("");
    try { await saveSession(session); router.push("/pazienti/" + p.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Non è stato possibile salvare la seduta."); setSaving(false); }
  };
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
        onSubmit={async (e) => {
          e.preventDefault();
          if (v.appointmentId && data.sessions.some((s) => s.appointmentId === v.appointmentId && s.id !== v.id)) { alert("Seduta già registrata per questo appuntamento."); return; }
          const f=new FormData(e.currentTarget);
          setError("");
          let effectivePriceCents: number | undefined;
          try { effectivePriceCents = euroInputToCents(price); } catch (cause) { setError(cause instanceof Error ? cause.message : "Inserisci un prezzo valido."); return; }
          const session={...v,effectivePriceCents,activities:String(f.get('activities')||'').trim(),result:String(f.get('result')||''),nextPlan:String(f.get('nextPlan')||''),homework:String(f.get('homework')||''),notes:String(f.get('notes')||'')};
          if (!session.activities) { setPendingWithoutActivities(session); return; }
          await persistSession(session);
        }}
      >
        <section className="card p-5">
          <h2 className="text-sm font-bold">Data e paziente</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Paziente<select value={v.patientId} onChange={(e) => updateSession((old) => ({...old,patientId:e.target.value,appointmentId:undefined}))} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal">{data.patients.map((patient) => <option value={patient.id} key={patient.id}>{fullName(patient)}</option>)}</select></label>
            <label className="block text-sm font-bold">Data effettiva<input type="date" max={today()} required value={v.date} onChange={(e) => updateSession((old) => ({...old,date:e.target.value,appointmentId:undefined}))} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal" /></label>
            <label className="block text-sm font-bold sm:col-span-2">Appuntamento collegato<select value={v.appointmentId || ""} onChange={(e) => { const appointment=data.appointments.find((a)=>a.id===e.target.value); if (!appointment) { updateSession((old)=>({...old,appointmentId:undefined})); return; } updateSession((old)=>sessionWithAppointmentSnapshot(old,appointment)); setPrice(centsToEuroInput(appointment.effectivePriceCents)); }} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal"><option value="">Nessun appuntamento</option>{appointmentsForDate.map((a)=><option value={a.id} key={a.id}>{a.time} · {a.duration} min</option>)}</select></label>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-sm font-bold">Prestazione</h2>
          <p className="mt-1 text-sm text-slate-500">Questi dati diventano lo storico economico della seduta.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">Prestazione<select value={v.serviceId || ""} onChange={(event)=>{const service=data.services.find((item)=>item.id===event.target.value)||null;updateSession((old)=>sessionWithService(old,service));if(service)setPrice(centsToEuroInput(service.defaultPriceCents));}} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal"><option value="">Nessuna prestazione</option>{v.serviceId&&!data.services.some((item)=>item.id===v.serviceId)&&<option value={v.serviceId}>{v.serviceNameSnapshot||"Prestazione non disponibile"} — Non disponibile</option>}{selectableAppointmentServices(data.services,v.serviceId).map((service)=><option value={service.id} key={service.id}>{service.name}{!service.isActive?" — Non attiva":""}</option>)}</select></label>
            <label className="block text-sm font-bold">Prezzo (facoltativo)<input inputMode="decimal" placeholder="es. 45,00" value={price} onChange={(event)=>setPrice(event.target.value)} className="mt-2 w-full rounded-xl border border-sage-100 bg-white p-3 font-normal"/><span className="mt-1 block text-xs font-normal text-slate-500">Vuoto = non specificato · 0 = gratuita</span></label>
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
        {error&&<p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
        <button disabled={saving} className="btn btn-primary w-full py-4 text-base disabled:cursor-wait disabled:opacity-60">
          {saving ? "Salvataggio…" : "Concludi e salva seduta"}
        </button>
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
