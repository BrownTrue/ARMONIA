import type { ComponentType } from "react";
import type { AacMultimodalModuleV1, AuditoryCommunicationModuleV1, ClinicalAssessmentV2Data, ClinicalModuleInstance, CognitiveCommunicationModuleV1, FeedingSwallowingModuleV1, FluencyModuleV1, LanguageOralModuleV1, MotorSpeechModuleV1, OrofacialFunctionsModuleV1, SchoolLearningModuleV1, SocialPragmaticsModuleV1, SpeechSoundModuleV1, VoiceModuleV1 } from "./assessment-v2.ts";
import { anamnesisSectionRegistry, normalizeClinicalAnamnesis } from "./anamnesis-sections.ts";

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
const speechSoundAreas = new Set(["phonetic_inventory", "articulation", "phonological_organization", "error_consistency", "intelligibility", "stimulability"]);
const speechSoundFeatures = new Set(["omissions", "substitutions", "distortions", "additions", "phonological_patterns", "inconsistent_errors", "reduced_intelligibility", "limited_stimulability"]);
const fluencyContexts = new Set(["spontaneous_speech", "conversation", "narration", "reading", "structured_task"]);
const fluencyFeatures = new Set(["sound_syllable_repetitions", "word_repetitions", "prolongations", "blocks", "interjections", "revisions", "irregular_rate", "rapid_rate"]);
const fluencyAssociatedFeatures = new Set(["visible_tension", "secondary_behaviors", "avoidance", "communicative_impact", "variability_by_context"]);
const voiceContexts = new Set(["conversation", "sustained_phonation", "reading", "increased_vocal_demand", "professional_voice_use"]);
const voiceAspects = new Set(["vocal_quality", "pitch", "loudness", "endurance", "phonatory_onset", "respiratory_phonatory_coordination", "functional_voice_use"]);
const voiceFeatures = new Set(["roughness", "breathiness", "strain", "weak_voice", "reduced_projection", "pitch_alteration", "vocal_fatigue", "intermittent_voice", "aphonia_episodes", "coordination_difficulty"]);
const motorSpeechContexts = new Set(["spontaneous_speech", "conversation", "repetition", "automatic_sequences", "reading", "structured_speech_task"]);
const motorSpeechAspects = new Set(["speech_initiation", "motor_planning", "movement_sequencing", "articulatory_precision", "speech_rate", "prosody", "respiratory_phonatory_coordination", "speech_motor_consistency"]);
const motorSpeechFeatures = new Set(["initiation_difficulty", "articulatory_imprecision", "inconsistent_productions", "sequencing_difficulty", "articulatory_groping", "reduced_rate", "increased_rate", "altered_prosody", "reduced_coordination", "reduced_intelligibility"]);
const feedingSwallowingContexts = new Set(["patient_report", "caregiver_report", "meal_observation", "structured_trial", "clinical_observation"]);
const feedingSwallowingAreas = new Set(["food_acceptance", "oral_intake", "chewing", "oral_bolus_management", "swallowing", "liquids", "solids", "mealtime_efficiency", "secretion_management"]);
const feedingSwallowingFeatures = new Set(["restricted_food_repertoire", "texture_difficulty", "chewing_difficulty", "prolonged_oral_phase", "oral_residue", "anterior_loss", "multiple_swallows", "coughing_throat_clearing", "wet_voice_after_intake", "prolonged_mealtime", "fatigue_during_meal", "reduced_intake"]);
const orofacialAreas = new Set(["resting_posture", "lips", "tongue", "jaw", "oral_mobility", "breathing_pattern", "chewing_function", "swallowing_pattern", "oral_habits"]);
const orofacialFeatures = new Set(["open_mouth_posture", "reduced_lip_seal", "altered_tongue_rest_posture", "reduced_oral_mobility", "asymmetry", "oral_breathing_pattern", "mixed_breathing_pattern", "atypical_chewing_pattern", "altered_swallowing_pattern", "oral_habit_present"]);
const aacContexts = new Set(["spontaneous_interaction", "structured_activity", "conversation", "choice_activity", "functional_daily_context", "interaction_with_partner"]);
const aacModalities = new Set(["speech", "vocalizations", "gestures", "signs", "objects", "photographs", "graphic_symbols", "writing", "communication_board", "electronic_aac"]);
const aacAreas = new Set(["communicative_intent", "initiation", "communicative_functions", "choice_expression", "message_formulation", "symbol_understanding", "symbol_use", "navigation_access", "communication_partner", "generalization"]);
const aacFeatures = new Set(["limited_spontaneous_use", "prompt_dependency", "restricted_communicative_functions", "message_formulation_difficulty", "symbol_access_difficulty", "navigation_difficulty", "access_method_difficulty", "partner_support_beneficial", "visual_support_beneficial", "context_dependent_use", "multimodal_communication"]);
const auditoryContexts = new Set(["quiet_one_to_one", "background_noise", "group_context", "unfamiliar_speaker", "distance", "telephone_media", "structured_listening_task"]);
const auditoryAreas = new Set(["auditory_attention", "sound_awareness", "auditory_discrimination", "auditory_identification", "spoken_language_comprehension", "auditory_memory", "auditory_sequencing", "listening_in_noise", "functional_device_use"]);
const auditoryFeatures = new Set(["inconsistent_response", "discrimination_difficulty", "identification_difficulty", "difficulty_in_noise", "difficulty_with_unfamiliar_speaker", "repetition_needed", "reliance_on_visual_cues", "reduced_auditory_memory", "sequencing_difficulty", "context_dependency"]);
const auditorySupports = new Set(["repetition", "slower_speech", "visual_cues", "lip_reading", "contextual_support", "reduced_background_noise", "closer_distance"]);
const schoolLearningContexts = new Set(["reading_aloud", "silent_reading", "text_comprehension", "dictation", "spontaneous_writing", "structured_writing", "calculation_task", "schoolwork_observation"]);
const schoolLearningAreas = new Set(["reading_accuracy", "reading_fluency", "reading_comprehension", "spelling", "written_text", "number_processing", "calculation"]);
const schoolLearningFeatures = new Set(["reading_errors", "slow_or_effortful_reading", "reduced_reading_comprehension", "spelling_errors", "written_text_organization_difficulty", "number_processing_difficulty", "calculation_difficulty", "task_avoidance_or_fatigue"]);
const cognitiveCommunicationContexts = new Set(["conversation", "structured_task", "multistep_activity", "narrative_task", "functional_daily_task", "dual_task_or_distractors"]);
const cognitiveCommunicationAreas = new Set(["communicative_attention", "verbal_working_memory", "auditory_verbal_memory", "information_processing", "message_planning", "organization", "cognitive_flexibility", "self_monitoring"]);
const cognitiveCommunicationFeatures = new Set(["loses_track_of_conversation", "difficulty_retaining_verbal_information", "difficulty_following_multistep_information", "slowed_information_processing", "message_planning_difficulty", "disorganized_information", "reduced_flexibility", "reduced_self_monitoring", "distractibility_during_communication"]);
const socialPragmaticsContexts = new Set(["spontaneous_interaction", "conversation", "structured_interaction", "play_activity", "group_context", "interaction_with_familiar_partner", "interaction_with_unfamiliar_partner"]);
const socialPragmaticsAreas = new Set(["communicative_initiation", "reciprocity", "turn_taking", "topic_management", "adaptation_to_partner", "contextual_appropriateness", "inferential_language", "nonliteral_language", "communication_repair", "nonverbal_communication"]);
const socialPragmaticsFeatures = new Set(["reduced_initiation", "reduced_reciprocity", "turn_taking_difficulty", "topic_maintenance_difficulty", "abrupt_topic_shifts", "reduced_partner_adaptation", "contextual_inappropriateness", "inferential_difficulty", "nonliteral_language_difficulty", "communication_repair_difficulty", "reduced_nonverbal_integration"]);
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

function isObservationProfileModule(value: unknown, detailSets: Record<string, ReadonlySet<string>>) {
  if (!isRecord(value) || !hasOnlyKeys(value, ["profile"])) return false;
  if (value.profile === undefined) return true;
  if (!isRecord(value.profile) || !hasOnlyKeys(value.profile, ["status", ...Object.keys(detailSets), "notes"]) || !hasValidStatusAndNotes(value.profile)) return false;
  const profile = value.profile as Record<string, unknown>;
  return Object.entries(detailSets).every(([key, allowed]) => isOptionalCodeArray(profile[key], allowed));
}
function isAuditoryCommunicationProfileModule(value: unknown): value is AuditoryCommunicationModuleV1 {
  if (!isRecord(value) || !hasOnlyKeys(value, ["profile"])) return false;
  if (value.profile === undefined) return true;
  if (!isRecord(value.profile) || !hasOnlyKeys(value.profile, ["status", "contextsExplored", "exploredAreas", "observedFeatures", "supportsObserved", "hearingTechnology", "notes"]) || !hasValidStatusAndNotes(value.profile)) return false;
  return isOptionalCodeArray(value.profile.contextsExplored, auditoryContexts)
    && isOptionalCodeArray(value.profile.exploredAreas, auditoryAreas)
    && isOptionalCodeArray(value.profile.observedFeatures, auditoryFeatures)
    && isOptionalCodeArray(value.profile.supportsObserved, auditorySupports)
    && (value.profile.hearingTechnology === undefined || typeof value.profile.hearingTechnology === "string");
}
export const isSpeechSoundModuleV1 = (value: unknown): value is SpeechSoundModuleV1 => isObservationProfileModule(value, { exploredAreas: speechSoundAreas, observedFeatures: speechSoundFeatures });
export const isFluencyModuleV1 = (value: unknown): value is FluencyModuleV1 => isObservationProfileModule(value, { contextsExplored: fluencyContexts, observedFeatures: fluencyFeatures, associatedFeatures: fluencyAssociatedFeatures });
export const isVoiceModuleV1 = (value: unknown): value is VoiceModuleV1 => isObservationProfileModule(value, { contextsExplored: voiceContexts, exploredAspects: voiceAspects, observedFeatures: voiceFeatures });
export const isMotorSpeechModuleV1 = (value: unknown): value is MotorSpeechModuleV1 => isObservationProfileModule(value, { contextsExplored: motorSpeechContexts, exploredAspects: motorSpeechAspects, observedFeatures: motorSpeechFeatures });
export const isFeedingSwallowingModuleV1 = (value: unknown): value is FeedingSwallowingModuleV1 => isObservationProfileModule(value, { contextsExplored: feedingSwallowingContexts, exploredAreas: feedingSwallowingAreas, observedFeatures: feedingSwallowingFeatures });
export const isOrofacialFunctionsModuleV1 = (value: unknown): value is OrofacialFunctionsModuleV1 => isObservationProfileModule(value, { exploredAreas: orofacialAreas, observedFeatures: orofacialFeatures });
export const isAacMultimodalModuleV1 = (value: unknown): value is AacMultimodalModuleV1 => isObservationProfileModule(value, { contextsExplored: aacContexts, modalitiesObserved: aacModalities, exploredAreas: aacAreas, observedFeatures: aacFeatures });
export const isAuditoryCommunicationModuleV1 = isAuditoryCommunicationProfileModule;
export const isSchoolLearningModuleV1 = (value: unknown): value is SchoolLearningModuleV1 => isObservationProfileModule(value, { contextsExplored: schoolLearningContexts, exploredAreas: schoolLearningAreas, observedFeatures: schoolLearningFeatures });
export const isCognitiveCommunicationModuleV1 = (value: unknown): value is CognitiveCommunicationModuleV1 => isObservationProfileModule(value, { contextsExplored: cognitiveCommunicationContexts, exploredAreas: cognitiveCommunicationAreas, observedFeatures: cognitiveCommunicationFeatures });
export const isSocialPragmaticsModuleV1 = (value: unknown): value is SocialPragmaticsModuleV1 => isObservationProfileModule(value, { contextsExplored: socialPragmaticsContexts, exploredAreas: socialPragmaticsAreas, observedFeatures: socialPragmaticsFeatures });

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

export const OBSERVATIONAL_MODULE_LABELS: Record<string, string> = {
  ...LANGUAGE_ORAL_LABELS,
  phonetic_inventory: "Inventario fonetico", articulation: "Articolazione", phonological_organization: "Organizzazione fonologica", error_consistency: "Consistenza degli errori", intelligibility: "Intelligibilità", stimulability: "Stimolabilità",
  omissions: "Omissioni", substitutions: "Sostituzioni", distortions: "Distorsioni", additions: "Aggiunte", phonological_patterns: "Pattern/processi fonologici", inconsistent_errors: "Errori inconsistenti", reduced_intelligibility: "Intelligibilità ridotta", limited_stimulability: "Stimolabilità ridotta",
  spontaneous_speech: "Eloquio spontaneo", conversation: "Conversazione", narration: "Narrazione", reading: "Lettura", structured_task: "Compito strutturato",
  sound_syllable_repetitions: "Ripetizioni di suoni o sillabe", word_repetitions: "Ripetizioni di parole", prolongations: "Prolungamenti", blocks: "Blocchi", interjections: "Interiezioni", revisions: "Revisioni/riformulazioni", irregular_rate: "Velocità o ritmo irregolari", rapid_rate: "Eloquio accelerato",
  visible_tension: "Tensione visibile", secondary_behaviors: "Comportamenti associati", avoidance: "Evitamento", communicative_impact: "Impatto sulla comunicazione", variability_by_context: "Variabilità in base al contesto",
  sustained_phonation: "Fonazione sostenuta", increased_vocal_demand: "Situazioni a maggiore richiesta vocale", professional_voice_use: "Uso professionale della voce",
  vocal_quality: "Qualità vocale", pitch: "Altezza", loudness: "Intensità", endurance: "Resistenza vocale", phonatory_onset: "Attacco fonatorio", respiratory_phonatory_coordination: "Coordinazione pneumo-fonatoria", functional_voice_use: "Uso funzionale della voce",
  roughness: "Raucedine/ruvidità", breathiness: "Soffiosità", strain: "Tensione/sforzo", weak_voice: "Voce debole", reduced_projection: "Ridotta proiezione", pitch_alteration: "Alterazione dell’altezza", vocal_fatigue: "Affaticamento vocale", intermittent_voice: "Voce intermittente/instabile", aphonia_episodes: "Episodi di afonia", coordination_difficulty: "Difficoltà di coordinazione pneumo-fonica",
  repetition: "Ripetizione", automatic_sequences: "Sequenze automatiche", structured_speech_task: "Compito verbale strutturato", speech_initiation: "Avvio del parlato", motor_planning: "Pianificazione/programmazione motoria", movement_sequencing: "Sequenziamento dei movimenti", articulatory_precision: "Precisione articolatoria", speech_rate: "Velocità dell’eloquio", prosody: "Prosodia", speech_motor_consistency: "Consistenza della produzione motoria", initiation_difficulty: "Difficoltà nell’avvio", articulatory_imprecision: "Imprecisione articolatoria", inconsistent_productions: "Produzioni inconsistenti", sequencing_difficulty: "Difficoltà di sequenziamento", articulatory_groping: "Ricerca articolatoria", reduced_rate: "Eloquio rallentato", increased_rate: "Eloquio accelerato", altered_prosody: "Prosodia alterata", reduced_coordination: "Ridotta coordinazione del parlato",
  patient_report: "Riferito dal paziente", caregiver_report: "Riferito dal caregiver/famiglia", meal_observation: "Osservazione durante il pasto", structured_trial: "Prova strutturata", clinical_observation: "Osservazione clinica", food_acceptance: "Accettazione degli alimenti", oral_intake: "Assunzione orale", chewing: "Masticazione", oral_bolus_management: "Gestione orale del bolo", swallowing: "Deglutizione", liquids: "Gestione dei liquidi", solids: "Gestione dei solidi", mealtime_efficiency: "Efficienza del pasto", secretion_management: "Gestione delle secrezioni", restricted_food_repertoire: "Repertorio alimentare ristretto", texture_difficulty: "Difficoltà con specifiche consistenze", chewing_difficulty: "Difficoltà di masticazione", prolonged_oral_phase: "Gestione orale prolungata", oral_residue: "Residui nel cavo orale", anterior_loss: "Perdita anteriore di alimento/liquido", multiple_swallows: "Deglutizioni multiple", coughing_throat_clearing: "Tosse o raclage associati all’assunzione", wet_voice_after_intake: "Qualità vocale modificata dopo l’assunzione", prolonged_mealtime: "Durata prolungata del pasto", fatigue_during_meal: "Affaticamento durante il pasto", reduced_intake: "Assunzione ridotta",
  resting_posture: "Postura a riposo", lips: "Labbra", tongue: "Lingua", jaw: "Mandibola", oral_mobility: "Mobilità orofacciale", breathing_pattern: "Modalità respiratoria", chewing_function: "Funzione masticatoria", swallowing_pattern: "Pattern deglutitorio", oral_habits: "Abitudini orali", open_mouth_posture: "Postura orale aperta", reduced_lip_seal: "Ridotta competenza labiale", altered_tongue_rest_posture: "Postura linguale a riposo alterata", reduced_oral_mobility: "Mobilità orofacciale ridotta", asymmetry: "Asimmetria osservata", oral_breathing_pattern: "Pattern respiratorio orale", mixed_breathing_pattern: "Pattern respiratorio misto", atypical_chewing_pattern: "Pattern masticatorio atipico", altered_swallowing_pattern: "Pattern deglutitorio alterato", oral_habit_present: "Abitudine orale presente",
  spontaneous_interaction: "Interazione spontanea", structured_activity: "Attività strutturata", choice_activity: "Attività di scelta", functional_daily_context: "Contesto funzionale quotidiano", interaction_with_partner: "Interazione con partner comunicativo", speech: "Linguaggio verbale", vocalizations: "Vocalizzazioni", signs: "Segni", objects: "Oggetti", photographs: "Fotografie", graphic_symbols: "Simboli grafici", writing: "Scrittura", communication_board: "Tabella/quaderno di comunicazione", electronic_aac: "Comunicatore/dispositivo elettronico", initiation: "Iniziativa comunicativa", communicative_functions: "Funzioni comunicative", choice_expression: "Espressione della scelta", message_formulation: "Costruzione del messaggio", symbol_understanding: "Comprensione di simboli/rappresentazioni", symbol_use: "Uso di simboli/rappresentazioni", navigation_access: "Accesso e navigazione del sistema", communication_partner: "Interazione con il partner comunicativo", generalization: "Uso nei diversi contesti", limited_spontaneous_use: "Uso spontaneo limitato", prompt_dependency: "Dipendenza da sollecitazioni", restricted_communicative_functions: "Funzioni comunicative limitate", message_formulation_difficulty: "Difficoltà nella costruzione del messaggio", symbol_access_difficulty: "Difficoltà nell'accesso ai simboli", navigation_difficulty: "Difficoltà di navigazione del sistema", access_method_difficulty: "Difficoltà nella modalità di accesso", partner_support_beneficial: "Beneficio dal supporto del partner", visual_support_beneficial: "Beneficio da supporti visivi", context_dependent_use: "Uso dipendente dal contesto", multimodal_communication: "Uso integrato di più modalità comunicative",
  quiet_one_to_one: "Interazione uno-a-uno in ambiente tranquillo", background_noise: "Presenza di rumore di fondo", group_context: "Contesto di gruppo", unfamiliar_speaker: "Interlocutore non familiare", distance: "Comunicazione a distanza", telephone_media: "Telefono / contenuti audio", structured_listening_task: "Compito di ascolto strutturato", auditory_attention: "Attenzione allo stimolo uditivo", sound_awareness: "Rilevazione/consapevolezza sonora", auditory_discrimination: "Discriminazione uditiva", auditory_identification: "Identificazione uditiva", spoken_language_comprehension: "Comprensione del linguaggio parlato", auditory_memory: "Memoria uditivo-verbale", auditory_sequencing: "Sequenziamento uditivo", listening_in_noise: "Ascolto nel rumore", functional_device_use: "Uso funzionale dei dispositivi nel contesto comunicativo", inconsistent_response: "Risposta uditiva variabile", discrimination_difficulty: "Difficoltà di discriminazione", identification_difficulty: "Difficoltà di identificazione", difficulty_in_noise: "Difficoltà in presenza di rumore", difficulty_with_unfamiliar_speaker: "Difficoltà con interlocutori non familiari", repetition_needed: "Necessità frequente di ripetizione", reliance_on_visual_cues: "Ricorso a informazioni visive", reduced_auditory_memory: "Difficoltà nella memoria uditivo-verbale", context_dependency: "Prestazione dipendente dal contesto", slower_speech: "Riduzione della velocità dell'eloquio", visual_cues: "Informazioni visive", lip_reading: "Lettura labiale", contextual_support: "Supporto contestuale", reduced_background_noise: "Riduzione del rumore ambientale", closer_distance: "Riduzione della distanza dall'interlocutore",
  reading_aloud: "Lettura ad alta voce", silent_reading: "Lettura silente", text_comprehension: "Comprensione del testo", dictation: "Dettato", spontaneous_writing: "Scrittura spontanea", structured_writing: "Compito di scrittura strutturato", calculation_task: "Compito di calcolo", schoolwork_observation: "Osservazione di attività scolastiche", reading_accuracy: "Accuratezza di lettura", reading_fluency: "Fluenza di lettura", reading_comprehension: "Comprensione del testo", spelling: "Competenze ortografiche", written_text: "Produzione scritta", number_processing: "Elaborazione del numero", calculation: "Calcolo", reading_errors: "Errori di lettura", slow_or_effortful_reading: "Lettura lenta o faticosa", reduced_reading_comprehension: "Difficoltà nella comprensione del testo", spelling_errors: "Errori ortografici", written_text_organization_difficulty: "Difficoltà nell’organizzazione del testo scritto", number_processing_difficulty: "Difficoltà nell’elaborazione del numero", calculation_difficulty: "Difficoltà nel calcolo", task_avoidance_or_fatigue: "Affaticamento o evitamento durante il compito",
  multistep_activity: "Attività con più passaggi", narrative_task: "Compito narrativo", functional_daily_task: "Attività funzionale quotidiana", dual_task_or_distractors: "Attività con distrattori o richieste multiple", communicative_attention: "Attenzione nel contesto comunicativo", verbal_working_memory: "Memoria di lavoro verbale", auditory_verbal_memory: "Memoria uditivo-verbale", information_processing: "Elaborazione delle informazioni", message_planning: "Pianificazione del messaggio", organization: "Organizzazione delle informazioni", cognitive_flexibility: "Flessibilità nel contesto comunicativo", self_monitoring: "Monitoraggio della propria comunicazione", loses_track_of_conversation: "Perdita del filo della conversazione", difficulty_retaining_verbal_information: "Difficoltà nel mantenere informazioni verbali", difficulty_following_multistep_information: "Difficoltà con informazioni o consegne articolate in più passaggi", slowed_information_processing: "Elaborazione rallentata delle informazioni", message_planning_difficulty: "Difficoltà nella pianificazione del messaggio", disorganized_information: "Informazioni organizzate in modo poco efficace", reduced_flexibility: "Ridotta flessibilità rispetto al contesto comunicativo", reduced_self_monitoring: "Ridotto monitoraggio della propria comunicazione", distractibility_during_communication: "Distraibilità durante l’interazione",
  structured_interaction: "Interazione strutturata", play_activity: "Gioco / attività condivisa", interaction_with_familiar_partner: "Interazione con persona familiare", interaction_with_unfamiliar_partner: "Interazione con persona non familiare", communicative_initiation: "Iniziativa comunicativa", reciprocity: "Reciprocità comunicativa", topic_management: "Gestione dell’argomento", adaptation_to_partner: "Adattamento all’interlocutore", contextual_appropriateness: "Adeguamento al contesto", nonliteral_language: "Linguaggio non letterale", communication_repair: "Riparazione degli scambi comunicativi", nonverbal_communication: "Comunicazione non verbale", reduced_initiation: "Ridotta iniziativa comunicativa", reduced_reciprocity: "Reciprocità ridotta", topic_maintenance_difficulty: "Difficoltà nel mantenimento dell’argomento", abrupt_topic_shifts: "Cambi di argomento poco contestualizzati", reduced_partner_adaptation: "Ridotto adattamento all’interlocutore", contextual_inappropriateness: "Uso comunicativo poco adeguato al contesto", inferential_difficulty: "Difficoltà nella comprensione inferenziale", nonliteral_language_difficulty: "Difficoltà con il linguaggio non letterale", communication_repair_difficulty: "Difficoltà nel riparare incomprensioni comunicative", reduced_nonverbal_integration: "Ridotta integrazione degli elementi non verbali",
};
export const AAC_MULTIMODAL_LABELS: Record<string, string> = { ...OBSERVATIONAL_MODULE_LABELS, gestures: "Gesti" };
export const AUDITORY_COMMUNICATION_LABELS: Record<string, string> = { ...OBSERVATIONAL_MODULE_LABELS, sequencing_difficulty: "Difficoltà nel sequenziamento uditivo" };
export const SOCIAL_PRAGMATICS_LABELS: Record<string, string> = { ...OBSERVATIONAL_MODULE_LABELS, turn_taking: "Gestione dei turni", inferential_language: "Comprensione inferenziale", turn_taking_difficulty: "Difficoltà nella gestione dei turni" };
export const OBSERVATIONAL_MODULE_OPTIONS = {
  speechSound: { exploredAreas: [...speechSoundAreas], observedFeatures: [...speechSoundFeatures] },
  fluency: { contextsExplored: [...fluencyContexts], observedFeatures: [...fluencyFeatures], associatedFeatures: [...fluencyAssociatedFeatures] },
  voice: { contextsExplored: [...voiceContexts], exploredAspects: [...voiceAspects], observedFeatures: [...voiceFeatures] },
  motorSpeech: { contextsExplored: [...motorSpeechContexts], exploredAspects: [...motorSpeechAspects], observedFeatures: [...motorSpeechFeatures] },
  feedingSwallowing: { contextsExplored: [...feedingSwallowingContexts], exploredAreas: [...feedingSwallowingAreas], observedFeatures: [...feedingSwallowingFeatures] },
  orofacialFunctions: { exploredAreas: [...orofacialAreas], observedFeatures: [...orofacialFeatures] },
  aacMultimodal: { contextsExplored: [...aacContexts], modalitiesObserved: [...aacModalities], exploredAreas: [...aacAreas], observedFeatures: [...aacFeatures] },
  auditoryCommunication: { contextsExplored: [...auditoryContexts], exploredAreas: [...auditoryAreas], observedFeatures: [...auditoryFeatures], supportsObserved: [...auditorySupports] },
  schoolLearning: { contextsExplored: [...schoolLearningContexts], exploredAreas: [...schoolLearningAreas], observedFeatures: [...schoolLearningFeatures] },
  cognitiveCommunication: { contextsExplored: [...cognitiveCommunicationContexts], exploredAreas: [...cognitiveCommunicationAreas], observedFeatures: [...cognitiveCommunicationFeatures] },
  socialPragmatics: { contextsExplored: [...socialPragmaticsContexts], exploredAreas: [...socialPragmaticsAreas], observedFeatures: [...socialPragmaticsFeatures] },
} as const;

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

const printObservationProfile = (code: string, title: string, profile: { status: string; notes?: string } | undefined, details: { label: string; values?: string[] }[], labels = OBSERVATIONAL_MODULE_LABELS) => profile ? [{ code, title, fields: [{ label: "Osservazione generale", value: LANGUAGE_ORAL_LABELS[profile.status] }, ...details.flatMap((detail) => printField(detail.label, detail.values?.map((value) => labels[value]))), ...printField("Osservazioni", profile.notes?.trim())] }] : [];
const speechSoundV1: ClinicalModuleDefinition<SpeechSoundModuleV1> = { code: "speech_sound", version: 1, label: "Fonetica, fonologia e articolazione", createEmptyData: () => ({}), validate: isSpeechSoundModuleV1, toPrintSections: (data) => printObservationProfile("speech_sound.profile", "Profilo fonetico-fonologico e articolatorio", data.profile, [{ label: "Aspetti esplorati", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const fluencyV1: ClinicalModuleDefinition<FluencyModuleV1> = { code: "fluency", version: 1, label: "Fluenza", createEmptyData: () => ({}), validate: isFluencyModuleV1, toPrintSections: (data) => printObservationProfile("fluency.profile", "Profilo della fluenza", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }, { label: "Caratteristiche associate", values: data.profile?.associatedFeatures }]) };
const voiceV1: ClinicalModuleDefinition<VoiceModuleV1> = { code: "voice", version: 1, label: "Voce", createEmptyData: () => ({}), validate: isVoiceModuleV1, toPrintSections: (data) => printObservationProfile("voice.profile", "Profilo vocale", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aspetti esplorati", values: data.profile?.exploredAspects }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const motorSpeechV1: ClinicalModuleDefinition<MotorSpeechModuleV1> = { code: "motor_speech", version: 1, label: "Disturbi motori del parlato", createEmptyData: () => ({}), validate: isMotorSpeechModuleV1, toPrintSections: (data) => printObservationProfile("motor_speech.profile", "Controllo motorio del parlato", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aspetti esplorati", values: data.profile?.exploredAspects }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const feedingSwallowingV1: ClinicalModuleDefinition<FeedingSwallowingModuleV1> = { code: "feeding_swallowing", version: 1, label: "Alimentazione e deglutizione", createEmptyData: () => ({}), validate: isFeedingSwallowingModuleV1, toPrintSections: (data) => printObservationProfile("feeding_swallowing.profile", "Alimentazione e deglutizione", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aree esplorate", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const orofacialFunctionsV1: ClinicalModuleDefinition<OrofacialFunctionsModuleV1> = { code: "orofacial_functions", version: 1, label: "Sistema orofacciale e funzioni orali", createEmptyData: () => ({}), validate: isOrofacialFunctionsModuleV1, toPrintSections: (data) => printObservationProfile("orofacial_functions.profile", "Sistema orofacciale e funzioni orali", data.profile, [{ label: "Aree esplorate", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const aacMultimodalV1: ClinicalModuleDefinition<AacMultimodalModuleV1> = { code: "aac_multimodal", version: 1, label: "CAA e comunicazione multimodale", createEmptyData: () => ({}), validate: isAacMultimodalModuleV1, toPrintSections: (data) => data.profile ? [{ code: "aac_multimodal.profile", title: "CAA e comunicazione multimodale", fields: [{ label: "Osservazione generale", value: LANGUAGE_ORAL_LABELS[data.profile.status] }, ...[{ label: "Contesti esplorati", values: data.profile.contextsExplored }, { label: "Modalità osservate o utilizzate", values: data.profile.modalitiesObserved }, { label: "Aree esplorate", values: data.profile.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile.observedFeatures }].flatMap((detail) => printField(detail.label, detail.values?.map((value) => AAC_MULTIMODAL_LABELS[value]))), ...printField("Osservazioni", data.profile.notes?.trim())] }] : [] };
const auditoryCommunicationV1: ClinicalModuleDefinition<AuditoryCommunicationModuleV1> = { code: "auditory_communication", version: 1, label: "Abilitazione/riabilitazione uditivo-comunicativa", createEmptyData: () => ({}), validate: isAuditoryCommunicationModuleV1, toPrintSections: (data) => data.profile ? [{ code: "auditory_communication.profile", title: "Funzionamento uditivo-comunicativo", fields: [{ label: "Osservazione generale", value: LANGUAGE_ORAL_LABELS[data.profile.status] }, ...[{ label: "Contesti esplorati", values: data.profile.contextsExplored }, { label: "Aree esplorate", values: data.profile.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile.observedFeatures }, { label: "Supporti e facilitazioni osservate", values: data.profile.supportsObserved }].flatMap((detail) => printField(detail.label, detail.values?.map((value) => AUDITORY_COMMUNICATION_LABELS[value]))), ...printField("Dispositivi/tecnologie uditive utilizzate", data.profile.hearingTechnology?.trim()), ...printField("Osservazioni", data.profile.notes?.trim())] }] : [] };
const schoolLearningV1: ClinicalModuleDefinition<SchoolLearningModuleV1> = { code: "school_learning", version: 1, label: "Apprendimenti scolastici", createEmptyData: () => ({}), validate: isSchoolLearningModuleV1, toPrintSections: (data) => printObservationProfile("school_learning.profile", "Apprendimenti scolastici", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aree esplorate", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const cognitiveCommunicationV1: ClinicalModuleDefinition<CognitiveCommunicationModuleV1> = { code: "cognitive_communication", version: 1, label: "Funzioni cognitivo-comunicative", createEmptyData: () => ({}), validate: isCognitiveCommunicationModuleV1, toPrintSections: (data) => printObservationProfile("cognitive_communication.profile", "Funzioni cognitivo-comunicative", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aree esplorate", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }]) };
const socialPragmaticsV1: ClinicalModuleDefinition<SocialPragmaticsModuleV1> = { code: "social_pragmatics", version: 1, label: "Comunicazione sociale e pragmatica", createEmptyData: () => ({}), validate: isSocialPragmaticsModuleV1, toPrintSections: (data) => printObservationProfile("social_pragmatics.profile", "Comunicazione sociale e pragmatica", data.profile, [{ label: "Contesti esplorati", values: data.profile?.contextsExplored }, { label: "Aree esplorate", values: data.profile?.exploredAreas }, { label: "Caratteristiche osservate", values: data.profile?.observedFeatures }], SOCIAL_PRAGMATICS_LABELS) };

const definitions = [languageOralV1, speechSoundV1, motorSpeechV1, fluencyV1, voiceV1, feedingSwallowingV1, orofacialFunctionsV1, aacMultimodalV1, auditoryCommunicationV1, schoolLearningV1, cognitiveCommunicationV1, socialPragmaticsV1] as const;

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
  const anamnesis = normalizeClinicalAnamnesis(data.anamnesis);
  return [
    ...commonPrintSection("access_reason", "Motivo dell’accesso", [
      ...printField("Motivo della valutazione", data.accessReason?.reason?.trim()),
      ...printField("Inviante / modalità di accesso", data.accessReason?.referralSource?.trim()),
      ...printField("Informazioni riferite da", data.accessReason?.reportedBy?.trim()),
      ...printField("Contesto iniziale rilevante", data.accessReason?.relevantContext?.trim()),
    ]),
    ...commonPrintSection("anamnesis", "Anamnesi", anamnesisSectionRegistry.flatMap((definition) => printField(definition.label, anamnesis?.sections?.[definition.code]?.trim()))),
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
