import { uid } from "../types.ts";
import type { ClinicalAssessmentTypeV2, ClinicalAssessmentV2 } from "./types.ts";

export type ClinicalModuleInstance = {
  code: string;
  version: number;
  data: unknown;
};

export type ClinicalAssessmentV2Data = {
  modules: ClinicalModuleInstance[];
  common?: Record<string, never>;
  tests?: Record<string, never>;
  summary?: Record<string, never>;
  planning?: Record<string, never>;
};

export function createClinicalAssessmentV2(
  patientId: string,
  clinicalPathwayId: string,
  assessmentType: ClinicalAssessmentTypeV2 = "initial",
  now = new Date().toISOString(),
): ClinicalAssessmentV2 {
  return {
    id: uid(),
    patientId,
    clinicalPathwayId,
    assessmentType,
    status: "draft",
    schemaVersion: 2,
    data: { modules: [] },
    createdAt: now,
    updatedAt: now,
  };
}
