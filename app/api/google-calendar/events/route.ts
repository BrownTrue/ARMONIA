import {NextRequest,NextResponse} from "next/server";
import {deleteGoogleEvent,upsertGoogleEvent} from "@/lib/google-calendar/google-api";
import {googleTokenStore,type GoogleNameFormat} from "@/lib/google-calendar/token-store";
import {authenticatedUserId,supabaseServiceClient} from "@/lib/supabase/server";

type Payload={action:"delete";appointmentId?:string;eventId?:string}|{action:"upsert";appointmentId:string;eventId?:string;title?:string;date?:string;time?:string;duration?:number;reminderMinutes?:number};
const localMode=process.env.NEXT_PUBLIC_DATA_MODE==="local";
const titleFor=(first:string,last:string,format:GoogleNameFormat)=>format==="full"?`Logopedia · ${first} ${last}`.trim():format==="initials"?`Logopedia · ${(first[0]||"").toUpperCase()}.${last?` ${(last[0]||"").toUpperCase()}.`:""}`:`Logopedia · ${first}${last?` ${(last[0]||"").toUpperCase()}.`:""}`;
const romeDateTime=(value:string)=>{const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value)),get=(type:string)=>parts.find(p=>p.type===type)?.value||"";return {date:`${get("year")}-${get("month")}-${get("day")}`,time:`${get("hour")}:${get("minute")}`}};

async function localRequest(userId:string,payload:Payload){
 if(payload.action==="delete"){if(!payload.eventId)throw new Error("ID evento mancante");await deleteGoogleEvent(userId,payload.eventId);return {ok:true}}
 if(!payload.title||!payload.date||!payload.time||!payload.duration||payload.reminderMinutes===undefined)throw new Error("Dati appuntamento non validi");
 const event=await upsertGoogleEvent(userId,{appointmentId:payload.appointmentId,eventId:payload.eventId,title:payload.title,date:payload.date,time:payload.time,duration:payload.duration,reminderMinutes:payload.reminderMinutes});return {ok:true,eventId:event.id};
}

async function cloudRequest(userId:string,payload:Payload){
 const service=supabaseServiceClient();
 if(payload.action==="delete"){
  if(!payload.appointmentId)throw new Error("ID appuntamento mancante");
  const {data:link,error}=await service.from("google_calendar_event_links").select("google_event_id,attempt_count").eq("user_id",userId).eq("appointment_id",payload.appointmentId).maybeSingle();if(error)throw error;if(!link?.google_event_id)return {ok:true};
  await service.from("google_calendar_event_links").update({desired_action:"delete",sync_status:"syncing",attempt_count:(link.attempt_count||0)+1,last_error:null,updated_at:new Date().toISOString()}).eq("user_id",userId).eq("appointment_id",payload.appointmentId);
  try{await deleteGoogleEvent(userId,link.google_event_id);const removed=await service.from("google_calendar_event_links").delete().eq("user_id",userId).eq("appointment_id",payload.appointmentId);if(removed.error)throw removed.error;return {ok:true}}
  catch(error){await service.from("google_calendar_event_links").update({sync_status:"error",last_error:error instanceof Error?error.message:"Eliminazione non riuscita",updated_at:new Date().toISOString()}).eq("user_id",userId).eq("appointment_id",payload.appointmentId);throw error}
 }
 const connection=await googleTokenStore.load(userId);if(!connection||!connection.syncEnabled)throw new Error("Google Calendar non collegato");
 const appointmentResult=await service.from("appointments").select("id,patient_id,starts_at,duration_minutes").eq("id",payload.appointmentId).eq("user_id",userId).maybeSingle();if(appointmentResult.error)throw appointmentResult.error;if(!appointmentResult.data)throw new Error("Appuntamento non trovato");
 const patientResult=await service.from("patients").select("first_name,last_name").eq("id",appointmentResult.data.patient_id).eq("user_id",userId).maybeSingle();if(patientResult.error)throw patientResult.error;if(!patientResult.data)throw new Error("Paziente non trovato");
 const linkResult=await service.from("google_calendar_event_links").select("google_event_id,attempt_count").eq("user_id",userId).eq("appointment_id",payload.appointmentId).maybeSingle();if(linkResult.error)throw linkResult.error;
 const pending=await service.from("google_calendar_event_links").upsert({user_id:userId,appointment_id:payload.appointmentId,google_event_id:linkResult.data?.google_event_id||null,desired_action:"upsert",sync_status:"syncing",attempt_count:(linkResult.data?.attempt_count||0)+1,last_error:null,updated_at:new Date().toISOString()});if(pending.error)throw pending.error;
 const when=romeDateTime(appointmentResult.data.starts_at);
 try{const event=await upsertGoogleEvent(userId,{appointmentId:payload.appointmentId,eventId:linkResult.data?.google_event_id||undefined,title:titleFor(patientResult.data.first_name,patientResult.data.last_name,connection.nameFormat),date:when.date,time:when.time,duration:appointmentResult.data.duration_minutes,reminderMinutes:connection.reminderMinutes});const saved=await service.from("google_calendar_event_links").update({google_event_id:event.id,sync_status:"synced",last_error:null,last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("user_id",userId).eq("appointment_id",payload.appointmentId);if(saved.error)throw saved.error;return {ok:true,eventId:event.id}}
 catch(error){await service.from("google_calendar_event_links").update({sync_status:"error",last_error:error instanceof Error?error.message:"Sincronizzazione non riuscita",updated_at:new Date().toISOString()}).eq("user_id",userId).eq("appointment_id",payload.appointmentId);throw error}
}

export async function POST(request:NextRequest){try{const userId=await authenticatedUserId(),payload=await request.json() as Payload;if(!payload||!['upsert','delete'].includes(payload.action)||!payload.appointmentId&&payload.action==="upsert")return NextResponse.json({error:"Richiesta non valida"},{status:400});return NextResponse.json(localMode?await localRequest(userId,payload):await cloudRequest(userId,payload))}catch(error){console.error("Sincronizzazione Google Calendar:",error);const message=error instanceof Error?error.message:"Sincronizzazione non riuscita";return NextResponse.json({error:message},{status:message.includes("Sessione Supabase")?401:500})}}
