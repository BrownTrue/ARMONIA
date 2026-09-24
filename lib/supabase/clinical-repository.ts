import type { SupabaseClient } from "@supabase/supabase-js";
import {
  autosaveClinicalAssessmentDraft,
  closeClinicalPathway,
  completeClinicalAssessment,
  correctClinicalAssessment,
  createClinicalAssessmentDraft,
  createClinicalPathway,
  deleteClinicalAssessment,
  deleteClinicalPathway,
  getClinicalAssessment,
  getClinicalPathway,
  listClinicalAssessmentsForPathway,
  listClinicalAssessmentsForPatient,
  listClinicalPathwaysForPatient,
  updateClinicalPathway,
} from "../clinical/local.ts";
import {
  linkGoalToClinicalPathway,
  unlinkGoalFromClinicalPathway,
} from "../clinical/goals.ts";
import type { ClinicalAssessment, ClinicalPathway } from "../clinical/types.ts";
import { isClinicalAssessment } from "../clinical/validation.ts";
import type { AppData } from "../types.ts";

export type ClinicalPathwayRow = {
  id: string;
  patient_id: string;
  title: string | null;
  status: "active" | "closed";
  started_on: string;
  closed_on: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicalAssessmentRow = {
  id: string;
  patient_id: string;
  clinical_pathway_id: string;
  module_type: "language_communication";
  assessment_type: "initial";
  status: "draft" | "completed";
  schema_version: number;
  clinical_date: string | null;
  data: unknown;
  created_at: string;
  updated_at: string;
};

const persistenceError = (operation: string) =>
  new Error(`Non è stato possibile ${operation}. Riprova tra poco.`);

function assertSuccess(result: { error: unknown }, operation: string) {
  if (result.error) throw persistenceError(operation);
}

export function clinicalPathwayFromRow(row: ClinicalPathwayRow): ClinicalPathway {
  return {
    id: row.id,
    patientId: row.patient_id,
    title: row.title || undefined,
    status: row.status,
    startedOn: row.started_on,
    closedOn: row.closed_on || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function clinicalPathwayRow(pathway: ClinicalPathway, userId: string) {
  return {
    id: pathway.id,
    user_id: userId,
    patient_id: pathway.patientId,
    title: pathway.title || null,
    status: pathway.status,
    started_on: pathway.startedOn,
    closed_on: pathway.closedOn || null,
    created_at: pathway.createdAt,
    updated_at: pathway.updatedAt,
  };
}

export function clinicalAssessmentFromRow(row: ClinicalAssessmentRow): ClinicalAssessment {
  const assessment = {
    id: row.id,
    patientId: row.patient_id,
    clinicalPathwayId: row.clinical_pathway_id,
    moduleType: row.module_type,
    assessmentType: row.assessment_type,
    status: row.status,
    schemaVersion: row.schema_version,
    clinicalDate: row.clinical_date || undefined,
    data: row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (!isClinicalAssessment(assessment)) {
    throw new Error("Una valutazione clinica cloud non è compatibile con la versione supportata.");
  }
  return assessment;
}

export function clinicalAssessmentRow(assessment: ClinicalAssessment, userId: string) {
  if (assessment.schemaVersion !== 1) {
    throw new Error("La persistenza cloud delle valutazioni V2 non è ancora abilitata.");
  }
  return {
    id: assessment.id,
    user_id: userId,
    patient_id: assessment.patientId,
    clinical_pathway_id: assessment.clinicalPathwayId,
    module_type: assessment.moduleType,
    assessment_type: assessment.assessmentType,
    status: assessment.status,
    schema_version: assessment.schemaVersion,
    clinical_date: assessment.clinicalDate || null,
    data: assessment.data,
    created_at: assessment.createdAt,
    updated_at: assessment.updatedAt,
  };
}

export async function loadCloudClinicalData(client: SupabaseClient, userId: string) {
  const [pathways, assessments] = await Promise.all([
    client.from("clinical_pathways").select("*").eq("user_id", userId).order("started_on", { ascending: false }),
    client.from("clinical_assessments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  assertSuccess(pathways, "caricare i percorsi clinici");
  assertSuccess(assessments, "caricare le valutazioni cliniche");
  return {
    clinicalPathways: ((pathways.data || []) as ClinicalPathwayRow[]).map(clinicalPathwayFromRow),
    clinicalAssessments: ((assessments.data || []) as ClinicalAssessmentRow[]).map(clinicalAssessmentFromRow),
  };
}

async function insertPathway(client: SupabaseClient, userId: string, pathway: ClinicalPathway) {
  assertSuccess(await client.from("clinical_pathways").insert(clinicalPathwayRow(pathway, userId)).select("id").single(), "creare il percorso clinico");
}

async function updatePathway(client: SupabaseClient, userId: string, pathway: ClinicalPathway) {
  const row = clinicalPathwayRow(pathway, userId);
  assertSuccess(await client.from("clinical_pathways").update({
    title: row.title,
    status: row.status,
    started_on: row.started_on,
    closed_on: row.closed_on,
    updated_at: row.updated_at,
  }).eq("id", pathway.id).eq("user_id", userId).select("id").single(), "aggiornare il percorso clinico");
}

async function insertAssessment(client: SupabaseClient, userId: string, assessment: ClinicalAssessment) {
  assertSuccess(await client.from("clinical_assessments").insert(clinicalAssessmentRow(assessment, userId)).select("id").single(), "creare la valutazione clinica");
}

async function updateAssessment(client: SupabaseClient, userId: string, assessment: ClinicalAssessment, operation: string) {
  const row = clinicalAssessmentRow(assessment, userId);
  assertSuccess(await client.from("clinical_assessments").update({
    status: row.status,
    clinical_date: row.clinical_date,
    data: row.data,
    updated_at: row.updated_at,
  }).eq("id", assessment.id).eq("user_id", userId).select("id").single(), operation);
}

export async function createCloudClinicalPathway(client: SupabaseClient, userId: string, data: AppData, pathway: ClinicalPathway) {
  const next = createClinicalPathway(data, pathway);
  await insertPathway(client, userId, pathway);
  return next;
}

export async function updateCloudClinicalPathway(client: SupabaseClient, userId: string, data: AppData, pathway: ClinicalPathway) {
  const next = updateClinicalPathway(data, pathway);
  await updatePathway(client, userId, pathway);
  return next;
}

export async function closeCloudClinicalPathway(client: SupabaseClient, userId: string, data: AppData, id: string, closedOn: string) {
  const next = closeClinicalPathway(data, id, closedOn);
  await updatePathway(client, userId, getClinicalPathway(next, id)!);
  return next;
}

export async function deleteCloudClinicalPathway(client: SupabaseClient, userId: string, data: AppData, id: string) {
  const next = deleteClinicalPathway(data, id);
  assertSuccess(await client.from("clinical_pathways").delete().eq("id", id).eq("user_id", userId).select("id").single(), "eliminare il percorso clinico");
  return next;
}

export async function createCloudClinicalAssessmentDraft(client: SupabaseClient, userId: string, data: AppData, assessment: ClinicalAssessment) {
  const next = createClinicalAssessmentDraft(data, assessment);
  await insertAssessment(client, userId, assessment);
  return next;
}

export async function autosaveCloudClinicalAssessmentDraft(client: SupabaseClient, userId: string, data: AppData, assessment: ClinicalAssessment) {
  const next = autosaveClinicalAssessmentDraft(data, assessment);
  await updateAssessment(client, userId, assessment, "salvare la bozza della valutazione");
  return next;
}

export async function completeCloudClinicalAssessment(client: SupabaseClient, userId: string, data: AppData, id: string) {
  const next = completeClinicalAssessment(data, id);
  await updateAssessment(client, userId, getClinicalAssessment(next, id)!, "completare la valutazione clinica");
  return next;
}

export async function correctCloudClinicalAssessment(client: SupabaseClient, userId: string, data: AppData, assessment: ClinicalAssessment, updatedAt = new Date().toISOString()) {
  const next = correctClinicalAssessment(data, assessment, updatedAt);
  const corrected = getClinicalAssessment(next, assessment.id)!;
  await updateAssessment(client, userId, corrected, "salvare le correzioni della valutazione");
  return next;
}

export async function deleteCloudClinicalAssessment(client: SupabaseClient, userId: string, data: AppData, id: string) {
  const next = deleteClinicalAssessment(data, id);
  assertSuccess(await client.from("clinical_assessments").delete().eq("id", id).eq("user_id", userId).select("id").single(), "eliminare la valutazione clinica");
  return next;
}

export async function linkCloudGoalToClinicalPathway(client: SupabaseClient, userId: string, data: AppData, goalId: string, pathwayId: string) {
  const next = linkGoalToClinicalPathway(data, goalId, pathwayId);
  assertSuccess(await client.from("goals").update({ clinical_pathway_id: pathwayId }).eq("id", goalId).eq("user_id", userId).select("id").single(), "collegare l'obiettivo al percorso clinico");
  return next;
}

export async function unlinkCloudGoalFromClinicalPathway(client: SupabaseClient, userId: string, data: AppData, goalId: string) {
  const next = unlinkGoalFromClinicalPathway(data, goalId);
  assertSuccess(await client.from("goals").update({ clinical_pathway_id: null }).eq("id", goalId).eq("user_id", userId).select("id").single(), "scollegare l'obiettivo dal percorso clinico");
  return next;
}

export const getCloudClinicalPathway = getClinicalPathway;
export const listCloudClinicalPathwaysForPatient = listClinicalPathwaysForPatient;
export const getCloudClinicalAssessment = getClinicalAssessment;
export const listCloudClinicalAssessmentsForPatient = listClinicalAssessmentsForPatient;
export const listCloudClinicalAssessmentsForPathway = listClinicalAssessmentsForPathway;
