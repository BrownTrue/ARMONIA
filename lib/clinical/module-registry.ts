import type { ComponentType } from "react";
import type { ClinicalAssessmentV2Data, ClinicalModuleInstance, LanguageOralModuleV1 } from "./assessment-v2.ts";

export type ClinicalPrintField = { label: string; value: string | string[] };
export type ClinicalPrintSection = { code: string; title: string; fields: ClinicalPrintField[] };
export type ClinicalModuleEditorProps<TData> = {
  value: TData;
  readOnly: boolean;
  onChange: (value: TData) => void;
};

export type ClinicalModuleDefinition<TData = unknown> = {
  code: string;
  version: number;
  label: string;
  createEmptyData: () => TData;
  validate: (value: unknown) => value is TData;
  editor?: ComponentType<ClinicalModuleEditorProps<TData>>;
  toPrintSections: (data: TData) => ClinicalPrintSection[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every((key) => keys.includes(key));
const isOptionalCodeArray = (value: unknown, allowed: ReadonlySet<string>) => value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string" && allowed.has(item)));
const isOptionalCode = (value: unknown, allowed: ReadonlySet<string>) => value === undefined || (typeof value === "string" && allowed.has(value));
const hasValidStatusAndNotes = (value: Record<string, unknown>) => typeof value.status === "string" && observationStatuses.has(value.status) && (value.notes === undefined || typeof value.notes === "string");

const observationStatuses = new Set(["no_evident_difficulty", "difficulties_observed", "further_assessment"]);
const comprehensionLevels = new Set(["isolated_words", "sentences", "verbal_requests", "complex_messages", "narratives", "inferential_language"]);
const difficultyFactors = new Set(["increased_length_complexity", "reduced_context", "information_load", "presentation_speed", "inferential_demand"]);
const facilitations = new Set(["repetition", "reformulation", "visual_support", "gestures", "contextualization", "segmentation", "additional_time"]);
const outputLevels = new Set(["absent_or_minimal", "isolated_words", "short_utterances", "sentences", "connected_speech"]);
const initiatives = new Set(["spontaneous", "prompted", "reduced", "variable"]);
const outputAmounts = new Set(["limited", "sufficient_for_context", "abundant", "variable"]);
const formulationFeatures = new Set(["difficulty_formulating_message", "frequent_restarts", "fragmented_output", "circumlocutory_output", "reduced_informativeness"]);
const lexicalAreas = new Set(["lexical_access", "naming", "lexical_selection", "vocabulary_use", "semantic_relations", "categorization"]);
const lexicalFeatures = new Set(["word_finding_difficulty", "reduced_lexical_variety", "imprecise_word_selection", "semantic_substitutions", "circumlocutions", "difficulty_semantic_organization"]);
const morphosyntaxAreas = new Set(["morphology", "sentence_structure", "syntactic_complexity", "grammatical_elements", "sentence_comprehension"]);
const morphosyntaxFeatures = new Set(["simplified_sentence_structure", "morphological_errors", "omitted_grammatical_elements", "agreement_errors", "reduced_syntactic_complexity", "difficulty_complex_structures"]);
const discourseContexts = new Set(["spontaneous_conversation", "description", "narration", "retelling", "procedural_discourse"]);
const discourseFeatures = new Set(["reduced_coherence", "reduced_cohesion", "sequencing_difficulty", "reduced_informativeness", "difficulty_maintaining_topic", "disorganized_content"]);
const earlyCommunicationAreas = new Set(["communicative_intent", "gestures", "joint_attention", "turn_taking", "imitation", "functional_play", "symbolic_play", "communicative_modalities", "early_verbal_productions"]);
const earlyCommunicationFeatures = new Set(["reduced_communicative_initiative", "limited_gesture_use", "joint_attention_difficulty", "turn_taking_difficulty", "limited_imitation", "limited_symbolic_play", "reliance_on_nonverbal_modalities"]);
const screeningStatuses = new Set(["no_relevant_concern", "further_assessment", "concern_observed"]);
const isScreening = (value: unknown) => isRecord(value) && hasOnlyKeys(value, ["status", "notes"]) && typeof value.status === "string" && screeningStatuses.has(value.status) && (value.notes === undefined || typeof value.notes === "string");

export function isLanguageOralModuleV1(value: unknown): value is LanguageOralModuleV1 {
  if (!isRecord(value) || !hasOnlyKeys(value, ["earlyCommunication", "comprehension", "production", "lexicalSemantics", "morphosyntax", "discourseNarrative", "intelligibilityScreening", "socialCommunicationScreening", "finalNote"])) return false;
  if (value.earlyCommunication !== undefined && (!isRecord(value.earlyCommunication) || !hasOnlyKeys(value.earlyCommunication, ["status", "observedAreas", "observedFeatures", "notes"])
    || !hasValidStatusAndNotes(value.earlyCommunication) || !isOptionalCodeArray(value.earlyCommunication.observedAreas, earlyCommunicationAreas) || !isOptionalCodeArray(value.earlyCommunication.observedFeatures, earlyCommunicationFeatures))) return false;
  if (value.comprehension !== undefined && (!isRecord(value.comprehension) || !hasOnlyKeys(value.comprehension, ["status", "exploredLevels", "difficultyFactors", "facilitations", "notes"])
    || !hasValidStatusAndNotes(value.comprehension)
    || !isOptionalCodeArray(value.comprehension.exploredLevels, comprehensionLevels)
    || !isOptionalCodeArray(value.comprehension.difficultyFactors, difficultyFactors)
    || !isOptionalCodeArray(value.comprehension.facilitations, facilitations))) return false;
  if (value.production !== undefined && (!isRecord(value.production) || !hasOnlyKeys(value.production, ["status", "outputLevel", "initiative", "verbalOutputAmount", "formulation", "notes"])
    || !hasValidStatusAndNotes(value.production) || !isOptionalCode(value.production.outputLevel, outputLevels) || !isOptionalCode(value.production.initiative, initiatives)
    || !isOptionalCode(value.production.verbalOutputAmount, outputAmounts) || !isOptionalCodeArray(value.production.formulation, formulationFeatures))) return false;
  if (value.lexicalSemantics !== undefined && (!isRecord(value.lexicalSemantics) || !hasOnlyKeys(value.lexicalSemantics, ["status", "observedAreas", "observedFeatures", "notes"])
    || !hasValidStatusAndNotes(value.lexicalSemantics) || !isOptionalCodeArray(value.lexicalSemantics.observedAreas, lexicalAreas) || !isOptionalCodeArray(value.lexicalSemantics.observedFeatures, lexicalFeatures))) return false;
  if (value.morphosyntax !== undefined && (!isRecord(value.morphosyntax) || !hasOnlyKeys(value.morphosyntax, ["status", "observedAreas", "observedFeatures", "notes"])
    || !hasValidStatusAndNotes(value.morphosyntax) || !isOptionalCodeArray(value.morphosyntax.observedAreas, morphosyntaxAreas) || !isOptionalCodeArray(value.morphosyntax.observedFeatures, morphosyntaxFeatures))) return false;
  if (value.discourseNarrative !== undefined && (!isRecord(value.discourseNarrative) || !hasOnlyKeys(value.discourseNarrative, ["status", "contextsExplored", "observedFeatures", "notes"])
    || !hasValidStatusAndNotes(value.discourseNarrative) || !isOptionalCodeArray(value.discourseNarrative.contextsExplored, discourseContexts) || !isOptionalCodeArray(value.discourseNarrative.observedFeatures, discourseFeatures))) return false;
  if (value.intelligibilityScreening !== undefined && !isScreening(value.intelligibilityScreening)) return false;
  if (value.socialCommunicationScreening !== undefined && !isScreening(value.socialCommunicationScreening)) return false;
  if (value.finalNote !== undefined && typeof value.finalNote !== "string") return false;
  return true;
}

export const LANGUAGE_ORAL_LABELS: Record<string, string> = {
  no_evident_difficulty: "Nessuna difficoltà evidente nel contesto osservato",
  difficulties_observed: "Difficoltà osservate",
  further_assessment: "Da approfondire",
  isolated_words: "Parole / significati isolati", sentences: "Frasi", verbal_requests: "Consegne / richieste verbali",
  complex_messages: "Discorso o messaggi complessi", narratives: "Narrazioni", inferential_language: "Linguaggio inferenziale / non esplicito",
  increased_length_complexity: "Aumento della lunghezza o complessità del messaggio", reduced_context: "Riduzione del supporto contestuale",
  information_load: "Maggiore quantità di informazioni da mantenere", presentation_speed: "Velocità di presentazione", inferential_demand: "Necessità di ricavare informazioni non esplicite",
  repetition: "Ripetizione", reformulation: "Riformulazione", visual_support: "Supporto visivo", gestures: "Gesti",
  contextualization: "Contestualizzazione", segmentation: "Segmentazione della richiesta", additional_time: "Tempo aggiuntivo",
  absent_or_minimal: "Assente o minima", short_utterances: "Enunciati brevi", connected_speech: "Discorso connesso",
  spontaneous: "Prevalentemente spontanea", prompted: "Prevalentemente su sollecitazione", reduced: "Ridotta", variable: "Variabile",
  limited: "Limitata", sufficient_for_context: "Sufficiente per il contesto osservato", abundant: "Abbondante",
  difficulty_formulating_message: "Difficoltà nella formulazione del messaggio", frequent_restarts: "Frequenti ripartenze/riformulazioni",
  fragmented_output: "Produzione frammentaria", circumlocutory_output: "Produzione circumlocutoria", reduced_informativeness: "Ridotta informatività",
  lexical_access: "Accesso lessicale", naming: "Denominazione", lexical_selection: "Selezione lessicale", vocabulary_use: "Uso del vocabolario",
  semantic_relations: "Relazioni semantiche", categorization: "Categorizzazione", word_finding_difficulty: "Difficoltà di recupero lessicale",
  reduced_lexical_variety: "Ridotta varietà lessicale", imprecise_word_selection: "Selezione lessicale imprecisa", semantic_substitutions: "Sostituzioni semantiche",
  circumlocutions: "Circonlocuzioni", difficulty_semantic_organization: "Difficoltà nell’organizzazione semantica",
  morphology: "Morfologia", sentence_structure: "Struttura della frase", syntactic_complexity: "Complessità sintattica",
  grammatical_elements: "Uso degli elementi grammaticali", sentence_comprehension: "Comprensione di strutture frasali",
  simplified_sentence_structure: "Struttura frasale semplificata", morphological_errors: "Errori morfologici",
  omitted_grammatical_elements: "Omissione di elementi grammaticali", agreement_errors: "Errori di accordo",
  reduced_syntactic_complexity: "Ridotta complessità sintattica", difficulty_complex_structures: "Difficoltà con strutture sintattiche complesse",
  spontaneous_conversation: "Conversazione spontanea", description: "Descrizione", narration: "Narrazione", retelling: "Racconto/rievocazione",
  procedural_discourse: "Discorso procedurale", reduced_coherence: "Coerenza ridotta", reduced_cohesion: "Coesione ridotta",
  sequencing_difficulty: "Difficoltà nella sequenzialità", difficulty_maintaining_topic: "Difficoltà nel mantenimento del tema",
  disorganized_content: "Organizzazione del contenuto poco efficace",
  communicative_intent: "Intenzionalità comunicativa", joint_attention: "Attenzione condivisa", turn_taking: "Turnazione", imitation: "Imitazione",
  functional_play: "Gioco funzionale", symbolic_play: "Gioco simbolico", communicative_modalities: "Modalità comunicative utilizzate",
  early_verbal_productions: "Prime produzioni verbali osservate", reduced_communicative_initiative: "Ridotta iniziativa comunicativa",
  limited_gesture_use: "Uso limitato dei gesti", joint_attention_difficulty: "Difficoltà nell’attenzione condivisa", turn_taking_difficulty: "Difficoltà nella turnazione",
  limited_imitation: "Imitazione ridotta", limited_symbolic_play: "Gioco simbolico limitato", reliance_on_nonverbal_modalities: "Prevalenza di modalità comunicative non verbali",
  no_relevant_concern: "Nessun elemento rilevante osservato", concern_observed: "Criticità osservata",
};
export const LANGUAGE_ORAL_OPTIONS = {
  statuses: ["no_evident_difficulty", "difficulties_observed", "further_assessment"],
  exploredLevels: ["isolated_words", "sentences", "verbal_requests", "complex_messages", "narratives", "inferential_language"],
  difficultyFactors: ["increased_length_complexity", "reduced_context", "information_load", "presentation_speed", "inferential_demand"],
  facilitations: ["repetition", "reformulation", "visual_support", "gestures", "contextualization", "segmentation", "additional_time"],
  outputLevels: ["absent_or_minimal", "isolated_words", "short_utterances", "sentences", "connected_speech"],
  initiatives: ["spontaneous", "prompted", "reduced", "variable"],
  outputAmounts: ["limited", "sufficient_for_context", "abundant", "variable"],
  formulationFeatures: ["difficulty_formulating_message", "frequent_restarts", "fragmented_output", "circumlocutory_output", "reduced_informativeness"],
  lexicalAreas: ["lexical_access", "naming", "lexical_selection", "vocabulary_use", "semantic_relations", "categorization"],
  lexicalFeatures: ["word_finding_difficulty", "reduced_lexical_variety", "imprecise_word_selection", "semantic_substitutions", "circumlocutions", "difficulty_semantic_organization"],
  morphosyntaxAreas: ["morphology", "sentence_structure", "syntactic_complexity", "grammatical_elements", "sentence_comprehension"],
  morphosyntaxFeatures: ["simplified_sentence_structure", "morphological_errors", "omitted_grammatical_elements", "agreement_errors", "reduced_syntactic_complexity", "difficulty_complex_structures"],
  discourseContexts: ["spontaneous_conversation", "description", "narration", "retelling", "procedural_discourse"],
  discourseFeatures: ["reduced_coherence", "reduced_cohesion", "sequencing_difficulty", "reduced_informativeness", "difficulty_maintaining_topic", "disorganized_content"],
  earlyCommunicationAreas: ["communicative_intent", "gestures", "joint_attention", "turn_taking", "imitation", "functional_play", "symbolic_play", "communicative_modalities", "early_verbal_productions"],
  earlyCommunicationFeatures: ["reduced_communicative_initiative", "limited_gesture_use", "joint_attention_difficulty", "turn_taking_difficulty", "limited_imitation", "limited_symbolic_play", "reliance_on_nonverbal_modalities"],
  screeningStatuses: ["no_relevant_concern", "further_assessment", "concern_observed"],
} as const;
export const LANGUAGE_ORAL_PRODUCTION_LABELS: Record<string, string> = {
  ...LANGUAGE_ORAL_LABELS,
  isolated_words: "Parole isolate",
};
export const LANGUAGE_ORAL_EARLY_LABELS: Record<string, string> = {
  ...LANGUAGE_ORAL_LABELS,
  gestures: "Uso dei gesti",
};

const printField = (label: string, value?: string | string[]) => value && (!Array.isArray(value) || value.length) ? [{ label, value }] : [];
const printDomain = (code: string, title: string, domain: { status: string; notes?: string } | undefined, details: ClinicalPrintField[]) => domain ? [{
  code, title, fields: [
    { label: "Osservazione generale", value: LANGUAGE_ORAL_LABELS[domain.status] },
    ...details,
    ...printField("Osservazioni", domain.notes?.trim()),
  ],
}] : [];

const languageOralV1: ClinicalModuleDefinition<LanguageOralModuleV1> = {
  code: "language_oral",
  version: 1,
  label: "Linguaggio orale",
  createEmptyData: () => ({}),
  validate: isLanguageOralModuleV1,
  toPrintSections: (data) => [
    ...printDomain("language_oral.early_communication", "Sviluppo comunicativo-linguistico precoce", data.earlyCommunication, [
      ...printField("Aspetti esplorati", data.earlyCommunication?.observedAreas?.map((code) => LANGUAGE_ORAL_EARLY_LABELS[code])),
      ...printField("Caratteristiche osservate", data.earlyCommunication?.observedFeatures?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.comprehension", "Comprensione linguistica", data.comprehension, [
      ...printField("Livelli esplorati", data.comprehension?.exploredLevels?.map((code) => LANGUAGE_ORAL_LABELS[code])),
      ...printField("Fattori associati a maggiore difficoltà", data.comprehension?.difficultyFactors?.map((code) => LANGUAGE_ORAL_LABELS[code])),
      ...printField("Facilitazioni osservate", data.comprehension?.facilitations?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.production", "Produzione linguistica", data.production, [
      ...printField("Livello prevalente", data.production?.outputLevel ? LANGUAGE_ORAL_PRODUCTION_LABELS[data.production.outputLevel] : undefined),
      ...printField("Iniziativa comunicativo-verbale", data.production?.initiative ? LANGUAGE_ORAL_LABELS[data.production.initiative] : undefined),
      ...printField("Quantità dell’output verbale", data.production?.verbalOutputAmount ? LANGUAGE_ORAL_LABELS[data.production.verbalOutputAmount] : undefined),
      ...printField("Formulazione globale", data.production?.formulation?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.lexical_semantics", "Lessico-semantica", data.lexicalSemantics, [
      ...printField("Aspetti esplorati", data.lexicalSemantics?.observedAreas?.map((code) => LANGUAGE_ORAL_LABELS[code])),
      ...printField("Caratteristiche osservate", data.lexicalSemantics?.observedFeatures?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.morphosyntax", "Morfosintassi", data.morphosyntax, [
      ...printField("Aspetti esplorati", data.morphosyntax?.observedAreas?.map((code) => LANGUAGE_ORAL_LABELS[code])),
      ...printField("Caratteristiche osservate", data.morphosyntax?.observedFeatures?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.discourse_narrative", "Discorso e narrazione", data.discourseNarrative, [
      ...printField("Contesti esplorati", data.discourseNarrative?.contextsExplored?.map((code) => LANGUAGE_ORAL_LABELS[code])),
      ...printField("Caratteristiche osservate", data.discourseNarrative?.observedFeatures?.map((code) => LANGUAGE_ORAL_LABELS[code])),
    ]),
    ...printDomain("language_oral.intelligibility_screening", "Segnalazione — Intelligibilità del parlato", data.intelligibilityScreening, []),
    ...printDomain("language_oral.social_communication_screening", "Segnalazione — Comunicazione sociale e pragmatica", data.socialCommunicationScreening, []),
    ...(data.finalNote?.trim() ? [{ code: "language_oral.final_note", title: "Nota conclusiva sul linguaggio orale", fields: [{ label: "Nota", value: data.finalNote.trim() }] }] : []),
  ],
};

const definitions = [languageOralV1] as const;

export function getClinicalModuleDefinition(code: string, version: number) {
  return definitions.find((definition) => definition.code === code && definition.version === version);
}

export function isRegisteredClinicalModule(instance: ClinicalModuleInstance) {
  const definition = getClinicalModuleDefinition(instance.code, instance.version);
  return Boolean(definition && definition.validate(instance.data));
}

export function createClinicalModuleInstance(code: string, version: number): ClinicalModuleInstance {
  const definition = getClinicalModuleDefinition(code, version);
  if (!definition) throw new Error(`Modulo clinico non supportato: ${code} V${version}.`);
  return { code, version, data: definition.createEmptyData() };
}

export const clinicalModuleRegistry = definitions;

const commonPrintSection = (code: string, title: string, fields: ClinicalPrintField[]) => fields.length ? [{ code, title, fields }] : [];

export function toClinicalAssessmentV2PrintSections(data: ClinicalAssessmentV2Data): ClinicalPrintSection[] {
  return [
    ...commonPrintSection("access_reason", "Motivo dell’accesso", [
      ...printField("Motivo della valutazione", data.accessReason?.reason?.trim()),
      ...printField("Inviante / modalità di accesso", data.accessReason?.referralSource?.trim()),
      ...printField("Informazioni riferite da", data.accessReason?.reportedBy?.trim()),
      ...printField("Contesto iniziale rilevante", data.accessReason?.relevantContext?.trim()),
    ]),
    ...commonPrintSection("anamnesis", "Anamnesi", [
      ...printField("Storia clinica rilevante", data.anamnesis?.relevantClinicalHistory?.trim()),
      ...printField("Sviluppo e storia personale", data.anamnesis?.developmentAndHistory?.trim()),
      ...printField("Contesto scolastico, formativo o lavorativo", data.anamnesis?.educationWorkContext?.trim()),
      ...printField("Contesto familiare e sociale", data.anamnesis?.familySocialContext?.trim()),
      ...printField("Valutazioni o interventi precedenti", data.anamnesis?.previousAssessmentsInterventions?.trim()),
      ...printField("Altre informazioni", data.anamnesis?.additionalNotes?.trim()),
    ]),
    ...data.modules.flatMap((module) => getClinicalModuleDefinition(module.code, module.version)?.validate(module.data)
      ? getClinicalModuleDefinition(module.code, module.version)!.toPrintSections(module.data as never) : []),
    ...commonPrintSection("tests", "Test / strumenti", [
      ...(data.tests?.notAdministered ? [{ label: "Somministrazione", value: "Test non somministrati" }] : []),
      ...(data.tests?.items || []).map((item) => ({ label: item.name?.trim() || "Test / strumento", value: [item.date, item.area, item.rawScore !== undefined ? `Punteggio grezzo: ${item.rawScore}` : undefined, item.standardizedScore !== undefined ? `Punteggio standardizzato: ${item.standardizedScore}` : undefined, item.percentile !== undefined ? `Percentile: ${item.percentile}` : undefined, item.notes].filter((value): value is string => Boolean(value)) })),
      ...printField("Note generali", data.tests?.notes?.trim()),
    ]),
    ...commonPrintSection("summary", "Sintesi", [
      ...printField("Sintesi clinica", data.summary?.clinicalSummary?.trim()),
      ...printField("Punti di forza", data.summary?.strengths),
      ...printField("Difficoltà / aspetti rilevanti", data.summary?.difficulties),
      ...printField("Conclusioni", data.summary?.conclusions?.trim()),
      ...printField("Indicazioni / raccomandazioni", data.summary?.recommendations?.trim()),
      ...printField("Note", data.summary?.notes?.trim()),
    ]),
    ...commonPrintSection("planning", "Pianificazione", printField("Note di pianificazione", data.planning?.notes?.trim())),
  ];
}
