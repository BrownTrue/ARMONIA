import type { ClinicalAssessment, ClinicalAssessmentV1, ClinicalAssessmentV2 } from "./types.ts";

export const isClinicalAssessmentV1 = (assessment: ClinicalAssessment): assessment is ClinicalAssessmentV1 =>
  assessment.schemaVersion === 1;

export const isClinicalAssessmentV2 = (assessment: ClinicalAssessment): assessment is ClinicalAssessmentV2 =>
  assessment.schemaVersion === 2;

export function assessmentRendererVersion(assessment: ClinicalAssessment) {
  return assessment.schemaVersion === 1 ? "v1" : "v2";
}
