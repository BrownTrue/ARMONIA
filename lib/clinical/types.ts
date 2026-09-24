import type { LanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";

export type ClinicalPathwayStatus = "active" | "closed";

export type ClinicalPathway = {
  id: string;
  patientId: string;
  status: ClinicalPathwayStatus;
  title?: string;
  startedOn: string;
  closedOn?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalModuleType = "language_communication";
export type ClinicalAssessmentType = "initial";
export type ClinicalAssessmentStatus = "draft" | "completed";

export type ClinicalAssessment = {
  id: string;
  patientId: string;
  clinicalPathwayId: string;
  moduleType: ClinicalModuleType;
  assessmentType: ClinicalAssessmentType;
  status: ClinicalAssessmentStatus;
  schemaVersion: 1;
  clinicalDate?: string;
  data: LanguageCommunicationAssessmentV1;
  createdAt: string;
  updatedAt: string;
};
