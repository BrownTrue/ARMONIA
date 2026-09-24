import type { AppData } from "../types.ts";
import type { ClinicalAssessment, ClinicalPathway } from "./types.ts";
import { isClinicalAssessment, isIsoDate, validateAssessmentForCompletion, validateClinicalPathway } from "./validation.ts";

const replaceById = <T extends { id: string }>(items: T[], item: T) =>
  items.map((existing) => existing.id === item.id ? item : existing);

function requirePatient(data: AppData, patientId: string) {
  if (!data.patients.some((patient) => patient.id === patientId)) throw new Error("Paziente non trovato.");
}

export function getClinicalPathway(data: AppData, id: string) {
  return data.clinicalPathways.find((pathway) => pathway.id === id);
}

export function listClinicalPathwaysForPatient(data: AppData, patientId: string) {
  return data.clinicalPathways
    .filter((pathway) => pathway.patientId === patientId)
    .sort((a, b) => (b.startedOn + b.createdAt).localeCompare(a.startedOn + a.createdAt));
}

export function createClinicalPathway(data: AppData, pathway: ClinicalPathway): AppData {
  requirePatient(data, pathway.patientId);
  validateClinicalPathway(pathway);
  if (data.clinicalPathways.some((existing) => existing.id === pathway.id)) throw new Error("Esiste già un percorso con questo ID.");
  if (pathway.status === "active" && data.clinicalPathways.some((existing) => existing.patientId === pathway.patientId && existing.status === "active")) {
    throw new Error("Il paziente ha già un percorso clinico attivo.");
  }
  return { ...data, clinicalPathways: [pathway, ...data.clinicalPathways] };
}

export function updateClinicalPathway(data: AppData, pathway: ClinicalPathway): AppData {
  const current = getClinicalPathway(data, pathway.id);
  if (!current) throw new Error("Percorso clinico non trovato.");
  if (current.patientId !== pathway.patientId) throw new Error("Non è possibile spostare un percorso su un altro paziente.");
  requirePatient(data, pathway.patientId);
  validateClinicalPathway(pathway);
  if (pathway.status === "active" && data.clinicalPathways.some((existing) => existing.id !== pathway.id && existing.patientId === pathway.patientId && existing.status === "active")) {
    throw new Error("Il paziente ha già un percorso clinico attivo.");
  }
  return { ...data, clinicalPathways: replaceById(data.clinicalPathways, pathway) };
}

export function deleteClinicalPathway(data: AppData, id: string): AppData {
  const current = getClinicalPathway(data, id);
  if (!current) throw new Error("Percorso clinico non trovato.");
  if (data.clinicalAssessments.some((assessment) => assessment.clinicalPathwayId === id)) {
    throw new Error("Questo percorso contiene valutazioni. Elimina prima le valutazioni che non vuoi conservare oppure chiudi il percorso.");
  }
  if (data.goals.some((goal) => goal.clinicalPathwayId === id)) {
    throw new Error("Questo percorso contiene obiettivi collegati e non può essere eliminato. Chiudi il percorso per conservarne lo storico.");
  }
  return { ...data, clinicalPathways: data.clinicalPathways.filter((pathway) => pathway.id !== id) };
}

export function closeClinicalPathway(data: AppData, id: string, closedOn: string, updatedAt = new Date().toISOString()): AppData {
  const current = getClinicalPathway(data, id);
  if (!current) throw new Error("Percorso clinico non trovato.");
  if (!isIsoDate(closedOn)) throw new Error("La data di chiusura del percorso non è valida.");
  return updateClinicalPathway(data, { ...current, status: "closed", closedOn, updatedAt });
}

export function getClinicalAssessment(data: AppData, id: string) {
  return data.clinicalAssessments.find((assessment) => assessment.id === id);
}

export function listClinicalAssessmentsForPatient(data: AppData, patientId: string) {
  return data.clinicalAssessments
    .filter((assessment) => assessment.patientId === patientId)
    .sort((a, b) => ((b.clinicalDate || b.createdAt) + b.createdAt).localeCompare((a.clinicalDate || a.createdAt) + a.createdAt));
}

export function listClinicalAssessmentsForPathway(data: AppData, clinicalPathwayId: string) {
  return data.clinicalAssessments
    .filter((assessment) => assessment.clinicalPathwayId === clinicalPathwayId)
    .sort((a, b) => ((b.clinicalDate || b.createdAt) + b.createdAt).localeCompare((a.clinicalDate || a.createdAt) + a.createdAt));
}

function validateAssessmentRelation(data: AppData, assessment: ClinicalAssessment) {
  if (!isClinicalAssessment(assessment)) throw new Error("Valutazione clinica non valida o non supportata.");
  requirePatient(data, assessment.patientId);
  const pathway = getClinicalPathway(data, assessment.clinicalPathwayId);
  if (!pathway) throw new Error("Percorso clinico non trovato.");
  if (pathway.patientId !== assessment.patientId) throw new Error("Valutazione, paziente e percorso clinico non sono coerenti.");
}

export function createClinicalAssessmentDraft(data: AppData, assessment: ClinicalAssessment): AppData {
  if (assessment.status !== "draft") throw new Error("Una nuova valutazione deve essere creata come bozza.");
  if (data.clinicalAssessments.some((existing) => existing.id === assessment.id)) throw new Error("Esiste già una valutazione con questo ID.");
  validateAssessmentRelation(data, assessment);
  return { ...data, clinicalAssessments: [assessment, ...data.clinicalAssessments] };
}

export function autosaveClinicalAssessmentDraft(data: AppData, assessment: ClinicalAssessment): AppData {
  const current = getClinicalAssessment(data, assessment.id);
  if (!current) throw new Error("Valutazione clinica non trovata.");
  if (current.status === "completed") throw new Error("Una valutazione completata non può essere sovrascritta dall'autosave.");
  if (assessment.status !== "draft") throw new Error("L'autosave può salvare soltanto una bozza.");
  if (current.patientId !== assessment.patientId || current.clinicalPathwayId !== assessment.clinicalPathwayId) {
    throw new Error("Non è possibile spostare una valutazione su un altro paziente o percorso.");
  }
  validateAssessmentRelation(data, assessment);
  return { ...data, clinicalAssessments: replaceById(data.clinicalAssessments, assessment) };
}

export function completeClinicalAssessment(data: AppData, id: string, updatedAt = new Date().toISOString()): AppData {
  const current = getClinicalAssessment(data, id);
  if (!current) throw new Error("Valutazione clinica non trovata.");
  if (current.status === "completed") return data;
  validateAssessmentRelation(data, current);
  validateAssessmentForCompletion(current);
  return { ...data, clinicalAssessments: replaceById(data.clinicalAssessments, { ...current, status: "completed", updatedAt }) };
}

export function correctClinicalAssessment(data: AppData, assessment: ClinicalAssessment, updatedAt = new Date().toISOString()): AppData {
  const current = getClinicalAssessment(data, assessment.id);
  if (!current) throw new Error("Valutazione clinica non trovata.");
  if (current.status !== "completed" || assessment.status !== "completed") {
    throw new Error("La correzione esplicita è disponibile soltanto per una valutazione completata.");
  }
  if (current.patientId !== assessment.patientId || current.clinicalPathwayId !== assessment.clinicalPathwayId) {
    throw new Error("Non è possibile spostare una valutazione su un altro paziente o percorso.");
  }
  const corrected: ClinicalAssessment = {
    ...assessment,
    id: current.id,
    patientId: current.patientId,
    clinicalPathwayId: current.clinicalPathwayId,
    status: "completed",
    schemaVersion: current.schemaVersion,
    createdAt: current.createdAt,
    updatedAt,
  };
  validateAssessmentRelation(data, corrected);
  validateAssessmentForCompletion(corrected);
  return { ...data, clinicalAssessments: replaceById(data.clinicalAssessments, corrected) };
}

export function deleteClinicalAssessment(data: AppData, id: string): AppData {
  const current = getClinicalAssessment(data, id);
  if (!current) throw new Error("Valutazione clinica non trovata.");
  return { ...data, clinicalAssessments: data.clinicalAssessments.filter((assessment) => assessment.id !== id) };
}
