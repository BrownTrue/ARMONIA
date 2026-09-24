import { clinicalModuleGroups, getClinicalModulesForGroup } from "./module-groups.ts";

export const CLINICAL_ASSESSMENT_V2_STEPS = ["Motivo dell’accesso", "Anamnesi", "Aree cliniche", "Test / strumenti", "Sintesi", "Obiettivi / pianificazione"] as const;

export function getClinicalAssessmentWizardActions(step: number, totalSteps = CLINICAL_ASSESSMENT_V2_STEPS.length) {
  const finalStep = step === totalSteps - 1;
  return {
    showBack: step > 0,
    showNext: !finalStep,
    showComplete: finalStep,
    primaryAction: finalStep ? "complete" : "next",
  } as const;
}

export function normalizeClinicalModuleSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it-IT").trim();
}

export function searchClinicalModules(query: string) {
  const normalizedQuery = normalizeClinicalModuleSearch(query);
  if (!normalizedQuery) return [];

  return clinicalModuleGroups.flatMap((group) => getClinicalModulesForGroup(group)
    .filter((module) => normalizeClinicalModuleSearch(module.label).includes(normalizedQuery))
    .map((module) => ({ module, group })));
}

export function getClinicalModuleActionLabel(present: boolean) {
  return present ? "✓ Aggiunta · Rimuovi" : "+ Aggiungi";
}
