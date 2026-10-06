import type { ClinicalValue } from "./assessment-v1.ts";
import { clinicalAssessmentTypeLabel } from "./assessment-v2.ts";
import { getClinicalModuleDefinition, toClinicalAssessmentV2PrintSections } from "./module-registry.ts";
import { assessmentPrintVisibility, formatClinicalValue, hasPrintableValue, printableList, printableTestHasContent, readableClinicalLabel } from "./print-format.ts";
import type { ClinicalAssessment, ClinicalAssessmentV1, ClinicalAssessmentV2 } from "./types.ts";
import type { Goal, Profile } from "../types.ts";

export type AssessmentPrintField = { label: string; value: string | string[]; emphasis?: boolean };
export type AssessmentPrintSubsection = { code: string; title?: string; fields: AssessmentPrintField[] };
export type AssessmentPrintGroup = { code: string; number?: string; title: string; sections: AssessmentPrintSubsection[] };
export type AssessmentPrintSection = { code: string; number: string; title: string; fields: AssessmentPrintField[]; groups: AssessmentPrintGroup[] };
export type AssessmentPrintModel = {
  schemaVersion: 1 | 2;
  title: string;
  subtitle: string;
  pathwayTitle: string;
  patientName: string;
  clinicalDate: string;
  professionalName: string;
  profession?: string;
  studio?: string;
  logoSrc?: string;
  generatedOn: string;
  footerLabel: string;
  sections: AssessmentPrintSection[];
};

type AssessmentPrintModelInput = {
  patientName: string;
  assessment: ClinicalAssessment;
  pathwayTitle?: string;
  professional?: Profile;
  logoSrc?: string;
  goals?: Goal[];
  generatedAt?: Date | string;
};

export function buildAssessmentPrintModel(input: AssessmentPrintModelInput): AssessmentPrintModel {
  const generatedAt = typeof input.generatedAt === "string" ? new Date(input.generatedAt) : input.generatedAt || new Date();
  if (Number.isNaN(generatedAt.getTime())) throw new Error("assessment_print_date_invalid");
  const professionalName = [input.professional?.firstName, input.professional?.lastName].filter(Boolean).join(" ") || "Armonia";
  const shared = {
    patientName: input.patientName,
    pathwayTitle: input.pathwayTitle?.trim() || "Percorso clinico",
    clinicalDate: formatDate(input.assessment.clinicalDate),
    professionalName,
    profession: clean(input.professional?.profession),
    studio: clean(input.professional?.studio),
    logoSrc: input.logoSrc,
    generatedOn: formatDateOnly(generatedAt),
  };
  return input.assessment.schemaVersion === 1
    ? buildV1Model(input.assessment, shared)
    : buildV2Model(input.assessment, input.goals || [], shared);
}

function buildV1Model(assessment: ClinicalAssessmentV1, shared: Omit<AssessmentPrintModel, "schemaVersion" | "title" | "subtitle" | "footerLabel" | "sections">): AssessmentPrintModel {
  const data = assessment.data;
  const access = data.accessReason || {}, anamnesis = data.anamnesis || {}, observation = data.observation || {}, tests = data.tests || {}, summary = data.summary || {}, goals = data.goals || {};
  const visible = assessmentPrintVisibility(data);
  const sections = [
    section("access", "01", "Motivo dell’accesso", visible.access, [
      field("Motivazioni riferite", printableList(access.concerns)),
      field("Chi richiede o invia", formatClinicalValue(access.reportedBy)),
      field("Descrizione", access.description, true), field("Note", access.notes),
    ]),
    section("anamnesis", "02", "Anamnesi", visible.anamnesis, [
      field("Gravidanza e parto", formatClinicalValue(anamnesis.pregnancyBirth)), field("Sviluppo motorio", formatClinicalValue(anamnesis.motorDevelopment)),
      field("Prime parole", monthsValue(anamnesis.firstWordsMonths)), field("Prime combinazioni", monthsValue(anamnesis.firstCombinationsMonths)),
      field("Udito", formatClinicalValue(anamnesis.hearing)), field("Scolarizzazione", anamnesis.educational),
      field("Lingue parlate in famiglia", printableList(anamnesis.languages)), field("Altri professionisti coinvolti", printableList(anamnesis.professionals)),
      field("Aree non disponibili", printableList(anamnesis.unavailableAreas)), field("Anamnesi generale", anamnesis.general),
      field("Sviluppo", anamnesis.developmental), field("Aspetti medici", anamnesis.medical), field("Contesto familiare", anamnesis.family), field("Note", anamnesis.notes),
    ]),
    section("observation", "03", "Osservazione", visible.observation, [
      field("Comunicazione", formatClinicalValue(observation.communication, "Non valutata")), field("Intenzionalità comunicativa", formatClinicalValue(observation.communicativeIntent, "Non valutata")),
      field("Comprensione", formatClinicalValue(observation.comprehensionProfile, "Non valutata")), field("Produzione", formatClinicalValue(observation.production, "Non valutata")),
      field("Intelligibilità", formatClinicalValue(observation.intelligibility, "Non valutabile")), field("Lessico", formatClinicalValue(observation.vocabulary, "Non valutato")),
      field("Morfosintassi", formatClinicalValue(observation.morphosyntax, "Non valutata")), field("Pragmatica", formatClinicalValue(observation.pragmatics, "Non valutata")),
      field("Contesto", observation.context), field("Profilo comunicativo", observation.communicationProfile), field("Comprensione - note", observation.comprehension),
      field("Espressione", observation.expression), field("Interazione", observation.interaction), field("Eloquio", observation.speech),
      field("Elementi osservati", observation.observedFeatures?.map((item) => item.label?.trim() || readableClinicalLabel(item.code))), field("Note", observation.notes),
    ]),
    section("tests", "04", "Test e strumenti", visible.tests, [field("Somministrazione", tests.notAdministered ? "Test non somministrati" : undefined), field("Note generali", tests.notes)],
      (tests.items || []).filter(printableTestHasContent).map((test, index) => ({ code: test.id, number: String(index + 1).padStart(2, "0"), title: test.name?.trim() || test.acronymSnapshot?.trim() || test.nameSnapshot?.trim() || `Test ${index + 1}`, sections: [{ code: `${test.id}.details`, fields: compactFields([
        field("Versione", test.versionSnapshot), field("Area", test.area || test.areaSnapshot), field("Data", test.date ? formatDate(test.date) : undefined),
        field("Punteggio grezzo", test.rawScore), field("Punteggio standardizzato", test.standardizedScore), field("Percentile", test.percentile), field("Note", test.notes),
      ]) }] }))),
    section("summary", "05", "Sintesi clinica", visible.summary, [
      field("Sintesi", summary.clinicalSummary, true), field("Punti di forza", printableList(summary.strengths)), field("Difficoltà", printableList(summary.difficulties)),
      field("Conclusioni", summary.conclusions, true), field("Raccomandazioni", summary.recommendations), field("Note", summary.notes),
    ]),
    section("planning", "06", "Obiettivi e pianificazione", visible.goals, [field("Note di pianificazione", goals.planningNotes, true)]),
  ].filter((item): item is AssessmentPrintSection => Boolean(item));
  return { ...shared, schemaVersion: 1, title: "Prima valutazione", subtitle: "Linguaggio e comunicazione", footerLabel: `Valutazione clinica · ${shared.patientName}`, sections };
}

function buildV2Model(assessment: ClinicalAssessmentV2, goals: Goal[], shared: Omit<AssessmentPrintModel, "schemaVersion" | "title" | "subtitle" | "footerLabel" | "sections">): AssessmentPrintModel {
  const all = toClinicalAssessmentV2PrintSections(assessment.data);
  const commonFields = (code: string) => (all.find((item) => item.code === code)?.fields || []).map((item) => field(item.label, item.value)).filter((item): item is AssessmentPrintField => Boolean(item));
  const moduleGroups = assessment.data.modules.flatMap((module, moduleIndex) => {
    const definition = getClinicalModuleDefinition(module.code, module.version);
    if (!definition?.validate(module.data)) return [];
    const sections = definition.toPrintSections(module.data as never).map((item) => ({ code: item.code, title: item.title, fields: item.fields.map((entry) => field(entry.label, entry.value)).filter((entry): entry is AssessmentPrintField => Boolean(entry)) })).filter((item) => item.fields.length);
    return sections.length ? [{ code: `${module.code}@${module.version}`, number: `3.${moduleIndex + 1}`, title: definition.label, sections }] : [];
  });
  const planning = [...commonFields("planning"), ...(goals.length ? [{ label: "Obiettivi del percorso", value: goals.map((goal) => `${goal.title} · ${goal.progress}%`) }] : [])];
  const sections = [
    section("access_reason", "01", "Motivo dell’accesso", true, commonFields("access_reason")),
    section("anamnesis", "02", "Anamnesi", true, commonFields("anamnesis")),
    section("clinical_areas", "03", "Aree cliniche", moduleGroups.length > 0, [], moduleGroups),
    section("tests", "04", "Test / strumenti", true, commonFields("tests")),
    section("summary", "05", "Sintesi", true, commonFields("summary")),
    section("planning", "06", "Obiettivi / pianificazione", true, planning),
  ].filter((item): item is AssessmentPrintSection => Boolean(item));
  const title = clinicalAssessmentTypeLabel(assessment.assessmentType);
  return { ...shared, schemaVersion: 2, title, subtitle: "Valutazione clinica", footerLabel: `${title} · ${shared.patientName}`, sections };
}

function section(code: string, number: string, title: string, visible: boolean, fields: Array<AssessmentPrintField | undefined>, groups: AssessmentPrintGroup[] = []): AssessmentPrintSection | undefined {
  if (!visible) return undefined;
  const compact = compactFields(fields);
  if (!compact.length && !groups.length) return undefined;
  return { code, number, title, fields: compact, groups };
}

function field(label: string, value?: string | number | string[], emphasis = false): AssessmentPrintField | undefined {
  const normalized = Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : typeof value === "string" ? value.trim() : value;
  if (!hasPrintableValue(normalized)) return undefined;
  return { label, value: typeof normalized === "number" ? String(normalized) : normalized as string | string[], ...(emphasis ? { emphasis: true } : {}) };
}

function compactFields(fields: Array<AssessmentPrintField | undefined>) { return fields.filter((item): item is AssessmentPrintField => Boolean(item)); }
function clean(value?: string) { return value?.trim() || undefined; }
function formatDate(value?: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }) : "Non indicata"; }
function formatDateOnly(value: Date) { return value.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }); }
function monthsValue(value?: ClinicalValue<number>) {
  if (!value) return undefined;
  if (value.availability === "not_available") return "Non disponibile";
  if (value.availability === "not_applicable") return "Non applicabile";
  const base = hasPrintableValue(value.value) ? `${value.value} mesi` : undefined;
  const note = value.note?.trim();
  return note ? (base ? `${base} — ${note}` : note) : base;
}
