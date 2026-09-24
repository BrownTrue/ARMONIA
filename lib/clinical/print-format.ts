import type { AssessmentTestEntryV1, ClinicalValue, LanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";

export const CLINICAL_LABELS: Record<string, string> = {
  family: "Famiglia",
  pediatrician: "Pediatra",
  neuropsychiatry: "Neuropsichiatria",
  school: "Scuola",
  other_professional: "Altro professionista",
  other: "Altro",
  expressive_difficulty: "Difficoltà espressive",
  comprehension_difficulty: "Difficoltà di comprensione",
  low_intelligibility: "Linguaggio poco intelligibile",
  late_language_emergence: "Ritardo nell’emergere del linguaggio",
  communication_difficulty: "Difficoltà comunicative",
  school_referral: "Segnalazione scolastica",
  professional_referral: "Invio da altro professionista",
  review: "Controllo / rivalutazione",
  typical: "Nella norma",
  relevant: "Elementi rilevanti",
  reported_delay: "Ritardo riferito",
  investigate: "Da approfondire",
  no_reported_difficulty: "Nessuna difficoltà riferita",
  recurrent_otitis: "Otiti ricorrenti",
  audiology_assessments: "Accertamenti audiologici",
  reported_difficulty: "Difficoltà riferite",
  adequate: "Adeguata",
  partly_adequate: "Parzialmente adeguata",
  difficulty_observed: "Difficoltà osservate",
  present: "Presente",
  inconsistent: "Discontinua",
  reduced: "Ridotta",
  mild_difficulty: "Lieve difficoltà",
  significant_difficulty: "Difficoltà significativa",
  vocalizations: "Vocalizzazioni",
  single_word: "Parola singola",
  combinations: "Combinazioni",
  simple_sentence: "Frase semplice",
  complex_sentence: "Frase complessa",
  spontaneous_language: "Linguaggio spontaneo",
  good: "Buona",
  fair: "Discreta",
  severely_reduced: "Fortemente ridotta",
  difficulty: "Difficoltà",
};

export const hasPrintableValue = (value: unknown) => {
  if (Array.isArray(value)) return value.some(hasPrintableValue);
  return value !== undefined && value !== null && String(value).trim() !== "";
};

export function readableClinicalLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  return CLINICAL_LABELS[normalized]
    || `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).replaceAll("_", " ")}`;
}

export function printableLines(value?: string) {
  return value
    ? value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : [];
}

export function printableList(values?: string[]) {
  return (values || [])
    .flatMap(printableLines)
    .map((value) => readableClinicalLabel(value))
    .filter(Boolean);
}

export function formatClinicalValue(
  value?: ClinicalValue<string | number | string[]>,
  unavailableLabel = "Non disponibile",
) {
  if (!value) return undefined;
  if (value.availability === "not_available") return unavailableLabel;
  if (value.availability === "not_applicable") return "Non applicabile";
  const raw = value.value;
  const formatted = Array.isArray(raw)
    ? printableList(raw).join(", ")
    : typeof raw === "string"
      ? readableClinicalLabel(raw)
      : raw;
  const base = hasPrintableValue(formatted) ? String(formatted) : undefined;
  const note = value.note?.trim();
  return note ? (base ? `${base} — ${note}` : note) : base;
}

export function hasPrintableClinicalValue(value?: ClinicalValue<unknown>) {
  if (!value) return false;
  return value.availability === "not_available"
    || value.availability === "not_applicable"
    || hasPrintableValue(value.value)
    || Boolean(value.note?.trim());
}

export function printableTestHasContent(test: AssessmentTestEntryV1) {
  return Boolean(test.name?.trim() || test.date || test.area?.trim() || hasPrintableValue(test.rawScore) || hasPrintableValue(test.standardizedScore) || hasPrintableValue(test.percentile) || test.notes?.trim());
}

export function assessmentPrintVisibility(data: LanguageCommunicationAssessmentV1) {
  const access = data.accessReason || {}, anamnesis = data.anamnesis || {}, observation = data.observation || {}, tests = data.tests || {}, summary = data.summary || {}, goals = data.goals || {};
  return {
    access: Boolean(access.concerns?.some(hasPrintableValue) || hasPrintableClinicalValue(access.reportedBy) || access.description?.trim() || access.notes?.trim()),
    anamnesis: Boolean(hasPrintableClinicalValue(anamnesis.pregnancyBirth) || hasPrintableClinicalValue(anamnesis.motorDevelopment) || hasPrintableClinicalValue(anamnesis.firstWordsMonths) || hasPrintableClinicalValue(anamnesis.firstCombinationsMonths) || hasPrintableClinicalValue(anamnesis.hearing) || anamnesis.educational?.trim() || anamnesis.languages?.some(hasPrintableValue) || anamnesis.professionals?.some(hasPrintableValue) || anamnesis.unavailableAreas?.some(hasPrintableValue) || anamnesis.general?.trim() || anamnesis.developmental?.trim() || anamnesis.medical?.trim() || anamnesis.family?.trim() || anamnesis.notes?.trim()),
    observation: Boolean(hasPrintableClinicalValue(observation.communication) || hasPrintableClinicalValue(observation.communicativeIntent) || hasPrintableClinicalValue(observation.comprehensionProfile) || hasPrintableClinicalValue(observation.production) || hasPrintableClinicalValue(observation.intelligibility) || hasPrintableClinicalValue(observation.vocabulary) || hasPrintableClinicalValue(observation.morphosyntax) || hasPrintableClinicalValue(observation.pragmatics) || observation.context?.trim() || observation.communicationProfile?.trim() || observation.comprehension?.trim() || observation.expression?.trim() || observation.interaction?.trim() || observation.speech?.trim() || observation.observedFeatures?.length || observation.notes?.trim()),
    tests: Boolean(tests.notAdministered || tests.items?.some(printableTestHasContent) || tests.notes?.trim()),
    summary: Boolean(summary.clinicalSummary?.trim() || summary.strengths?.some(hasPrintableValue) || summary.difficulties?.some(hasPrintableValue) || summary.conclusions?.trim() || summary.recommendations?.trim() || summary.notes?.trim()),
    goals: Boolean(goals.planningNotes?.trim()),
  };
}
