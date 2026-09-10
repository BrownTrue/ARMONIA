"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { fullName, today, uid } from "@/lib/types";
import type { Session } from "@/lib/types";
function Form() {
  const q = useSearchParams(),
    router = useRouter(),
    { data, saveSession } = useData();
  const p = data.patients.find((x) => x.id === q.get("p")) || data.patients[0];
  const previous = p
    ? data.sessions
        .filter((s) => s.patientId === p.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
    : undefined;
  const [v, setV] = useState<Session>({
    id: uid(),
    patientId: p?.id || "",
    date: today(),
    duration: 45,
    goalIds: [],
    activities: "",
    response: "Buona",
    helpLevel: "Minimo",
    result: "",
    nextPlan: "",
    homework: "",
    notes: "",
    materialIds: [],
    createdAt: new Date().toISOString(),
  });
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
          onClick={() => setV((old) => ({ ...old, [key]: x }))}
          className={"chip " + (v[key] === x ? "!bg-sage-700 !text-white" : "")}
          key={x}
        >
          {x}
        </button>
      ))}
    </div>
  );
  return (
    <AppShell>
      <header className="mb-7">
        <p className="text-sm font-bold text-sage-700">
          SEDUTA IN CORSO · OGGI
        </p>
        <h1 className="mt-2 text-3xl font-bold">Seduta con {fullName(p)}</h1>
        {previous?.nextPlan && (
          <p className="mt-3 rounded-xl bg-[#fff8ed] p-3 text-sm text-[#8b6843]">
            <b>Dalla seduta precedente:</b> {previous.nextPlan}
          </p>
        )}
      </header>
      <form
        className="mx-auto max-w-3xl space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
        const f=new FormData(e.currentTarget);
        await saveSession({...v,activities:String(f.get('activities')||''),result:String(f.get('result')||''),nextPlan:String(f.get('nextPlan')||''),homework:String(f.get('homework')||''),notes:String(f.get('notes')||'')});
          router.push("/pazienti/" + p.id);
        }}
      >
        <section className="card p-5">
          <label className="text-sm font-bold">Attività svolte</label>
          <textarea
            aria-label="Attività svolte"
            name="activities" required
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
          <label className="text-sm font-bold">Obiettivi della seduta</label>
          {data.goals.filter((g) => g.patientId === p.id && g.status !== "achieved" && g.status !== "suspended").length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nessun obiettivo attivo per questo paziente.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.goals.filter((g) => g.patientId === p.id && g.status !== "achieved" && g.status !== "suspended").map((goal) => (
                <label className="flex items-center gap-2 text-sm" key={goal.id}>
                  <input type="checkbox" checked={v.goalIds.includes(goal.id)} onChange={(e) => {
                    const checked = e.target.checked;
                    setV((old) => ({ ...old, goalIds: checked ? [...old.goalIds, goal.id] : old.goalIds.filter((id) => id !== goal.id) }));
                  }} />
                  {goal.title}
                </label>
              ))}
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
                    onChange={(e) => { const checked=e.target.checked; setV((old) => ({
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
        <button className="btn btn-primary w-full py-4 text-base">
          Concludi e salva seduta
        </button>
      </form>
    </AppShell>
  );
}
export default function NewSession() {
  return (
    <Suspense fallback={<p>Caricamento…</p>}>
      <Form />
    </Suspense>
  );
}
