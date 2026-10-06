"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { MobilePatientDirectory } from "@/components/patients/mobile-patient-directory";
import { PatientForm } from "@/components/patient-form";
import { filterPatients } from "@/lib/patient-directory";
import { age, fullName, initials } from "@/lib/types";

export default function Patients() {
  const { data, ready } = useData();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const list = filterPatients(data.patients, query);

  return <AppShell>
    <MobilePatientDirectory patients={list} totalPatients={data.patients.length} ready={ready} query={query} onQueryChange={setQuery} onCreate={() => setCreating(true)}/>

    <div className="hidden md:block">
      <header className="page-header mb-8"><div><h1 className="text-3xl font-bold">Pazienti</h1><p className="mt-2 text-slate-500">Le persone che segui, tutte in un posto.</p></div><button onClick={() => setCreating(true)} className="btn btn-primary w-full sm:w-auto">+ Nuovo paziente</button></header>
      <input aria-label="Cerca paziente" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca per nome…" className="mb-6 w-full rounded-xl border border-sage-100 bg-white px-4 py-3 outline-none focus:border-sage-500"/>
      {!ready ? <p>Caricamento…</p> : list.length === 0 ? <div className="card p-10 text-center text-slate-500">Nessun paziente trovato.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((patient) => <Link href={`/pazienti/${patient.id}`} className="card p-5 transition hover:-translate-y-0.5" key={patient.id}><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 font-bold">{initials(patient)}</span><div className="min-w-0"><h2 className="truncate font-bold">{fullName(patient)}</h2><p className="text-sm text-slate-500">{age(patient.birthDate) || "—"} anni · {patient.status === "active" ? "Attivo" : patient.status === "suspended" ? "Sospeso" : "Concluso"}</p></div></div><p className="mt-5 break-words text-sm font-medium text-sage-700">{patient.referralReason || "Motivo invio non indicato"}</p><p className="mt-2 text-sm text-slate-500">{data.appointments.filter((appointment) => appointment.patientId === patient.id).sort((left, right) => (left.date + left.time).localeCompare(right.date + right.time))[0]?.date || "Nessun appuntamento"}</p></Link>)}</div>}
    </div>

    {creating && <Modal title="Nuovo paziente" onClose={() => setCreating(false)}><PatientForm onDone={() => setCreating(false)}/></Modal>}
  </AppShell>;
}
