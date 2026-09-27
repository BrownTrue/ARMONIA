import type {SupabaseClient,User} from "@supabase/supabase-js";
import type {AppData,Appointment,AppointmentLocation,AppointmentService,Goal,Material,Patient,Profile,Session} from "../types.ts";
import {loadCloudClinicalData} from "./clinical-repository.ts";

const splitDate=(value:string)=>{const d=new Date(value);return {date:d.toLocaleDateString("sv-SE"),time:d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit",hour12:false})}};
const joinDate=(date:string,time:string)=>new Date(`${date}T${time}:00`).toISOString();
const check=<T extends {error:unknown}>(result:T)=>{if(result.error)throw result.error;return result};

export async function loadCloudData(client:SupabaseClient,user:User):Promise<AppData>{
  const [profiles,patients,appointments,locations,services,sessions,goals,materials,patientMaterials,sessionMaterials,sessionGoals,clinical]=await Promise.all([
    client.from("profiles").select("*").eq("id",user.id).maybeSingle(),
    client.from("patients").select("*").order("created_at",{ascending:false}),
    client.from("appointments").select("*").order("starts_at"),
    client.from("appointment_locations").select("*").eq("user_id",user.id).order("display_order").order("name"),
    client.from("appointment_services").select("*").eq("user_id",user.id).order("display_order").order("name"),
    client.from("sessions").select("*").order("occurred_at",{ascending:false}),
    client.from("goals").select("*").order("created_at",{ascending:false}),
    client.from("materials").select("*").order("created_at",{ascending:false}),
    client.from("patient_materials").select("patient_id,material_id"),
    client.from("session_materials").select("session_id,material_id"),
    client.from("session_goals").select("session_id,goal_id"),
    loadCloudClinicalData(client,user.id),
  ]);
  [profiles,patients,appointments,locations,services,sessions,goals,materials,patientMaterials,sessionMaterials,sessionGoals].forEach(check);
  const profileRow=profiles.data;
  const profile:Profile={firstName:profileRow?.first_name||"",lastName:profileRow?.last_name||"",profession:profileRow?.profession||"Logopedista",email:profileRow?.email||user.email||"",studio:profileRow?.studio||""};
  return {
    profile,
    patients:(patients.data||[]).map((p):Patient=>({id:p.id,firstName:p.first_name,lastName:p.last_name,birthDate:p.birth_date||"",contact:p.phone||"",guardian:p.guardian_name||"",school:p.school||"",schoolClass:p.school_class||"",referralReason:p.referral_reason||"",notes:p.notes||"",status:p.status,createdAt:p.created_at})),
    appointments:(appointments.data||[]).map(appointmentFromRow),
    locations:(locations.data||[]).map(appointmentLocationFromRow),
    services:(services.data||[]).map(appointmentServiceFromRow),
    sessions:(sessions.data||[]).map((s):Session=>sessionFromRow(s,(sessionGoals.data||[]).filter(x=>x.session_id===s.id).map(x=>x.goal_id),(sessionMaterials.data||[]).filter(x=>x.session_id===s.id).map(x=>x.material_id))),
    goals:(goals.data||[]).map(goalFromRow),
    materials:(materials.data||[]).map((m):Material=>({id:m.id,title:m.title,description:m.description||"",category:m.category||"altro",tags:m.tags||[],fileName:m.file_name||"",storagePath:m.storage_path||undefined,mimeType:m.mime_type||"",size:Number(m.file_size||0),externalUrl:m.external_url||undefined,favorite:m.is_favorite||false,patientIds:(patientMaterials.data||[]).filter(x=>x.material_id===m.id).map(x=>x.patient_id),createdAt:m.created_at})),
    clinicalPathways:clinical.clinicalPathways,
    clinicalAssessments:clinical.clinicalAssessments,
  };
}

export const patientRow=(p:Patient,userId:string)=>({id:p.id,user_id:userId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,phone:p.contact||null,guardian_name:p.guardian||null,school:p.school||null,school_class:p.schoolClass||null,referral_reason:p.referralReason||null,notes:p.notes||null,status:p.status,updated_at:new Date().toISOString()});
export const appointmentFromRow=(a:{id:string;patient_id:string;starts_at:string;duration_minutes:number;type:Appointment["type"];notes?:string|null;recurrence_series_id?:string|null;location_id?:string|null;service_id?:string|null;location_name_snapshot?:string|null;service_name_snapshot?:string|null;effective_price_cents?:number|null;created_at:string}):Appointment=>{const d=splitDate(a.starts_at);return {id:a.id,patientId:a.patient_id,date:d.date,time:d.time,duration:a.duration_minutes,type:a.type,notes:a.notes||"",recurrenceSeriesId:a.recurrence_series_id||undefined,locationId:a.location_id||undefined,serviceId:a.service_id||undefined,locationNameSnapshot:a.location_name_snapshot||undefined,serviceNameSnapshot:a.service_name_snapshot||undefined,effectivePriceCents:a.effective_price_cents??undefined,createdAt:a.created_at}};
export const appointmentRow=(a:Appointment,userId:string)=>({id:a.id,user_id:userId,patient_id:a.patientId,starts_at:joinDate(a.date,a.time),duration_minutes:a.duration,type:a.type,notes:a.notes||null,recurrence_series_id:a.recurrenceSeriesId||null,location_id:a.locationId||null,service_id:a.serviceId||null,location_name_snapshot:a.locationNameSnapshot||null,service_name_snapshot:a.serviceNameSnapshot||null,effective_price_cents:a.effectivePriceCents??null,updated_at:new Date().toISOString()});
export const appointmentLocationFromRow=(row:{id:string;name:string;color:string;address?:string|null;city?:string|null;is_active:boolean;display_order:number;created_at:string;updated_at:string}):AppointmentLocation=>({id:row.id,name:row.name,color:row.color,address:row.address||"",city:row.city||"",isActive:row.is_active,displayOrder:row.display_order,createdAt:row.created_at,updatedAt:row.updated_at});
export const appointmentLocationRow=(location:AppointmentLocation,userId:string)=>({id:location.id,user_id:userId,name:location.name.trim(),color:location.color,address:location.address.trim()||null,city:location.city.trim()||null,is_active:location.isActive,display_order:location.displayOrder,created_at:location.createdAt,updated_at:location.updatedAt});
export const appointmentServiceFromRow=(row:{id:string;name:string;description?:string|null;default_duration_minutes:number;default_price_cents?:number|null;is_active:boolean;display_order:number;created_at:string;updated_at:string}):AppointmentService=>({id:row.id,name:row.name,description:row.description||"",defaultDurationMinutes:row.default_duration_minutes,defaultPriceCents:row.default_price_cents??undefined,isActive:row.is_active,displayOrder:row.display_order,createdAt:row.created_at,updatedAt:row.updated_at});
export const appointmentServiceRow=(service:AppointmentService,userId:string)=>({id:service.id,user_id:userId,name:service.name.trim(),description:service.description.trim()||null,default_duration_minutes:service.defaultDurationMinutes,default_price_cents:service.defaultPriceCents??null,is_active:service.isActive,display_order:service.displayOrder,created_at:service.createdAt,updated_at:service.updatedAt});
export async function saveAppointmentLocation(client:SupabaseClient,userId:string,location:AppointmentLocation){check(await client.from("appointment_locations").upsert(appointmentLocationRow(location,userId)).select("id").single())}
export async function deleteAppointmentLocation(client:SupabaseClient,userId:string,id:string){check(await client.from("appointment_locations").delete().eq("id",id).eq("user_id",userId).select("id").single())}
export async function saveAppointmentService(client:SupabaseClient,userId:string,service:AppointmentService){check(await client.from("appointment_services").upsert(appointmentServiceRow(service,userId)).select("id").single())}
export async function deleteAppointmentService(client:SupabaseClient,userId:string,id:string){check(await client.from("appointment_services").delete().eq("id",id).eq("user_id",userId).select("id").single())}
export const sessionFromRow=(s:{id:string;patient_id:string;appointment_id?:string|null;service_id?:string|null;service_name_snapshot?:string|null;effective_price_cents?:number|null;occurred_at:string;duration_minutes?:number|null;activities?:string|null;patient_response?:string|null;help_level?:string|null;result?:string|null;next_session_plan?:string|null;homework?:string|null;notes?:string|null;created_at:string},goalIds:string[]=[],materialIds:string[]=[]):Session=>({id:s.id,patientId:s.patient_id,appointmentId:s.appointment_id||undefined,serviceId:s.service_id||undefined,serviceNameSnapshot:s.service_name_snapshot||undefined,effectivePriceCents:s.effective_price_cents??undefined,date:splitDate(s.occurred_at).date,duration:s.duration_minutes||45,goalIds,activities:s.activities||"",response:s.patient_response||"",helpLevel:s.help_level||"",result:s.result||"",nextPlan:s.next_session_plan||"",homework:s.homework||"",notes:s.notes||"",materialIds,createdAt:s.created_at});
export const sessionRow=(s:Session,userId:string)=>({id:s.id,user_id:userId,patient_id:s.patientId,appointment_id:s.appointmentId||null,service_id:s.serviceId||null,service_name_snapshot:s.serviceNameSnapshot||null,effective_price_cents:s.effectivePriceCents??null,occurred_at:joinDate(s.date,"12:00"),duration_minutes:s.duration,activities:s.activities||null,patient_response:s.response||null,help_level:s.helpLevel||null,result:s.result||null,next_session_plan:s.nextPlan||null,homework:s.homework||null,notes:s.notes||null,updated_at:new Date().toISOString()});
export const goalFromRow=(g:{id:string;patient_id:string;clinical_pathway_id?:string|null;title:string;description?:string|null;priority?:number|null;status:string;progress?:number|null;created_at:string}):Goal=>({id:g.id,patientId:g.patient_id,clinicalPathwayId:g.clinical_pathway_id||undefined,title:g.title,description:g.description||"",priority:g.priority||2,status:g.status,progress:g.progress||0,createdAt:g.created_at});
export const goalRow=(g:Goal,userId:string)=>({id:g.id,user_id:userId,patient_id:g.patientId,clinical_pathway_id:g.clinicalPathwayId||null,title:g.title,description:g.description||null,priority:g.priority,status:g.status,progress:g.progress,updated_at:new Date().toISOString()});
export const profileRow=(p:Profile,userId:string)=>({id:userId,full_name:`${p.firstName} ${p.lastName}`.trim(),first_name:p.firstName,last_name:p.lastName,profession:p.profession,email:p.email,studio:p.studio,updated_at:new Date().toISOString()});
export const materialRow=(m:Material,userId:string)=>({id:m.id,user_id:userId,title:m.title,description:m.description||null,category:m.category,tags:m.tags,file_name:m.fileName||null,storage_path:m.storagePath||null,mime_type:m.mimeType||null,file_size:m.size||null,external_url:m.externalUrl||null,is_favorite:m.favorite,updated_at:new Date().toISOString()});
export async function replaceLinks(client:SupabaseClient,table:"patient_materials"|"session_materials",ownerKey:"material_id"|"session_id",ownerId:string,linkKey:"patient_id"|"material_id",ids:string[]){check(await client.from(table).delete().eq(ownerKey,ownerId));if(ids.length)check(await client.from(table).insert(ids.map(id=>({[ownerKey]:ownerId,[linkKey]:id}))));}
export async function signedFileBlob(client:SupabaseClient,path:string){const result=check(await client.storage.from("therapy-materials").createSignedUrl(path,300));if(!result.data)throw new Error("Impossibile creare il link sicuro al file");const response=await fetch(result.data.signedUrl);if(!response.ok)throw new Error("Impossibile aprire il file privato");return response.blob();}
