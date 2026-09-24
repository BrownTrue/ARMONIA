import { uid } from "../types.ts";
import type { ClinicalAssessmentTypeV2, ClinicalAssessmentV2 } from "./types.ts";
import type { AssessmentTestEntryV1 } from "./assessment-v1.ts";
import { createClinicalModuleInstance, getClinicalModuleDefinition } from "./module-registry.ts";

export type ClinicalModuleInstance = {
  code: string;
  version: number;
  data: unknown;
};

export const INITIAL_ASSESSMENT_STEP = 0;
export const clinicalAssessmentTypeLabel = (type: ClinicalAssessmentTypeV2) => ({ initial: "Prima valutazione", reassessment: "Rivalutazione", interim: "Valutazione intermedia", other: "Valutazione" })[type];
export const isClinicalAssessmentV2ReadOnly = (assessment: ClinicalAssessmentV2, correcting = false) => assessment.status === "completed" && !correcting;
export const shouldAutosaveClinicalAssessmentV2 = (assessment: ClinicalAssessmentV2, correcting = false) => assessment.status === "draft" && !correcting;

export type LanguageOralComprehensionStatus = "no_evident_difficulty" | "difficulties_observed" | "further_assessment";
export type LanguageOralObservationStatus = LanguageOralComprehensionStatus;
export type LanguageOralComprehensionLevel = "isolated_words" | "sentences" | "verbal_requests" | "complex_messages" | "narratives" | "inferential_language";
export type LanguageOralDifficultyFactor = "increased_length_complexity" | "reduced_context" | "information_load" | "presentation_speed" | "inferential_demand";
export type LanguageOralFacilitation = "repetition" | "reformulation" | "visual_support" | "gestures" | "contextualization" | "segmentation" | "additional_time";
export type LanguageOralOutputLevel = "absent_or_minimal" | "isolated_words" | "short_utterances" | "sentences" | "connected_speech";
export type LanguageOralInitiative = "spontaneous" | "prompted" | "reduced" | "variable";
export type LanguageOralOutputAmount = "limited" | "sufficient_for_context" | "abundant" | "variable";
export type LanguageOralFormulationFeature = "difficulty_formulating_message" | "frequent_restarts" | "fragmented_output" | "circumlocutory_output" | "reduced_informativeness";
export type LanguageOralLexicalArea = "lexical_access" | "naming" | "lexical_selection" | "vocabulary_use" | "semantic_relations" | "categorization";
export type LanguageOralLexicalFeature = "word_finding_difficulty" | "reduced_lexical_variety" | "imprecise_word_selection" | "semantic_substitutions" | "circumlocutions" | "difficulty_semantic_organization";
export type LanguageOralMorphosyntaxArea = "morphology" | "sentence_structure" | "syntactic_complexity" | "grammatical_elements" | "sentence_comprehension";
export type LanguageOralMorphosyntaxFeature = "simplified_sentence_structure" | "morphological_errors" | "omitted_grammatical_elements" | "agreement_errors" | "reduced_syntactic_complexity" | "difficulty_complex_structures";
export type LanguageOralDiscourseContext = "spontaneous_conversation" | "description" | "narration" | "retelling" | "procedural_discourse";
export type LanguageOralDiscourseFeature = "reduced_coherence" | "reduced_cohesion" | "sequencing_difficulty" | "reduced_informativeness" | "difficulty_maintaining_topic" | "disorganized_content";
export type LanguageOralEarlyCommunicationArea = "communicative_intent" | "gestures" | "joint_attention" | "turn_taking" | "imitation" | "functional_play" | "symbolic_play" | "communicative_modalities" | "early_verbal_productions";
export type LanguageOralEarlyCommunicationFeature = "reduced_communicative_initiative" | "limited_gesture_use" | "joint_attention_difficulty" | "turn_taking_difficulty" | "limited_imitation" | "limited_symbolic_play" | "reliance_on_nonverbal_modalities";
export type LanguageOralScreeningStatus = "no_relevant_concern" | "further_assessment" | "concern_observed";
export type ClinicalObservationStatus = LanguageOralObservationStatus;
export type SpeechSoundArea = "phonetic_inventory" | "articulation" | "phonological_organization" | "error_consistency" | "intelligibility" | "stimulability";
export type SpeechSoundFeature = "omissions" | "substitutions" | "distortions" | "additions" | "phonological_patterns" | "inconsistent_errors" | "reduced_intelligibility" | "limited_stimulability";
export type SpeechSoundModuleV1 = { profile?: { status: ClinicalObservationStatus; exploredAreas?: SpeechSoundArea[]; observedFeatures?: SpeechSoundFeature[]; notes?: string } };
export type FluencyContext = "spontaneous_speech" | "conversation" | "narration" | "reading" | "structured_task";
export type FluencyFeature = "sound_syllable_repetitions" | "word_repetitions" | "prolongations" | "blocks" | "interjections" | "revisions" | "irregular_rate" | "rapid_rate";
export type FluencyAssociatedFeature = "visible_tension" | "secondary_behaviors" | "avoidance" | "communicative_impact" | "variability_by_context";
export type FluencyModuleV1 = { profile?: { status: ClinicalObservationStatus; contextsExplored?: FluencyContext[]; observedFeatures?: FluencyFeature[]; associatedFeatures?: FluencyAssociatedFeature[]; notes?: string } };
export type VoiceContext = "conversation" | "sustained_phonation" | "reading" | "increased_vocal_demand" | "professional_voice_use";
export type VoiceAspect = "vocal_quality" | "pitch" | "loudness" | "endurance" | "phonatory_onset" | "respiratory_phonatory_coordination" | "functional_voice_use";
export type VoiceFeature = "roughness" | "breathiness" | "strain" | "weak_voice" | "reduced_projection" | "pitch_alteration" | "vocal_fatigue" | "intermittent_voice" | "aphonia_episodes" | "coordination_difficulty";
export type VoiceModuleV1 = { profile?: { status: ClinicalObservationStatus; contextsExplored?: VoiceContext[]; exploredAspects?: VoiceAspect[]; observedFeatures?: VoiceFeature[]; notes?: string } };
export type MotorSpeechContext = "spontaneous_speech" | "conversation" | "repetition" | "automatic_sequences" | "reading" | "structured_speech_task";
export type MotorSpeechAspect = "speech_initiation" | "motor_planning" | "movement_sequencing" | "articulatory_precision" | "speech_rate" | "prosody" | "respiratory_phonatory_coordination" | "speech_motor_consistency";
export type MotorSpeechFeature = "initiation_difficulty" | "articulatory_imprecision" | "inconsistent_productions" | "sequencing_difficulty" | "articulatory_groping" | "reduced_rate" | "increased_rate" | "altered_prosody" | "reduced_coordination" | "reduced_intelligibility";
export type MotorSpeechModuleV1 = { profile?: { status: ClinicalObservationStatus; contextsExplored?: MotorSpeechContext[]; exploredAspects?: MotorSpeechAspect[]; observedFeatures?: MotorSpeechFeature[]; notes?: string } };
export type FeedingSwallowingContext = "patient_report" | "caregiver_report" | "meal_observation" | "structured_trial" | "clinical_observation";
export type FeedingSwallowingArea = "food_acceptance" | "oral_intake" | "chewing" | "oral_bolus_management" | "swallowing" | "liquids" | "solids" | "mealtime_efficiency" | "secretion_management";
export type FeedingSwallowingFeature = "restricted_food_repertoire" | "texture_difficulty" | "chewing_difficulty" | "prolonged_oral_phase" | "oral_residue" | "anterior_loss" | "multiple_swallows" | "coughing_throat_clearing" | "wet_voice_after_intake" | "prolonged_mealtime" | "fatigue_during_meal" | "reduced_intake";
export type FeedingSwallowingModuleV1 = { profile?: { status: ClinicalObservationStatus; contextsExplored?: FeedingSwallowingContext[]; exploredAreas?: FeedingSwallowingArea[]; observedFeatures?: FeedingSwallowingFeature[]; notes?: string } };
export type OrofacialArea = "resting_posture" | "lips" | "tongue" | "jaw" | "oral_mobility" | "breathing_pattern" | "chewing_function" | "swallowing_pattern" | "oral_habits";
export type OrofacialFeature = "open_mouth_posture" | "reduced_lip_seal" | "altered_tongue_rest_posture" | "reduced_oral_mobility" | "asymmetry" | "oral_breathing_pattern" | "mixed_breathing_pattern" | "atypical_chewing_pattern" | "altered_swallowing_pattern" | "oral_habit_present";
export type OrofacialFunctionsModuleV1 = { profile?: { status: ClinicalObservationStatus; exploredAreas?: OrofacialArea[]; observedFeatures?: OrofacialFeature[]; notes?: string } };

export type LanguageOralModuleV1 = {
  earlyCommunication?: {
    status: LanguageOralObservationStatus;
    observedAreas?: LanguageOralEarlyCommunicationArea[];
    observedFeatures?: LanguageOralEarlyCommunicationFeature[];
    notes?: string;
  };
  comprehension?: {
    status: LanguageOralComprehensionStatus;
    exploredLevels?: LanguageOralComprehensionLevel[];
    difficultyFactors?: LanguageOralDifficultyFactor[];
    facilitations?: LanguageOralFacilitation[];
    notes?: string;
  };
  production?: {
    status: LanguageOralObservationStatus;
    outputLevel?: LanguageOralOutputLevel;
    initiative?: LanguageOralInitiative;
    verbalOutputAmount?: LanguageOralOutputAmount;
    formulation?: LanguageOralFormulationFeature[];
    notes?: string;
  };
  lexicalSemantics?: {
    status: LanguageOralObservationStatus;
    observedAreas?: LanguageOralLexicalArea[];
    observedFeatures?: LanguageOralLexicalFeature[];
    notes?: string;
  };
  morphosyntax?: {
    status: LanguageOralObservationStatus;
    observedAreas?: LanguageOralMorphosyntaxArea[];
    observedFeatures?: LanguageOralMorphosyntaxFeature[];
    notes?: string;
  };
  discourseNarrative?: {
    status: LanguageOralObservationStatus;
    contextsExplored?: LanguageOralDiscourseContext[];
    observedFeatures?: LanguageOralDiscourseFeature[];
    notes?: string;
  };
  intelligibilityScreening?: { status: LanguageOralScreeningStatus; notes?: string };
  socialCommunicationScreening?: { status: LanguageOralScreeningStatus; notes?: string };
  finalNote?: string;
};

export type ClinicalAssessmentV2Data = {
  modules: ClinicalModuleInstance[];
  accessReason?: {
    reason?: string;
    referralSource?: string;
    reportedBy?: string;
    relevantContext?: string;
  };
  anamnesis?: {
    relevantClinicalHistory?: string;
    developmentAndHistory?: string;
    educationWorkContext?: string;
    familySocialContext?: string;
    previousAssessmentsInterventions?: string;
    additionalNotes?: string;
  };
  tests?: {
    items?: AssessmentTestEntryV1[];
    notAdministered?: boolean;
    notes?: string;
  };
  summary?: {
    clinicalSummary?: string;
    strengths?: string[];
    difficulties?: string[];
    conclusions?: string;
    recommendations?: string;
    notes?: string;
  };
  planning?: { notes?: string };
};

export type ClinicalAssessmentV2OptionalSection = Exclude<keyof ClinicalAssessmentV2Data, "modules">;

export function compactClinicalSection<T extends Record<string, unknown>>(section: T): T | undefined {
  const entries = Object.entries(section).filter(([, value]) => value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0) && value !== false);
  return entries.length ? Object.fromEntries(entries) as T : undefined;
}

export function setClinicalAssessmentV2Section<K extends ClinicalAssessmentV2OptionalSection>(data: ClinicalAssessmentV2Data, key: K, section: ClinicalAssessmentV2Data[K]) {
  const compact = section && typeof section === "object" && !Array.isArray(section) ? compactClinicalSection(section as Record<string, unknown>) : undefined;
  if (!compact) { const { [key]: _removed, ...rest } = data; return rest as ClinicalAssessmentV2Data; }
  return { ...data, [key]: compact } as ClinicalAssessmentV2Data;
}

export function createAssessmentTestV2(): AssessmentTestEntryV1 {
  return { id: uid() };
}

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

export function createConfiguredClinicalAssessmentV2({
  patientId,
  clinicalPathwayId,
  assessmentType,
  clinicalDate,
  modules,
  now = new Date().toISOString(),
}: {
  patientId: string;
  clinicalPathwayId: string;
  assessmentType: ClinicalAssessmentTypeV2;
  clinicalDate: string;
  modules: { code: string; version: number }[];
  now?: string;
}) {
  if (!clinicalDate) throw new Error("La data clinica è obbligatoria.");
  if (modules.length === 0) throw new Error("Seleziona almeno un’area clinica.");
  const unique = modules.filter((module, index) => modules.findIndex((candidate) => candidate.code === module.code && candidate.version === module.version) === index);
  const assessment = createClinicalAssessmentV2(patientId, clinicalPathwayId, assessmentType, now);
  return { ...assessment, clinicalDate, data: { ...assessment.data, modules: unique.map((module) => createClinicalModuleInstance(module.code, module.version)) } };
}

export function addClinicalModule(assessment: ClinicalAssessmentV2, code: string, version: number) {
  if (assessment.data.modules.some((module) => module.code === code && module.version === version)) return assessment;
  return { ...assessment, data: { ...assessment.data, modules: [...assessment.data.modules, createClinicalModuleInstance(code, version)] } };
}

export function isClinicalModuleEmpty(module: ClinicalModuleInstance) {
  const definition = getClinicalModuleDefinition(module.code, module.version);
  if (!definition || !definition.validate(module.data)) return false;
  return typeof module.data === "object" && module.data !== null && !Array.isArray(module.data) && Object.keys(module.data).length === 0;
}

export const requiresClinicalModuleRemovalConfirmation = (module: ClinicalModuleInstance) => !isClinicalModuleEmpty(module);

export function removeClinicalModule(assessment: ClinicalAssessmentV2, code: string, version: number) {
  if (assessment.data.modules.length <= 1) throw new Error("La valutazione deve contenere almeno un’area clinica.");
  return { ...assessment, data: { ...assessment.data, modules: assessment.data.modules.filter((module) => module.code !== code || module.version !== version) } };
}

export function assertClinicalAssessmentWriteMode(assessment: ClinicalAssessmentV2, mode: "local" | "cloud") {
  if (mode === "cloud") throw new Error("Le nuove valutazioni modulari sono disponibili soltanto in modalità locale durante questa fase.");
}
