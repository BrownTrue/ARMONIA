"use client";
import { Field, Select, Textarea } from "./form-controls";
import { useData } from "./data-provider";
import { PatientAdministrativeDetailsFields, blankPatientAdministrativeDetails } from "./patient-administrative-details";
import { detailsByPatientId, isValidAdministrativeEmail, PatientAdministrativePersistenceError, savePatientWithAdministrativeDetails } from "@/lib/patient-administrative-details";
import type { Patient, PatientStatus } from "@/lib/types";
import { uid } from "@/lib/types";
import { useState } from "react";

export function PatientForm({ patient, onDone }: { patient?: Patient; onDone: () => void }) {
  const { data, savePatient, savePatientAdministrativeDetails, deletePatientAdministrativeDetails } = useData();
  const [p] = useState<Patient>(() => patient || { id:uid(), firstName:"", lastName:"", birthDate:"", contact:"", guardian:"", school:"", schoolClass:"", referralReason:"", notes:"", status:"active" as PatientStatus, createdAt:new Date().toISOString() });
  const [existingDetails] = useState(() => detailsByPatientId(data.patientAdministrativeDetails, p.id));
  const [administrativeDetails, setAdministrativeDetails] = useState(() => existingDetails ? { ...existingDetails } : blankPatientAdministrativeDetails(p.id));
  const [firstName, setFirstName] = useState(p.firstName);
  const [lastName, setLastName] = useState(p.lastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (saving) return;
    const f = new FormData(event.currentTarget);
    if (!isValidAdministrativeEmail(administrativeDetails.administrativeEmail)) { setError("Inserisci un indirizzo email amministrativo valido oppure lascia il campo vuoto."); return; }
    const nextPatient = { ...p, firstName, lastName, birthDate:String(f.get("birthDate")||""), contact:String(f.get("contact")||""), guardian:String(f.get("guardian")||""), school:String(f.get("school")||""), schoolClass:String(f.get("schoolClass")||""), referralReason:String(f.get("referralReason")||""), notes:String(f.get("notes")||""), status:String(f.get("status")||"active") as PatientStatus };
    setSaving(true); setError("");
    try {
      await savePatientWithAdministrativeDetails(nextPatient, { ...administrativeDetails, updatedAt:new Date().toISOString() }, existingDetails, savePatient, savePatientAdministrativeDetails, deletePatientAdministrativeDetails);
      onDone();
    } catch (cause) {
      setError(cause instanceof PatientAdministrativePersistenceError && cause.stage === "administrative"
        ? "Il paziente è stato salvato, ma i dati amministrativi no. Riprova il salvataggio."
        : "Non è stato possibile salvare il paziente. Riprova.");
      setSaving(false);
    }
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="firstName" label="Nome" required value={firstName} onChange={(event)=>setFirstName(event.target.value)}/><Field name="lastName" label="Cognome" required value={lastName} onChange={(event)=>setLastName(event.target.value)}/>
      <Field name="birthDate" label="Data di nascita" type="date" defaultValue={p.birthDate}/><Field name="contact" label="Contatto" defaultValue={p.contact}/>
      <Field name="guardian" label="Genitore / tutore" defaultValue={p.guardian}/><Field name="school" label="Scuola" defaultValue={p.school}/>
      <Field name="schoolClass" label="Classe" defaultValue={p.schoolClass}/><Select name="status" label="Stato" defaultValue={p.status}><option value="active">Attivo</option><option value="suspended">Sospeso</option><option value="completed">Concluso</option></Select>
      <div className="sm:col-span-2"><Textarea name="referralReason" label="Motivo dell’invio" defaultValue={p.referralReason}/></div><div className="sm:col-span-2"><Textarea name="notes" label="Note" defaultValue={p.notes}/></div>
    </div>
    <details className="mt-6 overflow-hidden rounded-2xl border border-sage-100 bg-sage-50/20">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-400 sm:px-5"><span><span className="font-bold">Dati amministrativi</span><span className="ml-2 text-xs font-bold uppercase tracking-wide text-slate-400">Facoltativi</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Puoi completarli anche in seguito.</span></span><span aria-hidden="true" className="text-lg text-sage-700">⌄</span></summary>
      <div className="space-y-5 border-t border-sage-100 bg-white p-3 sm:p-5"><PatientAdministrativeDetailsFields patient={{ ...p, firstName, lastName }} value={administrativeDetails} onChange={setAdministrativeDetails} /></div>
    </details>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
    <div className="form-actions mt-6"><button type="button" disabled={saving} className="btn btn-quiet disabled:opacity-50" onClick={onDone}>Annulla</button><button disabled={saving} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60">{saving?"Salvataggio…":patient?"Salva modifiche":"Crea paziente"}</button></div>
  </form>;
}
