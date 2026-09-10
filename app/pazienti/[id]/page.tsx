"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { PatientForm } from "@/components/patient-form";
import type { Goal, Session } from "@/lib/types";
import { age, fullName, initials, uid } from "@/lib/types";
export default function PatientPage() {
  const { id } = useParams<{ id: string }>(),
    router = useRouter();
  const { data, ready, deletePatient, deleteSession, deleteGoal } = useData();
  const [edit, setEdit] = useState(false),
    [detail, setDetail] = useState<Session | null>(null),
    [goalEdit, setGoalEdit] = useState<Goal | "new" | null>(null);
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
    .sort((a, b) => b.date.localeCompare(a.date));
  const goals = data.goals.filter((g) => g.patientId === id);
  const next = data.appointments
    .filter((a) => a.patientId === id && a.type !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  return (
    <AppShell>
      <Link href="/pazienti" className="text-sm font-bold text-sage-700">
        ← Tutti i pazienti
      </Link>
      <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sage-100 text-lg font-bold">
            {initials(p)}
          </span>
          <div>
            <h1 className="text-3xl font-bold">{fullName(p)}</h1>
            <p className="mt-1 text-slate-500">
              {age(p.birthDate) || "—"} anni ·{" "}
              {p.status === "active"
                ? "Attivo"
                : p.status === "suspended"
                  ? "Sospeso"
                  : "Concluso"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEdit(true)} className="btn btn-quiet">
            Modifica
          </button>
          <button
            onClick={() => {
              if (confirm("Eliminare il paziente e tutti i dati collegati?")) {
                deletePatient(p.id);
                router.push("/pazienti");
              }
            }}
            className="btn text-red-600"
          >
            Elimina
          </button>
          <Link href={"/sedute/nuova?p=" + p.id} className="btn btn-primary">
            Inizia seduta
          </Link>
        </div>
      </header>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <p className="text-sm font-bold text-slate-500">
            PROSSIMO APPUNTAMENTO
          </p>
          {next ? (
            <div className="mt-3">
              <p className="text-xl font-bold">
                {new Date(next.date + "T12:00").toLocaleDateString("it-IT")} ·{" "}
                {next.time}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {next.duration} minuti
              </p>
            </div>
          ) : (
            <p className="mt-3 text-slate-500">
              Nessun appuntamento programmato.
            </p>
          )}
        </section>
        <section className="card p-5">
          <p className="text-sm font-bold text-slate-500">CONTATTI</p>
          <p className="mt-3 text-sm">
            {p.contact || "Non indicato"}
            <br />
            {p.guardian && `Tutore: ${p.guardian}`}
          </p>
        </section>
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Obiettivi</h2>
            <button onClick={() => setGoalEdit("new")} className="btn btn-quiet text-sm">+ Nuovo obiettivo</button>
          </div>
          {goals.length ? (
            <div className="mt-5 space-y-4">
              {goals.map((g) => (
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
            <p className="mt-3 text-sm text-slate-500">Nessun obiettivo.</p>
          )}
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Prossima volta</h2>
          <p className="mt-3 text-sm text-slate-600">
            {sessions[0]?.nextPlan || "Nessuna indicazione salvata."}
          </p>
        </section>
        <section className="card p-5 lg:col-span-3">
          <h2 className="font-bold">Timeline sedute</h2>
          {sessions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Nessuna seduta registrata.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-sage-100">
              {sessions.map((s) => (
                <div
                  className="flex flex-wrap items-center gap-3 py-4"
                  key={s.id}
                >
                  <div className="min-w-28">
                    <b>
                      {new Date(s.date + "T12:00").toLocaleDateString("it-IT")}
                    </b>
                    <p className="text-sm text-slate-500">
                      {s.duration} minuti
                    </p>
                  </div>
                  <div className="min-w-48 flex-1">
                    <p className="text-sm">
                      {s.result || s.activities || "Seduta registrata"}
                    </p>
                    <p className="mt-1 text-sm text-sage-700">
                      Prossima volta: {s.nextPlan || "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(s)}
                    className="btn btn-quiet"
                  >
                    Apri / modifica
                  </button>
                  <button
                    onClick={() =>
                      confirm("Eliminare questa seduta?") && deleteSession(s.id)
                    }
                    className="btn text-red-600"
                  >
                    Elimina
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
