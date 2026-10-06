"use client";
import Link from "next/link";
import {AppShell} from "@/components/app-shell";
import {useData} from "@/components/data-provider";
import {MobileToday} from "@/components/today/mobile-today";
import type {Appointment,AppointmentLocation,Patient} from "@/lib/types";
import {fullName,initials,today} from "@/lib/types";
import {currentRomeTime,deriveTodayDashboard} from "@/lib/today-dashboard";

export default function Today(){
 const {data,ready}=useData();
 const dashboard=deriveTodayDashboard(data.appointments,data.sessions,today(),currentRomeTime());
 const {all:appointments,pending,completed}=dashboard;
 const dateLabel=new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
 return <AppShell>
  <MobileToday data={data} ready={ready} dashboard={dashboard} dateLabel={dateLabel}/>
  <div className="hidden md:contents">
   <header className="mb-4 sm:mb-8"><p className="mb-1 text-xs font-semibold capitalize text-sage-700 sm:mb-2 sm:text-sm">{dateLabel}</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Buongiorno, {data.profile.firstName}</h1><p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">{pending.length===0?completed.length?"Hai completato tutti gli appuntamenti di oggi.":"La giornata è pronta.":`Hai ${pending.length} ${pending.length===1?"seduta":"sedute"} ancora da fare oggi.`}</p></header>
   <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end"><Link href="/calendario" className="btn btn-primary !min-h-10 !px-3 !py-2 text-sm">+ Nuovo appuntamento</Link><Link href="/sedute/nuova" className="btn btn-quiet !min-h-10 !px-3 !py-2 text-sm">Registra seduta</Link></div>
   <section aria-labelledby="today-heading"><div className="mb-3 flex items-center justify-between gap-2"><h2 id="today-heading" className="text-lg font-bold sm:text-xl">Oggi</h2><Link href="/calendario" className="text-sm font-bold text-sage-700">Vedi calendario</Link></div>{!ready?<p className="text-sm text-slate-500">Caricamento…</p>:pending.length===0?<div className="rounded-2xl border border-sage-100 bg-white px-4 py-5 text-center shadow-sm"><p className="font-bold">Nessun appuntamento in programma.</p><p className="mt-1 text-sm text-slate-500">{appointments.length?"Tutte le sedute di oggi sono state registrate.":"Puoi aggiungerne uno dal calendario."}</p></div>:<div className="space-y-2">{pending.map(appointment=><AppointmentCard appointment={appointment} patients={data.patients} locations={data.locations} key={appointment.id}/>)}</div>}</section>
   {ready&&completed.length>0&&<section className="mt-6 sm:mt-9"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold sm:text-xl">Completati oggi</h2><span className="text-sm font-bold text-sage-700">{completed.length}</span></div><div className="space-y-2">{completed.map(appointment=>{const patient=data.patients.find(item=>item.id===appointment.patientId);if(!patient)return null;return <article className="rounded-2xl border border-sage-100 bg-white p-3 opacity-80 shadow-sm" key={appointment.id}><div className="flex items-center gap-3"><time className="w-11 text-sm font-bold text-slate-500">{appointment.time}</time><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-100 text-xs font-bold">{initials(patient)}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold sm:text-base">{fullName(patient)}</h3><p className="text-xs text-sage-700 sm:text-sm">Seduta registrata ✓</p></div><Link href={`/pazienti/${patient.id}`} aria-label={`Apri timeline di ${fullName(patient)}`} className="rounded-lg px-2 py-1 text-sm font-bold text-sage-700 hover:bg-sage-50">Apri</Link></div></article>})}</div></section>}
   <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4" aria-label="Riepilogo attività"><div className="card p-3 sm:p-5"><p className="text-xs text-slate-500 sm:text-sm">Pazienti attivi</p><p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">{data.patients.filter(patient=>patient.status==="active").length}</p></div><div className="card p-3 sm:p-5"><p className="text-xs text-slate-500 sm:text-sm">Sedute registrate</p><p className="mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl">{data.sessions.length}</p></div></section>
  </div>
 </AppShell>;
}

function AppointmentCard({appointment,patients,locations}:{appointment:Appointment;patients:Patient[];locations:AppointmentLocation[]}){
 const patient=patients.find(item=>item.id===appointment.patientId);if(!patient)return null;
 const location=locations.find(item=>item.id===appointment.locationId);
 return <article className="card p-3 sm:p-4"><div className="flex items-start gap-3"><time className="w-11 shrink-0 pt-0.5 text-sm font-bold text-sage-700">{appointment.time}</time><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-100 text-xs font-bold sm:h-10 sm:w-10">{initials(patient)}</div><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{fullName(patient)}</h3>{(appointment.serviceNameSnapshot||location)&&<p className="truncate text-sm text-slate-500">{appointment.serviceNameSnapshot}{appointment.serviceNameSnapshot&&location?" · ":""}{location?.name}</p>}{appointment.notes&&<p className="mt-1 line-clamp-2 text-xs text-[#8b6843]">Da ricordare: {appointment.notes}</p>}<div className="mt-3 flex flex-wrap gap-2"><Link href={`/sedute/nuova?a=${appointment.id}`} className="btn btn-primary !min-h-9 !px-3 !py-1.5 text-xs sm:text-sm">Inizia seduta</Link><Link href={`/pazienti/${patient.id}`} className="btn btn-quiet !min-h-9 !px-3 !py-1.5 text-xs sm:text-sm">Apri paziente</Link></div></div></div></article>;
}
