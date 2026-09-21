"use client";
import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {useData} from "@/components/data-provider";
import type {Appointment,Patient} from "@/lib/types";
import {age,fullName,initials,today} from "@/lib/types";
import {partitionTodayAppointments} from "@/lib/today-dashboard";

export default function Today(){
 const {data,ready}=useData();
 const {all:appointments,pending,completed}=partitionTodayAppointments(data.appointments,data.sessions,today());
 return <AppShell>
  <header className="mb-8">
   <p className="mb-2 text-sm font-semibold text-sage-700">{new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</p>
   <h1 className="text-3xl font-bold tracking-tight">Buongiorno, {data.profile.firstName}</h1>
   <p className="mt-2 text-slate-500">{pending.length===0?completed.length?"Hai completato tutti gli appuntamenti di oggi.":"Non hai appuntamenti in programma oggi.":`Hai ${pending.length} ${pending.length===1?"seduta":"sedute"} ancora da fare oggi.`}</p>
  </header>
  <section className="mb-7 grid gap-4 sm:grid-cols-3">
   <div className="card p-5 text-ink transition-shadow hover:shadow-soft"><p className="text-sm text-slate-500">Da fare oggi</p><p className="mt-2 text-3xl font-bold text-ink">{pending.length}</p><p className="mt-3 text-sm text-slate-500">{pending[0]?`La prossima è alle ${pending[0].time}`:completed.length?"Tutto completato":"Giornata libera"}</p></div>
   <div className="card p-5"><p className="text-sm text-slate-500">Pazienti attivi</p><p className="mt-2 text-3xl font-bold">{data.patients.filter(p=>p.status==="active").length}</p></div>
   <div className="card p-5"><p className="text-sm text-slate-500">Sedute registrate</p><p className="mt-2 text-3xl font-bold">{data.sessions.length}</p></div>
  </section>
  <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Da fare oggi</h2><Link href="/calendario" className="text-sm font-bold text-sage-700">Vedi calendario</Link></div>
  {!ready?<p>Caricamento…</p>:pending.length===0?<div className="card p-10 text-center text-slate-500">{appointments.length?"Tutti gli appuntamenti di oggi hanno una seduta registrata.":"Nessun appuntamento oggi. Puoi aggiungerne uno dal calendario."}</div>:<div className="space-y-4">{pending.map(appointment=><AppointmentCard appointment={appointment} patients={data.patients} sessions={data.sessions} goals={data.goals} key={appointment.id}/>)}</div>}
  {ready&&completed.length>0&&<section className="mt-9"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Completati oggi</h2><span className="text-sm font-bold text-sage-700">{completed.length}</span></div><div className="space-y-3">{completed.map(appointment=>{const patient=data.patients.find(item=>item.id===appointment.patientId);if(!patient)return null;return <article className="card p-4 opacity-80" key={appointment.id}><div className="flex flex-wrap items-center gap-4"><time className="w-12 text-sm font-bold text-slate-500">{appointment.time}</time><div className="grid h-10 w-10 place-items-center rounded-xl bg-sage-100 text-sm font-bold">{initials(patient)}</div><div className="min-w-0 flex-1"><h3 className="font-bold">{fullName(patient)}</h3><p className="text-sm text-sage-700">Seduta registrata ✓</p></div><Link href={`/pazienti/${patient.id}`} className="btn btn-quiet text-sm">Apri timeline</Link></div></article>})}</div></section>}
 </AppShell>
}

function AppointmentCard({appointment,patients,sessions,goals}:{appointment:Appointment;patients:Patient[];sessions:ReturnType<typeof useData>["data"]["sessions"];goals:ReturnType<typeof useData>["data"]["goals"]}){
 const patient=patients.find(item=>item.id===appointment.patientId);if(!patient)return null;
 const last=sessions.filter(session=>session.patientId===patient.id).sort((a,b)=>(b.date+b.createdAt).localeCompare(a.date+a.createdAt))[0];
 const goal=goals.find(item=>item.patientId===patient.id&&item.status!=="achieved");
 return <article className="card p-4 sm:p-5"><div className="flex gap-4"><time className="w-12 shrink-0 pt-1 text-sm font-bold text-sage-700">{appointment.time}</time><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-100 font-bold">{initials(patient)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{fullName(patient)}</h3><span className="text-sm text-slate-500">{age(patient.birthDate)||"—"} anni</span></div><p className="mt-1 text-sm font-medium text-sage-700">{goal?.title||patient.referralReason}</p><p className="mt-2 text-sm text-slate-500">{last?`Ultima seduta: ${last.result||last.activities}`:"Nessuna seduta precedente"}</p>{appointment.notes&&<p className="mt-2 rounded-lg bg-[#fff8ed] px-3 py-2 text-sm text-[#8b6843]">Da ricordare: {appointment.notes}</p>}<div className="mt-4 flex gap-2"><Link href={`/pazienti/${patient.id}`} className="btn btn-quiet text-sm">Apri paziente</Link><Link href={`/sedute/nuova?a=${appointment.id}`} className="btn btn-primary text-sm">Inizia seduta</Link></div></div></div></article>
}
