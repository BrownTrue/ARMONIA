import type {
  AssessmentTestEntryV1,
  ClinicalChoice,
  ClinicalValue,
  LanguageCommunicationAssessmentV1,
} from "./assessment-v1.ts";
import type { ClinicalAssessment, ClinicalPathway } from "./types.ts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AVAILABILITY = new Set(["available", "not_available", "not_applicable"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";
const isOptionalBoolean = (value: unknown) => value === undefined || typeof value === "boolean";
const isOptionalScore = (value: unknown) =>
  value === undefined || typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
const isStringArray = (value: unknown) =>
  value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isClinicalValue(value: unknown, isValue: (item: unknown) => boolean = isOptionalString): value is ClinicalValue<unknown> {
  if (!isRecord(value)) return false;
  return (value.value === undefined || isValue(value.value))
    && (value.availability === undefined || AVAILABILITY.has(value.availability as string))
    && isOptionalString(value.note);
}

const isFiniteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isStringList = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string");

function isClinicalChoice(value: unknown): value is ClinicalChoice {
  return isRecord(value) && typeof value.code === "string" && isOptionalString(value.label);
}

function isTestEntry(value: unknown): value is AssessmentTestEntryV1 {
  return isRecord(value)
    && typeof value.id === "string"
    && isOptionalString(value.name)
    && (value.date === undefined || isIsoDate(value.date))
    && isOptionalString(value.area)
    && isOptionalScore(value.rawScore)
    && isOptionalScore(value.standardizedScore)
    && isOptionalScore(value.percentile)
    && isOptionalString(value.notes);
}

export function isLanguageCommunicationPayloadV1(value: unknown): value is LanguageCommunicationAssessmentV1 {
  if (!isRecord(value)) return false;
  const { accessReason, anamnesis, observation, tests, summary, goals } = value;
  if (accessReason !== undefined && (!isRecord(accessReason)
    || (accessReason.reportedBy !== undefined && !isClinicalValue(accessReason.reportedBy))
    || !isOptionalString(accessReason.description)
    || !isStringArray(accessReason.concerns)
    || !isOptionalString(accessReason.notes))) return false;
  if (anamnesis !== undefined && (!isRecord(anamnesis)
    || (anamnesis.pregnancyBirth !== undefined && !isClinicalValue(anamnesis.pregnancyBirth, (item) => typeof item === "string"))
    || (anamnesis.motorDevelopment !== undefined && !isClinicalValue(anamnesis.motorDevelopment, (item) => typeof item === "string"))
    || (anamnesis.firstWordsMonths !== undefined && !isClinicalValue(anamnesis.firstWordsMonths, isFiniteNumber))
    || (anamnesis.firstCombinationsMonths !== undefined && !isClinicalValue(anamnesis.firstCombinationsMonths, isFiniteNumber))
    || (anamnesis.hearing !== undefined && !isClinicalValue(anamnesis.hearing, isStringList))
    || !isStringArray(anamnesis.professionals)
    || !isOptionalString(anamnesis.general)
    || !isOptionalString(anamnesis.developmental)
    || !isOptionalString(anamnesis.medical)
    || !isOptionalString(anamnesis.family)
    || !isOptionalString(anamnesis.educational)
    || !isStringArray(anamnesis.languages)
    || !isStringArray(anamnesis.unavailableAreas)
    || !isOptionalString(anamnesis.notes))) return false;
  if (observation !== undefined && (!isRecord(observation)
    || (observation.communication !== undefined && !isClinicalValue(observation.communication, (item) => typeof item === "string"))
    || (observation.communicativeIntent !== undefined && !isClinicalValue(observation.communicativeIntent, (item) => typeof item === "string"))
    || (observation.comprehensionProfile !== undefined && !isClinicalValue(observation.comprehensionProfile, (item) => typeof item === "string"))
    || (observation.production !== undefined && !isClinicalValue(observation.production, isStringList))
    || (observation.intelligibility !== undefined && !isClinicalValue(observation.intelligibility, (item) => typeof item === "string"))
    || (observation.vocabulary !== undefined && !isClinicalValue(observation.vocabulary, (item) => typeof item === "string"))
    || (observation.morphosyntax !== undefined && !isClinicalValue(observation.morphosyntax, (item) => typeof item === "string"))
    || (observation.pragmatics !== undefined && !isClinicalValue(observation.pragmatics, (item) => typeof item === "string"))
    || !isOptionalString(observation.context)
    || !isOptionalString(observation.communicationProfile)
    || !isOptionalString(observation.comprehension)
    || !isOptionalString(observation.expression)
    || !isOptionalString(observation.interaction)
    || !isOptionalString(observation.speech)
    || (observation.observedFeatures !== undefined && (!Array.isArray(observation.observedFeatures) || !observation.observedFeatures.every(isClinicalChoice)))
    || !isOptionalString(observation.notes))) return false;
  if (tests !== undefined && (!isRecord(tests)
    || (tests.items !== undefined && (!Array.isArray(tests.items) || !tests.items.every(isTestEntry)))
    || !isOptionalBoolean(tests.notAdministered)
    || !isOptionalString(tests.notes))) return false;
  if (summary !== undefined && (!isRecord(summary)
    || !isOptionalString(summary.clinicalSummary)
    || !isStringArray(summary.strengths)
    || !isStringArray(summary.difficulties)
    || !isOptionalString(summary.conclusions)
    || !isOptionalString(summary.recommendations)
    || !isOptionalString(summary.notes))) return false;
  if (goals !== undefined && (!isRecord(goals) || !isOptionalString(goals.planningNotes))) return false;
  return true;
}

export function isClinicalAssessment(value: unknown): value is ClinicalAssessment {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && typeof value.patientId === "string"
    && typeof value.clinicalPathwayId === "string"
    && value.moduleType === "language_communication"
    && value.assessmentType === "initial"
    && (value.status === "draft" || value.status === "completed")
    && value.schemaVersion === 1
    && (value.clinicalDate === undefined || isIsoDate(value.clinicalDate))
    && isLanguageCommunicationPayloadV1(value.data)
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string";
}

export function validateAssessmentForCompletion(assessment: unknown): asserts assessment is ClinicalAssessment {
  if (!isClinicalAssessment(assessment)) throw new Error("La valutazione non è compatibile con language_communication V1.");
  if (!assessment.clinicalDate) throw new Error("La data clinica è obbligatoria per completare la valutazione.");
}

export function validateClinicalPathway(pathway: ClinicalPathway) {
  if (!pathway.id || !pathway.patientId) throw new Error("Percorso clinico non valido.");
  if (pathway.status !== "active" && pathway.status !== "closed") throw new Error("Lo stato del percorso clinico non è valido.");
  if (!isIsoDate(pathway.startedOn)) throw new Error("La data di inizio del percorso non è valida.");
  if (pathway.closedOn !== undefined && !isIsoDate(pathway.closedOn)) throw new Error("La data di chiusura del percorso non è valida.");
  if (pathway.closedOn && pathway.closedOn < pathway.startedOn) throw new Error("La data di chiusura non può precedere la data di inizio.");
  if (pathway.status === "active" && pathway.closedOn) throw new Error("Un percorso attivo non può avere una data di chiusura.");
  if (pathway.status === "closed" && !pathway.closedOn) throw new Error("Un percorso chiuso deve avere una data di chiusura.");
}
