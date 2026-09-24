import { clinicalModuleRegistry } from "./module-registry.ts";

export type ClinicalModuleGroup = {
  code: string;
  label: string;
  order: number;
  moduleCodes: readonly string[];
};

export const clinicalModuleGroups: readonly ClinicalModuleGroup[] = [
  { code: "communication_language_speech", label: "Comunicazione, linguaggio e parlato", order: 1, moduleCodes: ["language_oral", "speech_sound", "motor_speech", "fluency", "aac_multimodal"] },
  { code: "voice", label: "Voce", order: 2, moduleCodes: ["voice"] },
  { code: "feeding_oral_functions", label: "Alimentazione e funzioni orali", order: 3, moduleCodes: ["feeding_swallowing", "orofacial_functions"] },
  { code: "hearing_communication", label: "Udito e comunicazione", order: 4, moduleCodes: ["auditory_communication"] },
] as const;

export function getClinicalModulesForGroup(group: ClinicalModuleGroup) {
  return group.moduleCodes.map((code) => clinicalModuleRegistry.find((module) => module.code === code)).filter((module): module is (typeof clinicalModuleRegistry)[number] => Boolean(module));
}

export function validateClinicalModuleGroups() {
  const groupedCodes = clinicalModuleGroups.flatMap((group) => group.moduleCodes);
  return groupedCodes.length === new Set(groupedCodes).size
    && clinicalModuleRegistry.every((module) => groupedCodes.includes(module.code));
}
