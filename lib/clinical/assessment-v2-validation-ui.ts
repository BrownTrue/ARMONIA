import type { ClinicalAssessmentV2 } from "./types.ts";
import { getClinicalModuleDefinition } from "./module-registry.ts";
import { isClinicalAssessmentV2Payload } from "./validation.ts";

export type AssessmentValidationIssue = {
  path: string;
  step?: number;
  field?: string;
  message: string;
  kind: "field" | "global";
};

const sectionSteps = { accessReason: 0, anamnesis: 1, tests: 3, summary: 4, planning: 5 } as const;
const sectionLabels = { accessReason: "Motivo dell’accesso", anamnesis: "Anamnesi", tests: "Test / strumenti", summary: "Sintesi", planning: "Obiettivi / pianificazione" } as const;
const isoDate = /^\d{4}-(0[1-9]|1[0-2])-([012]\d|3[01])$/;

export function assessmentV2CompletionIssues(assessment: ClinicalAssessmentV2): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  if (!assessment.clinicalDate || !isoDate.test(assessment.clinicalDate)) issues.push({ path: "clinicalDate", step: 0, field: "clinical-date", message: assessment.clinicalDate ? "Inserisci una data valida." : "Completa la data clinica.", kind: "field" });
  if (assessment.data.modules.length === 0) issues.push({ path: "data.modules", step: 2, field: "clinical-modules", message: "Seleziona almeno un’area clinica.", kind: "field" });
  assessment.data.modules.forEach((module, index) => {
    const definition = getClinicalModuleDefinition(module.code, module.version);
    if (!definition || !definition.validate(module.data)) issues.push({ path: `data.modules.${index}`, step: 2, field: `clinical-module-${module.code}-${module.version}`, message: "Controlla le informazioni di questa area clinica.", kind: "field" });
  });
  for (const key of Object.keys(sectionSteps) as (keyof typeof sectionSteps)[]) {
    const value = assessment.data[key];
    if (value !== undefined && !isClinicalAssessmentV2Payload({ modules: [], [key]: value })) issues.push({ path: `data.${key}`, step: sectionSteps[key], field: `clinical-section-${key}`, message: `Controlla le informazioni in ${sectionLabels[key]}.`, kind: "field" });
  }
  const known = new Set(["modules", ...Object.keys(sectionSteps)]);
  if (Object.keys(assessment.data).some((key) => !known.has(key))) issues.push({ path: "data", message: "Controlla le informazioni della valutazione prima di completarla.", kind: "global" });
  if (!isClinicalAssessmentV2Payload(assessment.data) && !issues.some((issue) => issue.path.startsWith("data"))) issues.push({ path: "data", message: "Controlla le informazioni della valutazione prima di completarla.", kind: "global" });
  return issues;
}

export function assessmentStepsWithIssues(issues: AssessmentValidationIssue[]) {
  return new Set(issues.flatMap((issue) => issue.step === undefined ? [] : [issue.step]));
}

export function firstNavigableAssessmentIssue(issues: AssessmentValidationIssue[]) {
  return issues.find((issue) => issue.step !== undefined && issue.field);
}
