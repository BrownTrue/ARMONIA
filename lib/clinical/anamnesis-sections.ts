export const anamnesisSectionGroups = [
  { code: "general", label: "Generali", order: 1 },
  { code: "development", label: "Sviluppo", order: 2 },
  { code: "sensory_ent", label: "Sensoriale / ORL", order: 3 },
  { code: "oral_functions", label: "Alimentazione e funzioni orali", order: 4 },
  { code: "school_work", label: "Scuola e lavoro", order: 5 },
  { code: "acquired_functional", label: "Storia funzionale / acquisita", order: 6 },
  { code: "other", label: "Altro", order: 7 },
] as const;

export type AnamnesisSectionGroupCode = (typeof anamnesisSectionGroups)[number]["code"];
export type AnamnesisAgeGroup = "early_childhood" | "school_age" | "adult" | "unknown";

export const anamnesisSectionRegistry = [
  { code: "clinical_history", label: "Storia clinica rilevante", placeholder: "Patologie, ricoveri, interventi, eventi clinici o altre informazioni sanitarie rilevanti…", group: "general", order: 1 },
  { code: "family_history", label: "Familiarità rilevante", placeholder: "Eventuali elementi familiari rilevanti per il quadro comunicativo, linguistico o funzionale…", group: "general", order: 2 },
  { code: "previous_assessments", label: "Valutazioni e interventi precedenti", placeholder: "Valutazioni già effettuate, trattamenti precedenti o in corso, professionisti coinvolti…", group: "general", order: 3 },
  { code: "medications_therapies", label: "Farmaci e terapie rilevanti", placeholder: "Farmaci, terapie o trattamenti rilevanti rispetto al percorso…", group: "general", order: 4 },
  { code: "family_social", label: "Contesto familiare e sociale", placeholder: "Composizione familiare, caregiver, contesto relazionale o altre informazioni pertinenti…", group: "general", order: 5 },
  { code: "pregnancy_birth", label: "Gravidanza e parto", placeholder: "Decorso della gravidanza, epoca gestazionale, parto, eventuali complicanze o informazioni rilevanti…", group: "development", order: 6 },
  { code: "motor_development", label: "Sviluppo motorio", placeholder: "Tappe motorie, eventuali ritardi o particolarità riferite nello sviluppo motorio…", group: "development", order: 7 },
  { code: "communication_language_development", label: "Sviluppo comunicativo-linguistico", placeholder: "Prime modalità comunicative, comparsa delle prime parole e combinazioni, andamento dello sviluppo comunicativo-linguistico…", group: "development", order: 8 },
  { code: "general_development_autonomy", label: "Sviluppo generale e autonomie", placeholder: "Autonomie personali, sviluppo generale e altri elementi evolutivi rilevanti…", group: "development", order: 9 },
  { code: "hearing_ent", label: "Udito e storia ORL", placeholder: "Storia otologica/ORL, otiti ricorrenti, controlli uditivi, eventuali dispositivi o altre informazioni riferite…", group: "sensory_ent", order: 10 },
  { code: "vision", label: "Vista", placeholder: "Informazioni visive rilevanti, correzioni, valutazioni o difficoltà riferite…", group: "sensory_ent", order: 11 },
  { code: "feeding_swallowing_history", label: "Alimentazione e deglutizione", placeholder: "Storia alimentare, consistenze, masticazione, deglutizione, selettività o altre informazioni riferite…", group: "oral_functions", order: 12 },
  { code: "breathing_oral_habits", label: "Respirazione e abitudini orali", placeholder: "Respirazione, abitudini orali, uso del ciuccio, suzione, bruxismo o altri elementi pertinenti…", group: "oral_functions", order: 13 },
  { code: "school_learning_history", label: "Percorso scolastico e apprendimenti", placeholder: "Percorso scolastico, andamento negli apprendimenti, eventuali difficoltà o supporti…", group: "school_work", order: 14 },
  { code: "education_work", label: "Formazione e contesto lavorativo", placeholder: "Percorso formativo, professione, richieste comunicative o vocali del contesto lavorativo…", group: "school_work", order: 15 },
  { code: "onset_event", label: "Esordio o evento clinico rilevante", placeholder: "Modalità e periodo di esordio, evento acuto o progressivo, cambiamenti riferiti…", group: "acquired_functional", order: 16 },
  { code: "functional_changes", label: "Cambiamenti funzionali riferiti", placeholder: "Cambiamenti nella comunicazione, autonomia, partecipazione o attività quotidiane riferiti dal paziente/caregiver…", group: "acquired_functional", order: 17 },
  { code: "other", label: "Altre informazioni anamnestiche", placeholder: "Altre informazioni anamnestiche rilevanti…", group: "other", order: 18 },
] as const;

export type AnamnesisSectionCode = (typeof anamnesisSectionRegistry)[number]["code"];
export type ClinicalAnamnesisSections = Partial<Record<AnamnesisSectionCode, string>>;
export type ClinicalAnamnesisV2 = { sections?: ClinicalAnamnesisSections };
export type LegacyClinicalAnamnesisV2 = { relevantClinicalHistory?: string; developmentAndHistory?: string; educationWorkContext?: string; familySocialContext?: string; previousAssessmentsInterventions?: string; additionalNotes?: string };

const sectionCodes = new Set<string>(anamnesisSectionRegistry.map(({ code }) => code));
const legacyMapping: Record<keyof LegacyClinicalAnamnesisV2, AnamnesisSectionCode> = {
  relevantClinicalHistory: "clinical_history", developmentAndHistory: "general_development_autonomy", educationWorkContext: "education_work",
  familySocialContext: "family_social", previousAssessmentsInterventions: "previous_assessments", additionalNotes: "other",
};
const suggestions: Record<AnamnesisAgeGroup, readonly AnamnesisSectionCode[]> = {
  early_childhood: ["pregnancy_birth", "motor_development", "communication_language_development", "hearing_ent", "feeding_swallowing_history", "family_social"],
  school_age: ["clinical_history", "communication_language_development", "hearing_ent", "school_learning_history", "previous_assessments", "family_social"],
  adult: ["clinical_history", "previous_assessments", "hearing_ent", "education_work", "family_social", "medications_therapies"],
  unknown: ["clinical_history", "previous_assessments", "hearing_ent", "family_social"],
};

const parseDateOnly = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : undefined;
};

export function calculateAgeAtDate(birthDate?: string, clinicalDate?: string, fallback = new Date()) {
  const birth = parseDateOnly(birthDate);
  if (!birth) return undefined;
  const reference = parseDateOnly(clinicalDate) || new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  if (reference.getUTCMonth() < birth.getUTCMonth() || (reference.getUTCMonth() === birth.getUTCMonth() && reference.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : undefined;
}

export function getAnamnesisAgeGroup(birthDate?: string, clinicalDate?: string, fallback?: Date): AnamnesisAgeGroup {
  const age = calculateAgeAtDate(birthDate, clinicalDate, fallback);
  if (age === undefined) return "unknown";
  if (age <= 5) return "early_childhood";
  if (age <= 17) return "school_age";
  return "adult";
}

export const getSuggestedAnamnesisSectionCodes = (birthDate?: string, clinicalDate?: string, fallback?: Date) => suggestions[getAnamnesisAgeGroup(birthDate, clinicalDate, fallback)];
export const getAnamnesisSection = (code: AnamnesisSectionCode) => anamnesisSectionRegistry.find((section) => section.code === code)!;
export const getAnamnesisSectionsForGroup = (group: AnamnesisSectionGroupCode) => anamnesisSectionRegistry.filter((section) => section.group === group);
export const isAnamnesisSectionCode = (value: string): value is AnamnesisSectionCode => sectionCodes.has(value);
const mergePreservingText = (current: string | undefined, legacy: string) => !current || current === legacy ? legacy : `${current}\n\n${legacy}`;

export function normalizeClinicalAnamnesis(value?: ClinicalAnamnesisV2 | LegacyClinicalAnamnesisV2): ClinicalAnamnesisV2 | undefined {
  if (!value || typeof value !== "object") return undefined;
  const normalized: ClinicalAnamnesisSections = {};
  if ("sections" in value && value.sections && typeof value.sections === "object") {
    for (const [code, text] of Object.entries(value.sections)) if (isAnamnesisSectionCode(code) && typeof text === "string" && text.trim()) normalized[code] = text;
  }
  for (const [legacyCode, target] of Object.entries(legacyMapping) as [keyof LegacyClinicalAnamnesisV2, AnamnesisSectionCode][]) {
    const text = (value as LegacyClinicalAnamnesisV2)[legacyCode];
    if (typeof text === "string" && text.trim()) normalized[target] = mergePreservingText(normalized[target], text);
  }
  return Object.keys(normalized).length ? { sections: normalized } : undefined;
}

export function createClinicalAnamnesis(sections: ClinicalAnamnesisSections): ClinicalAnamnesisV2 | undefined {
  const compact = Object.fromEntries(Object.entries(sections).filter(([code, text]) => isAnamnesisSectionCode(code) && typeof text === "string" && text.trim())) as ClinicalAnamnesisSections;
  return Object.keys(compact).length ? { sections: compact } : undefined;
}

export type AnamnesisSectionToggleAction = "activate" | "deactivate" | "keep";

export function resolveAnamnesisSectionToggle(active: boolean, content?: string, confirmRemoval: () => boolean = () => false): AnamnesisSectionToggleAction {
  if (!active) return "activate";
  if (!content?.trim()) return "deactivate";
  return confirmRemoval() ? "deactivate" : "keep";
}

export function isClinicalAnamnesisV2(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 1 && keys[0] === "sections" && record.sections && typeof record.sections === "object" && !Array.isArray(record.sections)) {
    return Object.entries(record.sections as Record<string, unknown>).every(([code, text]) => isAnamnesisSectionCode(code) && typeof text === "string");
  }
  const legacyKeys = new Set(Object.keys(legacyMapping));
  return keys.every((key) => legacyKeys.has(key)) && Object.values(record).every((text) => typeof text === "string");
}

export const normalizeAnamnesisSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it-IT").trim();
export function searchAnamnesisSections(query: string) {
  const normalized = normalizeAnamnesisSearch(query);
  return normalized ? anamnesisSectionRegistry.filter(({ label }) => normalizeAnamnesisSearch(label).includes(normalized)) : [];
}
