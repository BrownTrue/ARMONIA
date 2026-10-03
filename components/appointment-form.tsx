"use client";
import { useState } from "react";
import { Field, Select, Textarea } from "./form-controls";
import { useData } from "./data-provider";
import type { Appointment, AppointmentType } from "@/lib/types";
import { fullName, today, uid } from "@/lib/types";
import { generateWeeklyDates, weekdayName } from "@/lib/recurrence";
import { buildWeeklyAppointmentOccurrences, centsToEuroInput, euroInputToCents, selectableAppointmentLocations, selectableAppointmentServices, withAppointmentLocation, withAppointmentService } from "@/lib/calendar-v2";
import { focusFirstInvalidField, validateAppointmentForm, type FieldErrors } from "@/lib/form-validation";

export function AppointmentForm({appointment,initialDate,initialTime,onDone}:{appointment?:Appointment;initialDate?:string;initialTime?:string;onDone:()=>void}) {
  const { data, saveAppointment, saveAppointments } = useData();
  const [repeat, setRepeat] = useState<"none"|"weekly">("none");
  const [startDate, setStartDate] = useState(appointment?.date||initialDate||today());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const a = appointment || {id:uid(),patientId:data.patients[0]?.id||"",date:initialDate||today(),time:initialTime||"09:00",duration:45,type:"regular" as AppointmentType,notes:"",createdAt:new Date().toISOString()};
  const [locationId, setLocationId] = useState(a.locationId || "");
  const [locationSnapshot, setLocationSnapshot] = useState(a.locationNameSnapshot);
  const [serviceId, setServiceId] = useState(a.serviceId || "");
  const [serviceSnapshot, setServiceSnapshot] = useState(a.serviceNameSnapshot);
  const [duration, setDuration] = useState(a.duration);
  const [price, setPrice] = useState(centsToEuroInput(a.effectivePriceCents));
  const locations = selectableAppointmentLocations(data.locations, a.locationId);
  const services = selectableAppointmentServices(data.services, a.serviceId);
  const clearFieldError = (field: string) => setFieldErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
  return <form noValidate onSubmit={async (event) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const patientId=String(f.get("patientId")||""), date=String(f.get("date")||""), time=String(f.get("time")||""), recurrenceEndDate=String(f.get("recurrenceEndDate")||"");
    const errors=validateAppointmentForm({patientId,date,time,duration,price,repeat,recurrenceEndDate});
    if(Object.keys(errors).length){setFieldErrors(errors);setServerError("");focusFirstInvalidField(errors);return;}
    setFieldErrors({}); setServerError("");
    setSaving(true);
    try {
      const effectivePriceCents=euroInputToCents(price);
      const base:Appointment={...a,patientId,date,time,duration,type:String(f.get("type")||"regular") as AppointmentType,notes:String(f.get("notes")||""),locationId:locationId||undefined,locationNameSnapshot:locationId?locationSnapshot:undefined,serviceId:serviceId||undefined,serviceNameSnapshot:serviceId?serviceSnapshot:undefined,effectivePriceCents};
      if (!appointment && repeat === "weekly") {
        const dates=generateWeeklyDates(base.date,recurrenceEndDate);
        const recurrenceSeriesId=uid();
        const createdAt=new Date().toISOString();
        await saveAppointments(buildWeeklyAppointmentOccurrences({...base,recurrenceSeriesId,createdAt},dates,uid));
      } else {
        await saveAppointment(base);
      }
      onDone();
    } catch {
      setServerError("Non è stato possibile salvare l’appuntamento. Riprova.");
      setSaving(false);
    }
  }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select id="appointment-patient" data-validation-field="patientId" name="patientId" label="Paziente" required defaultValue={a.patientId} error={fieldErrors.patientId} onChange={()=>clearFieldError("patientId")}><option value="" disabled>Seleziona</option>{data.patients.map(p=><option value={p.id} key={p.id}>{fullName(p)}</option>)}</Select>
      <Select name="type" label="Tipo" defaultValue={a.type}><option value="regular">Seduta</option><option value="assessment">Prima valutazione</option><option value="checkup">Controllo</option><option value="cancelled">Annullato</option></Select>
      <Field id="appointment-date" data-validation-field="date" name="date" label="Data" required type="date" value={startDate} error={fieldErrors.date} onInput={event=>{setStartDate(event.currentTarget.value);clearFieldError("date");}}/><Field id="appointment-time" data-validation-field="time" name="time" label="Ora" required type="time" defaultValue={a.time} error={fieldErrors.time} onChange={()=>clearFieldError("time")}/>
      <Select label="Sede (facoltativa)" value={locationId} onChange={event=>{const id=event.target.value;const selected=data.locations.find(item=>item.id===id);const next=withAppointmentLocation(a,selected||null);setLocationId(next.locationId||"");setLocationSnapshot(next.locationNameSnapshot);}}><option value="">Nessuna sede</option>{a.locationId&&!data.locations.some(item=>item.id===a.locationId)&&<option value={a.locationId}>{a.locationNameSnapshot||"Sede non disponibile"} — Non disponibile</option>}{locations.map(location=><option value={location.id} key={location.id} style={{color:location.color}}>● {location.name}{location.city?` — ${location.city}`:""}{!location.isActive?" — Non attiva":""}</option>)}</Select>
      <Select label="Prestazione (facoltativa)" value={serviceId} onChange={event=>{const id=event.target.value;const selected=data.services.find(item=>item.id===id);if(!selected){setServiceId("");setServiceSnapshot(undefined);return;}const next=withAppointmentService({...a,duration},selected);setServiceId(next.serviceId||"");setServiceSnapshot(next.serviceNameSnapshot);setDuration(next.duration);setPrice(centsToEuroInput(next.effectivePriceCents));}}><option value="">Nessuna prestazione</option>{a.serviceId&&!data.services.some(item=>item.id===a.serviceId)&&<option value={a.serviceId}>{a.serviceNameSnapshot||"Prestazione non disponibile"} — Non disponibile</option>}{services.map(service=><option value={service.id} key={service.id}>{service.name}{!service.isActive?" — Non attiva":""}</option>)}</Select>
      <Field id="appointment-duration" data-validation-field="duration" name="duration" label="Durata (minuti)" required min={15} step={5} type="number" value={Number.isNaN(duration)?"":duration} error={fieldErrors.duration} onChange={event=>{setDuration(event.target.value===""?Number.NaN:Number(event.target.value));clearFieldError("duration");}}/><Field id="appointment-price" data-validation-field="price" name="price" label="Prezzo (facoltativo)" inputMode="decimal" placeholder="es. 42,50" value={price} error={fieldErrors.price} onChange={event=>{setPrice(event.target.value);clearFieldError("price");}}/><div className="sm:col-span-2"><Textarea name="notes" label="Note" defaultValue={a.notes}/></div>
      {!appointment&&<><Select name="recurrence" label="Ripetizione" value={repeat} onChange={event=>{setRepeat(event.target.value as "none"|"weekly");clearFieldError("recurrenceEndDate");}}><option value="none">Nessuna</option><option value="weekly">Ogni settimana</option></Select>{repeat==="weekly"&&<div className="rounded-xl bg-sage-50 p-3 text-sm"><span className="text-slate-500">Giorno della settimana</span><b className="mt-1 block capitalize text-sage-700">{startDate?weekdayName(startDate):"—"}</b></div>}{repeat==="weekly"&&<Field id="appointment-recurrence-end" data-validation-field="recurrenceEndDate" name="recurrenceEndDate" label="Fine ricorrenza" required type="date" min={startDate} error={fieldErrors.recurrenceEndDate} onChange={()=>clearFieldError("recurrenceEndDate")}/>}</>}
      {appointment?.recurrenceSeriesId&&<div className="sm:col-span-2 rounded-xl bg-sage-50 p-3 text-sm text-sage-800">Questo appuntamento fa parte di una serie settimanale. Le modifiche riguardano solo questa occorrenza.</div>}
    </div>
    {serverError&&<p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{serverError}</p>}
    <div className="form-actions mt-6"><button type="button" className="btn btn-quiet" onClick={onDone}>Annulla</button><button disabled={saving} className="btn btn-primary disabled:cursor-wait disabled:opacity-60">{saving?"Salvataggio…":appointment?"Salva modifiche":repeat==="weekly"?"Crea appuntamenti":"Crea appuntamento"}</button></div>
  </form>;
}
