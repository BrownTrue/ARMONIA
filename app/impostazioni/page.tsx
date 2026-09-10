"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Field } from "@/components/form-controls";
import type { Profile } from "@/lib/types";
export default function Settings() {
  const router = useRouter();
  const { data, ready, connection, saveProfile, signOut } = useData();
  const [v, setV] = useState<Profile>(data.profile),
    [saved, setSaved] = useState(false);
  useEffect(() => { if (ready) setV(data.profile); }, [ready, data.profile]);
  const set =
    (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSaved(false);
      setV((old) => ({ ...old, [k]: value }));
    };
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Impostazioni</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${connection.kind === "local" ? "bg-sage-100 text-sage-700" : connection.kind === "cloud" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
          <span className={`h-2 w-2 rounded-full ${connection.kind === "local" ? "bg-sage-500" : connection.kind === "cloud" ? "bg-blue-500" : "bg-red-500"}`}/>{connection.label}
        </span>
        <p className="text-sm text-slate-500">{connection.message}</p>
      </div>
      <form
        className="card mt-8 max-w-2xl p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await saveProfile(v);
          setSaved(true);
        }}
      >
        <h2 className="mb-5 font-bold">Il tuo profilo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            required
            value={v.firstName}
            onChange={set("firstName")}
          />
          <Field
            label="Cognome"
            required
            value={v.lastName}
            onChange={set("lastName")}
          />
          <Field
            label="Professione"
            value={v.profession}
            onChange={set("profession")}
          />
          <Field
            label="Email"
            required
            type="email"
            value={v.email}
            onChange={set("email")}
          />
          <div className="sm:col-span-2">
            <Field
              label="Studio / centro"
              value={v.studio}
              onChange={set("studio")}
            />
          </div>
        </div>
        <button className="btn btn-primary mt-6">Salva profilo</button>
        {saved && (
          <span className="ml-3 text-sm font-bold text-sage-700">
            Modifiche salvate ✓
          </span>
        )}
      </form>
      <section className="card mt-5 max-w-2xl p-6">
        <h2 className="font-bold">Account</h2>
        <button
          disabled={connection.kind === "local"}
          title={connection.kind === "local" ? "Funzione non disponibile in modalità locale" : undefined}
          onClick={async () => { await signOut(); router.replace("/login"); }}
          className={`btn mt-4 ${connection.kind === "local" ? "cursor-not-allowed bg-slate-100 text-slate-400" : "btn-quiet"}`}
        >
          Esci dall’app
        </button>
      </section>
    </AppShell>
  );
}
