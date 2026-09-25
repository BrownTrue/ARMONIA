"use client";
import { useState } from "react";
import { Field, Select, Textarea } from "./form-controls";
import { useData } from "./data-provider";
import type { Appointment, AppointmentType } from "@/lib/types";
import { fullName, today, uid } from "@/lib/types";
import { generateWeeklyDates, weekdayName } from "@/lib/recurrence";

export function AppointmentForm({appointment,initialDate,initialTime,onDone}:{appointment?:Appointment;initialDate?:string;initialTime?:string;onDone:()=>void}) {
  const { data, saveAppointment, saveAppointments } = useData();
  const [repeat, setRepeat] = useState<"none"|"weekly">("none");
  const [startDate, setStartDate] = useState(appointment?.date||initialDate||today());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const a = appointment || {id:uid(),patientId:data.patients[0]?.id||"",date:initialDate||today(),time:initialTime||"09:00",duration:45,type:"regular" as AppointmentType,notes:"",createdAt:new Date().toISOString()};
  return <form onSubmit={async (event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const base:Appointment={...a,patientId:String(f.get("patientId")||""),date:String(f.get("date")||""),time:String(f.get("time")||""),duration:Number(f.get("duration")||45),type:String(f.get("type")||"regular") as AppointmentType,notes:String(f.get("notes")||"")};
    setError("");
    setSaving(true);
    try {
      if (!appointment && repeat === "weekly") {
        const dates=generateWeeklyDates(base.date,String(f.get("recurrenceEndDate")||""));
        const recurrenceSeriesId=uid();
        const createdAt=new Date().toISOString();
        await saveAppointments(dates.map((date,index)=>({...base,id:index===0?base.id:uid(),date,recurrenceSeriesId,createdAt})));
      } else {
        await saveAppointment(base);
      }
      onDone();
    } catch (cause) {
      setError(cause instanceof Error?cause.message:"Impossibile salvare l'appuntamento.");
      setSaving(false);
    }
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select name="patientId" label="Paziente" required defaultValue={a.patientId}><option value="" disabled>Seleziona</option>{data.patients.map(p=><option value={p.id} key={p.id}>{fullName(p)}</option>)}</Select>
      <Select name="type" label="Tipo" defaultValue={a.type}><option value="regular">Seduta</option><option value="assessment">Prima valutazione</option><option value="checkup">Controllo</option><option value="cancelled">Annullato</option></Select>
      <Field name="date" label="Data" required type="date" value={startDate} onInput={event=>setStartDate(event.currentTarget.value)}/><Field name="time" label="Ora" required type="time" defaultValue={a.time}/><Field name="duration" label="Durata (minuti)" required min={15} step={5} type="number" defaultValue={a.duration}/><div className="sm:col-span-2"><Textarea name="notes" label="Note" defaultValue={a.notes}/></div>
      {!appointment&&<><Select name="recurrence" label="Ripetizione" value={repeat} onChange={event=>setRepeat(event.target.value as "none"|"weekly")}><option value="none">Nessuna</option><option value="weekly">Ogni settimana</option></Select>{repeat==="weekly"&&<div className="rounded-xl bg-sage-50 p-3 text-sm"><span className="text-slate-500">Giorno della settimana</span><b className="mt-1 block capitalize text-sage-700">{startDate?weekdayName(startDate):"—"}</b></div>}{repeat==="weekly"&&<Field name="recurrenceEndDate" label="Fine ricorrenza" required type="date" min={startDate} />}</>}
      {appointment?.recurrenceSeriesId&&<div className="sm:col-span-2 rounded-xl bg-sage-50 p-3 text-sm text-sage-800">Questo appuntamento fa parte di una serie settimanale. Le modifiche riguardano solo questa occorrenza.</div>}
    </div>
    {error&&<p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
    <div className="form-actions mt-6"><button type="button" className="btn btn-quiet" onClick={onDone}>Annulla</button><button disabled={saving} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">{saving?"Salvataggio…":appointment?"Salva modifiche":repeat==="weekly"?"Crea appuntamenti":"Crea appuntamento"}</button></div>
  </form>;
}
