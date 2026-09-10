"use client";
import { Field, Select, Textarea } from "./form-controls";
import { useData } from "./data-provider";
import type { Appointment, AppointmentType } from "@/lib/types";
import { fullName, today, uid } from "@/lib/types";

export function AppointmentForm({appointment,initialDate,initialTime,onDone}:{appointment?:Appointment;initialDate?:string;initialTime?:string;onDone:()=>void}) {
  const { data, saveAppointment } = useData();
  const a = appointment || {id:uid(),patientId:data.patients[0]?.id||"",date:initialDate||today(),time:initialTime||"09:00",duration:45,type:"regular" as AppointmentType,notes:"",createdAt:new Date().toISOString()};
  return <form onSubmit={async (event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    await saveAppointment({...a,patientId:String(f.get("patientId")||""),date:String(f.get("date")||""),time:String(f.get("time")||""),duration:Number(f.get("duration")||45),type:String(f.get("type")||"regular") as AppointmentType,notes:String(f.get("notes")||"")});
    onDone();
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select name="patientId" label="Paziente" required defaultValue={a.patientId}><option value="" disabled>Seleziona</option>{data.patients.map(p=><option value={p.id} key={p.id}>{fullName(p)}</option>)}</Select>
      <Select name="type" label="Tipo" defaultValue={a.type}><option value="regular">Seduta</option><option value="assessment">Prima valutazione</option><option value="checkup">Controllo</option><option value="cancelled">Annullato</option></Select>
      <Field name="date" label="Data" required type="date" defaultValue={a.date}/><Field name="time" label="Ora" required type="time" defaultValue={a.time}/><Field name="duration" label="Durata (minuti)" required min={15} step={5} type="number" defaultValue={a.duration}/><div className="sm:col-span-2"><Textarea name="notes" label="Note" defaultValue={a.notes}/></div>
    </div>
    <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn btn-quiet" onClick={onDone}>Annulla</button><button className="btn btn-primary">{appointment?"Salva modifiche":"Crea appuntamento"}</button></div>
  </form>;
}
