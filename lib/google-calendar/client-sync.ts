"use client";
import type { Appointment, Patient } from "@/lib/types";
import {processQueueSnapshot,reconcileStaleUpserts} from "@/lib/google-calendar/sync-queue";

export type GoogleNameFormat = "first_initial" | "full" | "initials";
export type GoogleCalendarPreferences = { enabled:boolean; nameFormat:GoogleNameFormat; reminderMinutes:number };
export type GoogleSyncState = { pending:number; syncing:boolean; lastSyncedAt?:string; error?:string };
type Operation =
  | { id:string; key:string; action:"upsert"; appointment:Appointment; patient:Pick<Patient,"firstName"|"lastName"> }
  | { id:string; key:string; action:"delete"; appointmentId:string };
type PendingOperation =
  | { key:string; action:"upsert"; appointment:Appointment; patient:Pick<Patient,"firstName"|"lastName"> }
  | { key:string; action:"delete"; appointmentId:string };

const PREFS_KEY="armonia-google-calendar-preferences-v1",QUEUE_KEY="armonia-google-calendar-queue-v1",MAPPING_KEY="armonia-google-calendar-events-v1",STATE_KEY="armonia-google-calendar-state-v1",EVENT="armonia-google-calendar-state";
const cloudMode=process.env.NEXT_PUBLIC_DATA_MODE!=="local";
const defaults:GoogleCalendarPreferences={enabled:false,nameFormat:"first_initial",reminderMinutes:30};
let running=false;
const storage=()=>typeof window==="undefined"?null:window.localStorage;
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(storage()?.getItem(key)||"") as T}catch{return fallback}};
const write=(key:string,value:unknown)=>storage()?.setItem(key,JSON.stringify(value));
const announce=()=>window.dispatchEvent(new Event(EVENT));

export function getGoogleCalendarPreferences(){return {...defaults,...read<Partial<GoogleCalendarPreferences>>(PREFS_KEY,{})}}
export function saveGoogleCalendarPreferences(value:GoogleCalendarPreferences){write(PREFS_KEY,value);announce()}
export async function persistGoogleCalendarPreferences(value:GoogleCalendarPreferences){saveGoogleCalendarPreferences(value);if(cloudMode){const response=await fetch("/api/google-calendar/preferences",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});if(!response.ok){const result=await response.json() as {error?:string};throw new Error(result.error||"Salvataggio preferenze non riuscito")}}}
export function getGoogleSyncState():GoogleSyncState{const state=read<Omit<GoogleSyncState,"pending"|"syncing">>(STATE_KEY,{});return {...state,pending:read<Operation[]>(QUEUE_KEY,[]).length,syncing:running}}
export function subscribeGoogleSync(listener:()=>void){window.addEventListener(EVENT,listener);window.addEventListener("storage",listener);return()=>{window.removeEventListener(EVENT,listener);window.removeEventListener("storage",listener)}}

function titleFor(patient:Pick<Patient,"firstName"|"lastName">,format:GoogleNameFormat){const first=patient.firstName.trim(),last=patient.lastName.trim();if(format==="full")return `Logopedia · ${first} ${last}`.trim();if(format==="initials")return `Logopedia · ${(first[0]||"").toUpperCase()}.${last?` ${(last[0]||"").toUpperCase()}.`:""}`;return `Logopedia · ${first}${last?` ${(last[0]||"").toUpperCase()}.`:""}`}
function replaceOperation(operation:PendingOperation){const queue=read<Operation[]>(QUEUE_KEY,[]).filter(item=>item.key!==operation.key);queue.push({...operation,id:crypto.randomUUID()});write(QUEUE_KEY,queue);announce()}

export function queueGoogleUpsert(appointment:Appointment,patient:Pick<Patient,"firstName"|"lastName">){if(!getGoogleCalendarPreferences().enabled)return;replaceOperation({key:appointment.id,action:"upsert",appointment,patient});void flushGoogleCalendarQueue()}
export function queueGoogleDelete(appointmentId:string){const mapped=Boolean(read<Record<string,string>>(MAPPING_KEY,{})[appointmentId]),queued=read<Operation[]>(QUEUE_KEY,[]).some(item=>item.key===appointmentId);if(!cloudMode&&!mapped&&!queued)return;replaceOperation({key:appointmentId,action:"delete",appointmentId});void flushGoogleCalendarQueue()}
export function queueAllGoogleAppointments(appointments:Appointment[],patients:Patient[]){
 if(!getGoogleCalendarPreferences().enabled)return;
 const appointmentIds=new Set(appointments.map(item=>item.id));
 const reconciled=reconcileStaleUpserts(read<Operation[]>(QUEUE_KEY,[]),appointmentIds,item=>item.action==="upsert"?item.appointment.id:item.appointmentId,(item,appointmentId):Operation=>({id:item.id,key:item.key,action:"delete",appointmentId}));
 write(QUEUE_KEY,reconciled);
 for(const appointment of appointments){
  const queuedDelete=read<Operation[]>(QUEUE_KEY,[]).some(item=>item.key===appointment.id&&item.action==="delete");
  if(queuedDelete)continue;
  const patient=patients.find(item=>item.id===appointment.patientId);
  if(patient)replaceOperation({key:appointment.id,action:"upsert",appointment,patient});
 }
 announce();
 void flushGoogleCalendarQueue();
}

export async function flushGoogleCalendarQueue(){
 if(running||!getGoogleCalendarPreferences().enabled)return;
 running=true;
 const previousState=read<Omit<GoogleSyncState,"pending"|"syncing">>(STATE_KEY,{});
 write(STATE_KEY,{...previousState,error:undefined});
 announce();
 let completed=false;
 try{
  const initial=read<Operation[]>(QUEUE_KEY,[]);
  const errors=await processQueueSnapshot(initial,id=>read<Operation[]>(QUEUE_KEY,[]).find(item=>item.id===id),async operation=>{
   const mapping=read<Record<string,string>>(MAPPING_KEY,{}),preferences=getGoogleCalendarPreferences();
   if(operation.action==="delete"&&!cloudMode&&!mapping[operation.appointmentId]){
    write(QUEUE_KEY,read<Operation[]>(QUEUE_KEY,[]).filter(item=>item.id!==operation.id));
    announce();
    completed=true;
    return;
   }
   const body=operation.action==="delete"?{action:"delete",appointmentId:operation.appointmentId,eventId:mapping[operation.appointmentId]}:{action:"upsert",appointmentId:operation.appointment.id,eventId:mapping[operation.appointment.id],title:titleFor(operation.patient,preferences.nameFormat),date:operation.appointment.date,time:operation.appointment.time,duration:operation.appointment.duration,reminderMinutes:preferences.reminderMinutes};
   const response=await fetch("/api/google-calendar/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const result=await response.json() as {eventId?:string;error?:string;errorType?:string};
   if(!response.ok){const error=new Error(result.error||"Sincronizzazione Google non riuscita");Object.assign(error,{errorType:result.errorType});throw error}
   if(operation.action==="delete")delete mapping[operation.appointmentId];else if(result.eventId)mapping[operation.appointment.id]=result.eventId;
   write(MAPPING_KEY,mapping);
   write(QUEUE_KEY,read<Operation[]>(QUEUE_KEY,[]).filter(item=>item.id!==operation.id));
   completed=true;
   announce();
  },error=>(error as Error&{errorType?:string}).errorType==="google_oauth");
  const nextState:Omit<GoogleSyncState,"pending"|"syncing">={...previousState};
  if(completed)nextState.lastSyncedAt=new Date().toISOString();
  const pending=read<Operation[]>(QUEUE_KEY,[]).length;
  if(errors.length)nextState.error=pending>1?`${pending} modifiche non sincronizzate. ${errors[0].message}`:errors[0].message;
  else delete nextState.error;
  write(STATE_KEY,nextState);
 }finally{
  running=false;
  announce();
 }
}
export function clearGoogleCalendarLocalState(){write(PREFS_KEY,{...getGoogleCalendarPreferences(),enabled:false});storage()?.removeItem(QUEUE_KEY);storage()?.removeItem(MAPPING_KEY);storage()?.removeItem(STATE_KEY);announce()}
