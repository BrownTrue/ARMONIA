import type {SupabaseClient,User} from "@supabase/supabase-js";
import type {AppData,Appointment,Goal,Material,Patient,Profile,Session} from "@/lib/types";

const splitDate=(value:string)=>{const d=new Date(value);return {date:d.toLocaleDateString("sv-SE"),time:d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit",hour12:false})}};
const joinDate=(date:string,time:string)=>new Date(`${date}T${time}:00`).toISOString();
const check=<T extends {error:unknown}>(result:T)=>{if(result.error)throw result.error;return result};

export async function loadCloudData(client:SupabaseClient,user:User):Promise<AppData>{
  const [profiles,patients,appointments,sessions,goals,materials,patientMaterials,sessionMaterials,sessionGoals]=await Promise.all([
    client.from("profiles").select("*").eq("id",user.id).maybeSingle(),
    client.from("patients").select("*").order("created_at",{ascending:false}),
    client.from("appointments").select("*").order("starts_at"),
    client.from("sessions").select("*").order("occurred_at",{ascending:false}),
    client.from("goals").select("*").order("created_at",{ascending:false}),
    client.from("materials").select("*").order("created_at",{ascending:false}),
    client.from("patient_materials").select("patient_id,material_id"),
    client.from("session_materials").select("session_id,material_id"),
    client.from("session_goals").select("session_id,goal_id"),
  ]);
  [profiles,patients,appointments,sessions,goals,materials,patientMaterials,sessionMaterials,sessionGoals].forEach(check);
  const profileRow=profiles.data;
  const profile:Profile={firstName:profileRow?.first_name||"",lastName:profileRow?.last_name||"",profession:profileRow?.profession||"Logopedista",email:profileRow?.email||user.email||"",studio:profileRow?.studio||""};
  return {
    profile,
    patients:(patients.data||[]).map((p):Patient=>({id:p.id,firstName:p.first_name,lastName:p.last_name,birthDate:p.birth_date||"",contact:p.phone||"",guardian:p.guardian_name||"",school:p.school||"",schoolClass:p.school_class||"",referralReason:p.referral_reason||"",notes:p.notes||"",status:p.status,createdAt:p.created_at})),
    appointments:(appointments.data||[]).map((a):Appointment=>{const d=splitDate(a.starts_at);return {id:a.id,patientId:a.patient_id,date:d.date,time:d.time,duration:a.duration_minutes,type:a.type,notes:a.notes||"",createdAt:a.created_at}}),
    sessions:(sessions.data||[]).map((s):Session=>({id:s.id,patientId:s.patient_id,date:splitDate(s.occurred_at).date,duration:s.duration_minutes||45,goalIds:(sessionGoals.data||[]).filter(x=>x.session_id===s.id).map(x=>x.goal_id),activities:s.activities||"",response:s.patient_response||"",helpLevel:s.help_level||"",result:s.result||"",nextPlan:s.next_session_plan||"",homework:s.homework||"",notes:s.notes||"",materialIds:(sessionMaterials.data||[]).filter(x=>x.session_id===s.id).map(x=>x.material_id),createdAt:s.created_at})),
    goals:(goals.data||[]).map((g):Goal=>({id:g.id,patientId:g.patient_id,title:g.title,description:g.description||"",priority:g.priority||2,status:g.status,progress:g.progress||0,createdAt:g.created_at})),
    materials:(materials.data||[]).map((m):Material=>({id:m.id,title:m.title,description:m.description||"",category:m.category||"altro",tags:m.tags||[],fileName:m.file_name||"",storagePath:m.storage_path||undefined,mimeType:m.mime_type||"",size:Number(m.file_size||0),externalUrl:m.external_url||undefined,favorite:m.is_favorite||false,patientIds:(patientMaterials.data||[]).filter(x=>x.material_id===m.id).map(x=>x.patient_id),createdAt:m.created_at})),
  };
}

export const patientRow=(p:Patient,userId:string)=>({id:p.id,user_id:userId,first_name:p.firstName,last_name:p.lastName,birth_date:p.birthDate||null,phone:p.contact||null,guardian_name:p.guardian||null,school:p.school||null,school_class:p.schoolClass||null,referral_reason:p.referralReason||null,notes:p.notes||null,status:p.status,updated_at:new Date().toISOString()});
export const appointmentRow=(a:Appointment,userId:string)=>({id:a.id,user_id:userId,patient_id:a.patientId,starts_at:joinDate(a.date,a.time),duration_minutes:a.duration,type:a.type,notes:a.notes||null,updated_at:new Date().toISOString()});
export const sessionRow=(s:Session,userId:string)=>({id:s.id,user_id:userId,patient_id:s.patientId,occurred_at:joinDate(s.date,"12:00"),duration_minutes:s.duration,activities:s.activities||null,patient_response:s.response||null,help_level:s.helpLevel||null,result:s.result||null,next_session_plan:s.nextPlan||null,homework:s.homework||null,notes:s.notes||null,updated_at:new Date().toISOString()});
export const goalRow=(g:Goal,userId:string)=>({id:g.id,user_id:userId,patient_id:g.patientId,title:g.title,description:g.description||null,priority:g.priority,status:g.status,progress:g.progress,updated_at:new Date().toISOString()});
export const profileRow=(p:Profile,userId:string)=>({id:userId,full_name:`${p.firstName} ${p.lastName}`.trim(),first_name:p.firstName,last_name:p.lastName,profession:p.profession,email:p.email,studio:p.studio,updated_at:new Date().toISOString()});
export const materialRow=(m:Material,userId:string)=>({id:m.id,user_id:userId,title:m.title,description:m.description||null,category:m.category,tags:m.tags,file_name:m.fileName||null,storage_path:m.storagePath||null,mime_type:m.mimeType||null,file_size:m.size||null,external_url:m.externalUrl||null,is_favorite:m.favorite,updated_at:new Date().toISOString()});
export async function replaceLinks(client:SupabaseClient,table:"patient_materials"|"session_materials",ownerKey:"material_id"|"session_id",ownerId:string,linkKey:"patient_id"|"material_id",ids:string[]){check(await client.from(table).delete().eq(ownerKey,ownerId));if(ids.length)check(await client.from(table).insert(ids.map(id=>({[ownerKey]:ownerId,[linkKey]:id}))));}
export async function signedFileBlob(client:SupabaseClient,path:string){const result=check(await client.storage.from("therapy-materials").createSignedUrl(path,300));if(!result.data)throw new Error("Impossibile creare il link sicuro al file");const response=await fetch(result.data.signedUrl);if(!response.ok)throw new Error("Impossibile aprire il file privato");return response.blob();}
