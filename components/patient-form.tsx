"use client";
import { Field, Select, Textarea } from "./form-controls";
import { useData } from "./data-provider";
import type { Patient, PatientStatus } from "@/lib/types";
import { uid } from "@/lib/types";

export function PatientForm({ patient, onDone }: { patient?: Patient; onDone: () => void }) {
  const { savePatient } = useData();
  const p = patient || { id:uid(), firstName:"", lastName:"", birthDate:"", contact:"", guardian:"", school:"", schoolClass:"", referralReason:"", notes:"", status:"active" as PatientStatus, createdAt:new Date().toISOString() };
  return <form onSubmit={async (event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await savePatient({ ...p, firstName:String(f.get("firstName")||""), lastName:String(f.get("lastName")||""), birthDate:String(f.get("birthDate")||""), contact:String(f.get("contact")||""), guardian:String(f.get("guardian")||""), school:String(f.get("school")||""), schoolClass:String(f.get("schoolClass")||""), referralReason:String(f.get("referralReason")||""), notes:String(f.get("notes")||""), status:String(f.get("status")||"active") as PatientStatus });
    onDone();
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="firstName" label="Nome" required defaultValue={p.firstName}/><Field name="lastName" label="Cognome" required defaultValue={p.lastName}/>
      <Field name="birthDate" label="Data di nascita" type="date" defaultValue={p.birthDate}/><Field name="contact" label="Contatto" defaultValue={p.contact}/>
      <Field name="guardian" label="Genitore / tutore" defaultValue={p.guardian}/><Field name="school" label="Scuola" defaultValue={p.school}/>
      <Field name="schoolClass" label="Classe" defaultValue={p.schoolClass}/><Select name="status" label="Stato" defaultValue={p.status}><option value="active">Attivo</option><option value="suspended">Sospeso</option><option value="completed">Concluso</option></Select>
      <div className="sm:col-span-2"><Textarea name="referralReason" label="Motivo dell’invio" defaultValue={p.referralReason}/></div><div className="sm:col-span-2"><Textarea name="notes" label="Note" defaultValue={p.notes}/></div>
    </div>
    <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn btn-quiet" onClick={onDone}>Annulla</button><button className="btn btn-primary">{patient?"Salva modifiche":"Crea paziente"}</button></div>
  </form>;
}
