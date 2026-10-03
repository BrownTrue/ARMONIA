import { currentProfessionalDocumentSnapshot, type ProfessionalDocumentSnapshot } from "../economic-documents.ts";
import type { ClinicalPathway, ClinicalPathwayStatus } from "../clinical/types.ts";
import type { Patient, ProfessionalDocumentDetails, Profile } from "../types.ts";
import { formatItalianDate } from "./attendance-attestation.ts";

export type PathwayAttestationDraft = {
  patientId: string;
  pathwayId: string;
  status: ClinicalPathwayStatus;
  startDate: string;
  endDate: string;
  location: string;
  issuePlace: string;
  issueDate: string;
  includeLogo: boolean;
};

export type PathwayAttestationField = "patientId" | "pathwayId" | "startDate" | "endDate" | "location" | "issueDate";
export type PathwayAttestationIssues = Partial<Record<PathwayAttestationField, string>>;
export type PathwayAttestationModel = {
  patientName: string;
  status: ClinicalPathwayStatus;
  startDate: string;
  endDate?: string;
  location: string;
  issuePlace?: string;
  issueDate: string;
  professional: ProfessionalDocumentSnapshot;
  logoSrc?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value?: string) => value?.trim() || "";
const validDate = (value: string) => DATE_RE.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());

export function pathwaysForAttestation(pathways: ClinicalPathway[], patientId: string) {
  return pathways.filter((pathway) => pathway.patientId === patientId).sort((a, b) => b.startedOn.localeCompare(a.startedOn) || b.createdAt.localeCompare(a.createdAt));
}

export function pathwayAttestationLabel(pathway: ClinicalPathway) {
  return [pathway.title?.trim() || "Percorso logopedico", formatItalianDate(pathway.startedOn), pathway.status === "active" ? "Attivo" : "Concluso"].join(" · ");
}

export function pathwayAttestationPrefill(pathway: ClinicalPathway) {
  return { status: pathway.status, startDate: pathway.startedOn, endDate: pathway.closedOn || "" };
}

export function defaultPathwayLocation(profile: Profile) {
  return text(profile.studio);
}

export function validatePathwayAttestationDraft(draft: PathwayAttestationDraft): PathwayAttestationIssues {
  const issues: PathwayAttestationIssues = {};
  if (!draft.patientId) issues.patientId = "Seleziona un paziente.";
  if (!draft.pathwayId) issues.pathwayId = "Seleziona un percorso clinico.";
  if (!validDate(draft.startDate)) issues.startDate = "Inserisci una data di inizio valida.";
  if (draft.status === "closed") {
    if (!validDate(draft.endDate)) issues.endDate = "Inserisci una data di fine valida.";
    else if (validDate(draft.startDate) && draft.endDate < draft.startDate) issues.endDate = "La data di fine non può precedere la data di inizio.";
  }
  if (!text(draft.location)) issues.location = "Inserisci lo studio o la sede.";
  if (!validDate(draft.issueDate)) issues.issueDate = "Inserisci una data valida.";
  return issues;
}

export function buildPathwayAttestationModel(input: { draft: PathwayAttestationDraft; patient: Patient; pathway: ClinicalPathway; profile: Profile; professionalDetails?: ProfessionalDocumentDetails; logoSrc?: string }): PathwayAttestationModel {
  if (input.patient.id !== input.draft.patientId || input.pathway.id !== input.draft.pathwayId || input.pathway.patientId !== input.patient.id) throw new Error("pathway_attestation_source_mismatch");
  if (Object.keys(validatePathwayAttestationDraft(input.draft)).length) throw new Error("pathway_attestation_invalid");
  return {
    patientName: `${input.patient.firstName} ${input.patient.lastName}`.trim(),
    status: input.draft.status,
    startDate: input.draft.startDate,
    endDate: input.draft.status === "closed" ? input.draft.endDate : undefined,
    location: input.draft.location.trim(),
    issuePlace: text(input.draft.issuePlace) || undefined,
    issueDate: input.draft.issueDate,
    professional: currentProfessionalDocumentSnapshot(input.profile, input.professionalDetails),
    logoSrc: input.draft.includeLogo ? input.logoSrc : undefined,
  };
}

export function pathwayAttestationParagraphs(model: Pick<PathwayAttestationModel, "patientName" | "status" | "startDate" | "endDate" | "location">) {
  const first = model.status === "active"
    ? `Si attesta che ${model.patientName} è stato/a seguito/a in percorso logopedico presso ${model.location} a partire dal ${formatItalianDate(model.startDate)} ed è attualmente in corso.`
    : `Si attesta che ${model.patientName} è stato/a seguito/a in percorso logopedico presso ${model.location} nel periodo compreso tra ${formatItalianDate(model.startDate)} e ${formatItalianDate(model.endDate || "")}.`;
  return [first, "Il presente documento viene rilasciato su richiesta dell’interessato per gli usi consentiti."];
}

export function pathwayAttestationFileName(patient: Patient, issueDate: string) {
  const lastName = patient.lastName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Paziente";
  return `Attestazione_percorso_${lastName}_${DATE_RE.test(issueDate) ? issueDate : "data"}.pdf`;
}
