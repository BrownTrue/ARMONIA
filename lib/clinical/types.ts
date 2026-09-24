import type { LanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";
import type { ClinicalAssessmentV2Data } from "./assessment-v2.ts";

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

export type ClinicalModuleTypeV1 = "language_communication";
export type ClinicalAssessmentTypeV1 = "initial";
export type ClinicalAssessmentTypeV2 = "initial" | "reassessment" | "interim" | "other";
export type ClinicalAssessmentStatus = "draft" | "completed";

type ClinicalAssessmentBase = {
  id: string;
  patientId: string;
  clinicalPathwayId: string;
  status: ClinicalAssessmentStatus;
  clinicalDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalAssessmentV1 = ClinicalAssessmentBase & {
  moduleType: ClinicalModuleTypeV1;
  assessmentType: ClinicalAssessmentTypeV1;
  schemaVersion: 1;
  data: LanguageCommunicationAssessmentV1;
};

export type ClinicalAssessmentV2 = ClinicalAssessmentBase & {
  assessmentType: ClinicalAssessmentTypeV2;
  schemaVersion: 2;
  data: ClinicalAssessmentV2Data;
};

export type ClinicalAssessment = ClinicalAssessmentV1 | ClinicalAssessmentV2;
