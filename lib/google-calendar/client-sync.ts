"use client";
import type { Appointment, Patient } from "@/lib/types";

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
export function queueAllGoogleAppointments(appointments:Appointment[],patients:Patient[]){if(!getGoogleCalendarPreferences().enabled)return;for(const appointment of appointments){const patient=patients.find(item=>item.id===appointment.patientId);if(patient)replaceOperation({key:appointment.id,action:"upsert",appointment,patient})}void flushGoogleCalendarQueue()}

export async function flushGoogleCalendarQueue(){if(running||!getGoogleCalendarPreferences().enabled)return;running=true;write(STATE_KEY,{...read(STATE_KEY,{}),error:undefined});announce();try{while(true){const operation=read<Operation[]>(QUEUE_KEY,[])[0];if(!operation)break;const mapping=read<Record<string,string>>(MAPPING_KEY,{}),preferences=getGoogleCalendarPreferences();if(operation.action==="delete"&&!cloudMode&&!mapping[operation.appointmentId]){write(QUEUE_KEY,read<Operation[]>(QUEUE_KEY,[]).filter(item=>item.id!==operation.id));announce();continue}const body=operation.action==="delete"?{action:"delete",appointmentId:operation.appointmentId,eventId:mapping[operation.appointmentId]}:{action:"upsert",appointmentId:operation.appointment.id,eventId:mapping[operation.appointment.id],title:titleFor(operation.patient,preferences.nameFormat),date:operation.appointment.date,time:operation.appointment.time,duration:operation.appointment.duration,reminderMinutes:preferences.reminderMinutes};const response=await fetch("/api/google-calendar/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await response.json() as {eventId?:string;error?:string};if(!response.ok)throw new Error(result.error||"Sincronizzazione Google non riuscita");if(operation.action==="delete")delete mapping[operation.appointmentId];else if(result.eventId)mapping[operation.appointment.id]=result.eventId;write(MAPPING_KEY,mapping);write(QUEUE_KEY,read<Operation[]>(QUEUE_KEY,[]).filter(item=>item.id!==operation.id));write(STATE_KEY,{lastSyncedAt:new Date().toISOString()});announce()}}catch(error){write(STATE_KEY,{...read(STATE_KEY,{}),error:error instanceof Error?error.message:"Errore di sincronizzazione"})}finally{running=false;announce()}}
export function clearGoogleCalendarLocalState(){write(PREFS_KEY,{...getGoogleCalendarPreferences(),enabled:false});storage()?.removeItem(QUEUE_KEY);storage()?.removeItem(MAPPING_KEY);storage()?.removeItem(STATE_KEY);announce()}
