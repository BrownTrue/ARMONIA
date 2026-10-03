import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeAppData } from "../data/local-store.ts";
import type { AppData, Material, Patient, Profile, Session } from "../types.ts";
import { appointmentFromRow, appointmentLocationFromRow, appointmentServiceFromRow, economicDocumentFromRow, economicDocumentLineFromRow, exerciseRecipeFromRow, goalFromRow, patientAdministrativeDetailsFromRow, patientWorksheetFromRow, paymentAllocationFromRow, paymentFromRow, professionalDocumentDetailsFromRow, sessionFromRow, worksheetTemplateFromRow } from "../supabase/repository.ts";
import { clinicalAssessmentFromRow, clinicalPathwayFromRow, type ClinicalAssessmentRow, type ClinicalPathwayRow } from "../supabase/clinical-repository.ts";
import type { DataExportSnapshot } from "./types.ts";

const PAGE_SIZE = 500;
type Row = Record<string, any>;

export async function readPaginatedTable(client: SupabaseClient, table: string, userId?: string, ownerColumn = "user_id") {
  const rows: Row[] = [];
  for (let from = 0;; from += PAGE_SIZE) {
    let query = client.from(table).select("*").range(from, from + PAGE_SIZE - 1);
    if (userId) query = query.eq(ownerColumn, userId);
    const result = await query;
    if (result.error) throw new Error(`data_export_read_failed:${table}`);
    const page = (result.data || []) as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function localExportSnapshot(value: unknown): DataExportSnapshot {
  const data = normalizeAppData(value);
  return {
    data,
    patientMaterials: data.materials.flatMap(material => material.patientIds.map(patientId => ({ patientId, materialId: material.id }))),
    sessionMaterials: data.sessions.flatMap(session => session.materialIds.map(materialId => ({ sessionId: session.id, materialId }))),
  };
}

export function filterOwnedLinks(rows:Row[], leftKey:string, ownedLeft:Set<string>, rightKey:string, ownedRight:Set<string>){
  return rows.filter(row=>ownedLeft.has(row[leftKey])&&ownedRight.has(row[rightKey]));
}

export async function cloudExportSnapshot(client: SupabaseClient, user: User): Promise<DataExportSnapshot> {
  const owned = ["patients","patient_administrative_details","professional_document_details","economic_documents","economic_document_lines","exercise_recipes","worksheet_templates","patient_worksheets","appointments","appointment_locations","appointment_services","sessions","payments","payment_allocations","goals","materials","clinical_pathways","clinical_assessments"] as const;
  const results = await Promise.all([
    readPaginatedTable(client,"profiles",user.id,"id"),
    ...owned.map(table => readPaginatedTable(client,table,user.id)),
    readPaginatedTable(client,"patient_materials"),
    readPaginatedTable(client,"session_materials"),
    readPaginatedTable(client,"session_goals"),
  ]);
  const [profiles,patients,admin,professional,documents,lines,recipes,templates,worksheets,appointments,locations,services,sessions,payments,allocations,goals,materials,pathways,assessments,patientLinksRaw,sessionLinksRaw,goalLinksRaw] = results;
  const patientIds = new Set(patients.map(row => row.id));
  const materialIds = new Set(materials.map(row => row.id));
  const sessionIds = new Set(sessions.map(row => row.id));
  const goalIds = new Set(goals.map(row => row.id));
  const patientMaterials = filterOwnedLinks(patientLinksRaw,"patient_id",patientIds,"material_id",materialIds).map(row => ({patientId:row.patient_id,materialId:row.material_id}));
  const sessionMaterials = filterOwnedLinks(sessionLinksRaw,"session_id",sessionIds,"material_id",materialIds).map(row => ({sessionId:row.session_id,materialId:row.material_id}));
  const sessionGoals = filterOwnedLinks(goalLinksRaw,"session_id",sessionIds,"goal_id",goalIds);
  const profileRow=profiles[0];
  const profile:Profile={firstName:profileRow?.first_name||"",lastName:profileRow?.last_name||"",profession:profileRow?.profession||"Logopedista",email:profileRow?.email||user.email||"",studio:profileRow?.studio||"",calendarColorMode:profileRow?.calendar_color_mode==="service"?"service":"location"};
  const data:AppData={
    profile,
    patients:patients.map((p):Patient=>({id:p.id,firstName:p.first_name,lastName:p.last_name,birthDate:p.birth_date||"",contact:p.phone||"",guardian:p.guardian_name||"",school:p.school||"",schoolClass:p.school_class||"",referralReason:p.referral_reason||"",notes:p.notes||"",status:p.status,createdAt:p.created_at})),
    patientAdministrativeDetails:admin.map(patientAdministrativeDetailsFromRow as any),
    professionalDocumentDetails:professional[0]?professionalDocumentDetailsFromRow(professional[0] as any):undefined,
    economicDocuments:documents.map(economicDocumentFromRow as any),economicDocumentLines:lines.map(economicDocumentLineFromRow as any),
    exerciseRecipes:recipes.map(exerciseRecipeFromRow as any),worksheetTemplates:templates.map(worksheetTemplateFromRow as any),patientWorksheets:worksheets.map(patientWorksheetFromRow as any),
    appointments:appointments.map(appointmentFromRow as any),locations:locations.map(appointmentLocationFromRow as any),services:services.map(appointmentServiceFromRow as any),
    sessions:sessions.map((row):Session=>sessionFromRow(row as any,sessionGoals.filter(link=>link.session_id===row.id).map(link=>link.goal_id),sessionMaterials.filter(link=>link.sessionId===row.id).map(link=>link.materialId))),
    payments:payments.map(paymentFromRow as any),paymentAllocations:allocations.map(paymentAllocationFromRow as any),goals:goals.map(goalFromRow as any),
    materials:materials.map((m):Material=>({id:m.id,title:m.title,description:m.description||"",category:m.category||"altro",tags:m.tags||[],fileName:m.file_name||"",mimeType:m.mime_type||"",size:Number(m.file_size||0),favorite:Boolean(m.is_favorite),patientIds:patientMaterials.filter(link=>link.materialId===m.id).map(link=>link.patientId),externalUrl:m.external_url||undefined,storagePath:m.storage_path||undefined,createdAt:m.created_at})),
    clinicalPathways:(pathways as ClinicalPathwayRow[]).map(clinicalPathwayFromRow),clinicalAssessments:(assessments as ClinicalAssessmentRow[]).map(clinicalAssessmentFromRow),
  };
  return {data,patientMaterials,sessionMaterials};
}
