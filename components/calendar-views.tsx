"use client";
import { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentLocation, Patient } from "@/lib/types";
import { fullName, today } from "@/lib/types";
import { appointmentLocationColor, layoutOverlappingAppointments, monthDayAppointments } from "@/lib/calendar-visual";
import { CalendarEventCard } from "./calendar-event-card";

const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const addDays = (d: Date, n: number) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
export const weekStart = (d: Date) => { const x=new Date(d),day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(12,0,0,0); return x; };
const patientName=(appointment:Appointment,patients:Patient[])=>{const patient=patients.find(item=>item.id===appointment.patientId);return patient?fullName(patient):"Paziente eliminato";};

type CommonProps={appointments:Appointment[];patients:Patient[];locations:AppointmentLocation[];onEdit:(appointment:Appointment)=>void};

export function MonthView({cursor,appointments,patients,locations,onCreate,onEdit}:CommonProps&{cursor:Date;onCreate:(date:string)=>void}) {
  const cells=useMemo(()=>{const first=new Date(cursor.getFullYear(),cursor.getMonth(),1,12),start=addDays(first,-((first.getDay()+6)%7));return Array.from({length:42},(_,index)=>addDays(start,index));},[cursor]);
  const [selectedDate,setSelectedDate]=useState(today());
  useEffect(()=>{const current=today(),sameMonth=current.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}`);setSelectedDate(sameMonth?current:iso(new Date(cursor.getFullYear(),cursor.getMonth(),1,12)));},[cursor]);
  const selected=monthDayAppointments(appointments,selectedDate);
  return <><div className="hidden overflow-x-auto rounded-2xl border border-sage-100/70 bg-white shadow-sm md:block"><div className="min-w-[680px]">
    <div className="grid grid-cols-7 border-b border-sage-100/70 bg-sage-50/50">{days.map(day=><div className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400" key={day}>{day}</div>)}</div>
    <div className="grid grid-cols-7">{cells.map(day=>{const date=iso(day),items=appointments.filter(item=>item.date===date).sort((a,b)=>a.time.localeCompare(b.time)),current=day.getMonth()===cursor.getMonth(),isToday=date===today();return <div role="button" tabIndex={0} aria-label={`Nuovo appuntamento il ${day.toLocaleDateString("it-IT")}`} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")onCreate(date);}} onClick={()=>onCreate(date)} className={`min-h-28 cursor-pointer border-b border-r border-sage-100/60 p-2 text-left transition hover:bg-sage-50/60 sm:min-h-32 ${current?"bg-white":"bg-slate-50/40 text-slate-400"}`} key={date}>
      <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${isToday?"bg-sage-600 text-white shadow-sm":""}`}>{day.getDate()}</span>
      <div className="mt-1 space-y-1">{items.slice(0,3).map(appointment=><CalendarEventCard key={appointment.id} appointment={appointment} patientName={patientName(appointment,patients)} locations={locations} density="compact" className="block w-full px-1.5 py-1 text-[11px]" onClick={event=>{event.stopPropagation();onEdit(appointment);}}/>)}
      {items.length>3&&<button onClick={event=>{event.stopPropagation();onCreate(date);}} className="rounded px-1 text-xs font-bold text-sage-700 focus-visible:ring-2 focus-visible:ring-sage-600">+{items.length-3} altri</button>}</div>
    </div>;})}</div>
  </div></div>
  <div className="overflow-hidden rounded-2xl border border-sage-100/70 bg-white shadow-sm md:hidden">
    <div className="grid grid-cols-7 border-b border-sage-100/70 bg-sage-50/50">{days.map(day=><div className="py-2 text-center text-[10px] font-bold uppercase text-slate-400" key={day}>{day[0]}</div>)}</div>
    <div className="grid grid-cols-7">{cells.map(day=>{const date=iso(day),summary=monthDayAppointments(appointments,date),isToday=date===today(),isSelected=date===selectedDate,current=day.getMonth()===cursor.getMonth();return <button type="button" aria-label={`${day.toLocaleDateString("it-IT")}, ${summary.all.length} appuntamenti`} aria-pressed={isSelected} onClick={()=>setSelectedDate(date)} className={`relative min-h-14 border-b border-r border-sage-100/60 px-1 py-1.5 text-center outline-none focus-visible:z-10 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-700 ${current?"bg-white":"bg-slate-50/50 text-slate-400"} ${isSelected?"bg-sage-50 shadow-[inset_0_0_0_2px_#77A886]":""}`} key={date}>
      <span className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${isToday?"bg-sage-600 text-white":""}`}>{day.getDate()}</span>
      <span className="mt-1 flex h-2 items-center justify-center gap-0.5">{summary.visible.map(item=>{const color=appointmentLocationColor(item,locations);return <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{backgroundColor:color}} key={item.id}/>;})}{summary.hiddenCount>0&&<small className="text-[8px] font-bold text-slate-500">+{summary.hiddenCount}</small>}</span>
    </button>;})}</div>
  </div>
  <section className="mt-3 rounded-2xl border border-sage-100 bg-white p-3 shadow-sm md:hidden" aria-live="polite"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold capitalize">{new Date(selectedDate+"T12:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</h3><button className="text-xs font-bold text-sage-700" onClick={()=>onCreate(selectedDate)}>+ Nuovo</button></div>{selected.all.length?<div className="space-y-2">{selected.all.map(item=><CalendarEventCard key={item.id} appointment={item} patientName={patientName(item,patients)} locations={locations} density="agenda" className="w-full px-3 py-2 text-xs" onClick={()=>onEdit(item)}/>)}</div>:<p className="py-2 text-sm text-slate-500">Nessun appuntamento.</p>}</section></>;
}

export function WeekView({cursor,appointments,patients,locations,onCreate,onEdit}:CommonProps&{cursor:Date;onCreate:(date:string,time:string)=>void}) {
  const start=weekStart(cursor),week=Array.from({length:7},(_,index)=>addDays(start,index)),hourHeight=64,hours=Array.from({length:13},(_,index)=>index+8);
  return <div className="snap-x snap-mandatory overflow-x-auto rounded-2xl border border-sage-100/70 bg-white shadow-sm"><div className="min-w-[780px] md:min-w-[900px]">
    <div className="grid grid-cols-[48px_repeat(7,minmax(104px,1fr))] border-b border-sage-100/70 md:grid-cols-[64px_repeat(7,1fr)]"><div/>{week.map((day,index)=><div className={`snap-start p-2 text-center md:p-3 ${iso(day)===today()?"bg-sage-50/60":""}`} key={iso(day)}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{days[index]}</p><p className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full font-bold ${iso(day)===today()?"bg-sage-600 text-white shadow-sm":""}`}>{day.getDate()}</p></div>)}</div>
    <div className="grid grid-cols-[48px_repeat(7,minmax(104px,1fr))] md:grid-cols-[64px_repeat(7,1fr)]"><div className="relative border-r border-sage-100/70" style={{height:12*hourHeight}}>{hours.slice(0,-1).map((hour,index)=><span className="absolute right-1 -translate-y-2 text-[10px] text-slate-400 md:right-2 md:text-xs" style={{top:index*hourHeight}} key={hour}>{String(hour).padStart(2,"0")}:00</span>)}</div>
    {week.map(day=>{const date=iso(day),positioned=layoutOverlappingAppointments(appointments.filter(item=>item.date===date));return <div role="button" tabIndex={0} aria-label={`Nuovo appuntamento ${day.toLocaleDateString("it-IT")}`} onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")onCreate(date,"09:00");}} onClick={event=>{const rect=event.currentTarget.getBoundingClientRect(),mins=Math.max(0,Math.min(719,Math.round((((event.clientY-rect.top)/hourHeight)*60)/15)*15));onCreate(date,`${String(8+Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`);}} className={`relative cursor-crosshair border-r border-sage-100/60 ${date===today()?"bg-sage-50/30":""}`} style={{height:12*hourHeight,backgroundImage:"repeating-linear-gradient(to bottom, transparent 0, transparent 63px, rgba(119,168,134,.16) 64px)"}} key={date}>
      {positioned.map(({appointment,column,columnCount})=>{const [hour,minute]=appointment.time.split(":").map(Number),top=(((hour-8)*60+minute)/60)*hourHeight;if(top<0||top>=12*hourHeight)return null;const gap=3,width=`calc(${100/columnCount}% - ${gap+1}px)`,left=`calc(${column*(100/columnCount)}% + ${column?gap:2}px)`,density=columnCount>=3?"very-compact":appointment.duration>=45?"timed":"compact";return <CalendarEventCard key={appointment.id} appointment={appointment} patientName={patientName(appointment,patients)} locations={locations} density={density} className="absolute z-10 px-1.5 py-1 text-[11px] md:px-2 md:text-xs" style={{top,height:Math.max(30,(appointment.duration/60)*hourHeight),width,left}} onClick={event=>{event.stopPropagation();onEdit(appointment);}}/>;})}
    </div>;})}</div>
  </div></div>;
}
