import assert from "node:assert/strict";
import test from "node:test";
import { createLanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";
import { assessmentRendererVersion } from "./assessment-dispatch.ts";
import { addClinicalModule, assertClinicalAssessmentWriteMode, clinicalAssessmentTypeLabel, createAssessmentTestV2, createClinicalAssessmentV2, createConfiguredClinicalAssessmentV2, INITIAL_ASSESSMENT_STEP, isClinicalAssessmentV2ReadOnly, isClinicalModuleEmpty, removeClinicalModule, setClinicalAssessmentV2Section, shouldAutosaveClinicalAssessmentV2 } from "./assessment-v2.ts";
import { autosaveClinicalAssessmentDraft, completeClinicalAssessment, correctClinicalAssessment, createClinicalAssessmentDraft, getClinicalAssessment } from "./local.ts";
import { createClinicalModuleInstance, getClinicalModuleDefinition, isLanguageOralModuleV1, toClinicalAssessmentV2PrintSections } from "./module-registry.ts";
import { isClinicalAssessment } from "./validation.ts";

test("la factory V2 crea una bozza modulare senza reinterpretare moduleType", () => {
  const assessment = createClinicalAssessmentV2("patient-1", "pathway-1", "reassessment", "2026-09-24T10:00:00.000Z");
  assert.equal(assessment.schemaVersion, 2);
  assert.equal(assessment.assessmentType, "reassessment");
  assert.equal("moduleType" in assessment, false);
  assert.deepEqual(assessment.data, { modules: [] });
  assert.equal(isClinicalAssessment(assessment), true);
});

test("il registry crea e valida il contenitore minimo language_oral V1", () => {
  const definition = getClinicalModuleDefinition("language_oral", 1);
  const module = createClinicalModuleInstance("language_oral", 1);
  assert.equal(definition?.label, "Linguaggio orale");
  assert.deepEqual(module, { code: "language_oral", version: 1, data: {} });

  const assessment = createClinicalAssessmentV2("patient-1", "pathway-1");
  assessment.data.modules.push(module);
  assert.equal(isClinicalAssessment(assessment), true);
});

test("la validazione V2 rifiuta moduli sconosciuti senza indebolire la V1", () => {
  const assessment = createClinicalAssessmentV2("patient-1", "pathway-1");
  assessment.data.modules.push({ code: "voice", version: 1, data: {} });
  assert.equal(isClinicalAssessment(assessment), false);

  const v1 = createLanguageCommunicationAssessmentV1("patient-1", "pathway-1", "2026-09-24T10:00:00.000Z");
  assert.equal(isClinicalAssessment(v1), true);
  assert.equal(assessmentRendererVersion(v1), "v1");
  assert.equal(assessmentRendererVersion(createClinicalAssessmentV2("patient-1", "pathway-1")), "v2");
});

test("le operazioni locali condivise creano e completano una V2 valida", () => {
  const assessment = {
    ...createClinicalAssessmentV2("patient-1", "pathway-1", "initial", "2026-09-24T10:00:00.000Z"),
    clinicalDate: "2026-09-24",
  };
  assessment.data.modules.push(createClinicalModuleInstance("language_oral", 1));
  const data = {
    patients: [{ id: "patient-1" }],
    appointments: [], sessions: [], goals: [], materials: [],
    clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-09-24", createdAt: "2026-09-24T10:00:00.000Z", updatedAt: "2026-09-24T10:00:00.000Z" }],
    clinicalAssessments: [],
    profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" },
  };

  const created = createClinicalAssessmentDraft(data, assessment);
  const completed = completeClinicalAssessment(created, assessment.id, "2026-09-24T11:00:00.000Z");
  assert.equal(getClinicalAssessment(completed, assessment.id)?.schemaVersion, 2);
  assert.equal(getClinicalAssessment(completed, assessment.id)?.status, "completed");
});

test("language_oral vuoto e reset senza comprehension sono validi", () => {
  assert.equal(isLanguageOralModuleV1({}), true);
  assert.equal(isLanguageOralModuleV1({ comprehension: undefined }), true);
});

test("comprehension con solo status è valida", () => {
  assert.equal(isLanguageOralModuleV1({ comprehension: { status: "no_evident_difficulty" } }), true);
});

test("comprehension completa è valida e produce contenuto di stampa", () => {
  const data = { comprehension: {
    status: "difficulties_observed",
    exploredLevels: ["sentences", "narratives"],
    difficultyFactors: ["information_load"],
    facilitations: ["repetition", "visual_support"],
    notes: "Osservazione sintetica.",
  } };
  const definition = getClinicalModuleDefinition("language_oral", 1);
  assert.equal(isLanguageOralModuleV1(data), true);
  assert.equal(definition?.toPrintSections(data).length, 1);
  assert.equal(definition?.toPrintSections(data)[0]?.fields.length, 5);
  assert.deepEqual(definition?.toPrintSections({}), []);
});

test("status sconosciuto viene rifiutato", () => {
  assert.equal(isLanguageOralModuleV1({ comprehension: { status: "normal" } }), false);
});

test("codici di dettaglio sconosciuti e payload malformati vengono rifiutati", () => {
  assert.equal(isLanguageOralModuleV1({ comprehension: { status: "further_assessment", exploredLevels: ["written_text"] } }), false);
  assert.equal(isLanguageOralModuleV1({ comprehension: { status: "further_assessment", notes: 12 } }), false);
  assert.equal(isLanguageOralModuleV1({ comprehension: { status: "further_assessment" }, production: {} }), false);
});

test("ogni nuovo dominio accetta il solo status e può esistere da solo", () => {
  assert.equal(isLanguageOralModuleV1({ production: { status: "no_evident_difficulty" } }), true);
  assert.equal(isLanguageOralModuleV1({ lexicalSemantics: { status: "difficulties_observed" } }), true);
  assert.equal(isLanguageOralModuleV1({ morphosyntax: { status: "further_assessment" } }), true);
  assert.equal(isLanguageOralModuleV1({ discourseNarrative: { status: "no_evident_difficulty" } }), true);
});

test("due domini compilati non rendono obbligatori gli altri", () => {
  assert.equal(isLanguageOralModuleV1({
    comprehension: { status: "no_evident_difficulty" },
    lexicalSemantics: { status: "further_assessment", observedAreas: ["naming"] },
  }), true);
});

test("i quattro nuovi domini accettano dettagli validi", () => {
  const data = {
    production: { status: "difficulties_observed", outputLevel: "short_utterances", initiative: "prompted", verbalOutputAmount: "limited", formulation: ["fragmented_output"], notes: "Nota." },
    lexicalSemantics: { status: "difficulties_observed", observedAreas: ["lexical_access", "naming"], observedFeatures: ["word_finding_difficulty"] },
    morphosyntax: { status: "further_assessment", observedAreas: ["morphology", "sentence_comprehension"], observedFeatures: ["agreement_errors"] },
    discourseNarrative: { status: "difficulties_observed", contextsExplored: ["narration"], observedFeatures: ["reduced_coherence"], notes: "Nota." },
  };
  assert.equal(isLanguageOralModuleV1(data), true);
  const sections = getClinicalModuleDefinition("language_oral", 1)?.toPrintSections(data) || [];
  assert.deepEqual(sections.map((section) => section.code), ["language_oral.production", "language_oral.lexical_semantics", "language_oral.morphosyntax", "language_oral.discourse_narrative"]);
});

test("il print adapter omette i domini assenti", () => {
  const sections = getClinicalModuleDefinition("language_oral", 1)?.toPrintSections({ lexicalSemantics: { status: "no_evident_difficulty" } }) || [];
  assert.equal(sections.length, 1);
  assert.equal(sections[0]?.title, "Lessico-semantica");
  assert.equal(sections[0]?.fields.length, 1);
});

test("i nuovi domini rifiutano status, codici e proprietà sconosciuti", () => {
  assert.equal(isLanguageOralModuleV1({ production: { status: "normal" } }), false);
  assert.equal(isLanguageOralModuleV1({ production: { status: "further_assessment", outputLevel: "paragraphs" } }), false);
  assert.equal(isLanguageOralModuleV1({ lexicalSemantics: { status: "further_assessment", observedFeatures: ["grammar_error"] } }), false);
  assert.equal(isLanguageOralModuleV1({ morphosyntax: { status: "further_assessment", observedAreas: ["passive_voice"] } }), false);
  assert.equal(isLanguageOralModuleV1({ discourseNarrative: { status: "further_assessment", contextsExplored: ["turn_taking"] } }), false);
  assert.equal(isLanguageOralModuleV1({ discourseNarrative: { status: "further_assessment", pragmatics: [] } }), false);
});

test("sviluppo comunicativo precoce è facoltativo e accetta panoramica e dettagli", () => {
  assert.equal(isLanguageOralModuleV1({ earlyCommunication: { status: "no_evident_difficulty" } }), true);
  assert.equal(isLanguageOralModuleV1({
    earlyCommunication: {
      status: "difficulties_observed",
      observedAreas: ["communicative_intent", "gestures", "symbolic_play"],
      observedFeatures: ["reduced_communicative_initiative", "limited_symbolic_play"],
      notes: "Osservazione circoscritta al contesto attuale.",
    },
  }), true);
});

test("sviluppo comunicativo precoce rifiuta codici e proprietà non previsti", () => {
  assert.equal(isLanguageOralModuleV1({ earlyCommunication: { status: "typical" } }), false);
  assert.equal(isLanguageOralModuleV1({ earlyCommunication: { status: "further_assessment", observedAreas: ["first_words_age"] } }), false);
  assert.equal(isLanguageOralModuleV1({ earlyCommunication: { status: "further_assessment", regressionHistory: true } }), false);
});

test("le segnalazioni rapide accettano stato e nota senza attivare altri moduli", () => {
  const data = {
    intelligibilityScreening: { status: "further_assessment", notes: "Verificare in approfondimento dedicato." },
    socialCommunicationScreening: { status: "concern_observed" },
  };
  assert.equal(isLanguageOralModuleV1(data), true);
  assert.deepEqual(Object.keys(data), ["intelligibilityScreening", "socialCommunicationScreening"]);
});

test("le segnalazioni rapide rifiutano stati e dettagli clinici non previsti", () => {
  assert.equal(isLanguageOralModuleV1({ intelligibilityScreening: { status: "diagnosed" } }), false);
  assert.equal(isLanguageOralModuleV1({ socialCommunicationScreening: { status: "further_assessment", reciprocity: "reduced" } }), false);
});

test("nota finale facoltativa e print adapter includono soltanto contenuti documentati", () => {
  const definition = getClinicalModuleDefinition("language_oral", 1);
  const data = {
    earlyCommunication: { status: "difficulties_observed", observedAreas: ["gestures"] },
    intelligibilityScreening: { status: "no_relevant_concern" },
    finalNote: "Considerazione complessiva sul solo modulo.",
  };
  assert.equal(isLanguageOralModuleV1(data), true);
  const sections = definition?.toPrintSections(data) || [];
  assert.deepEqual(sections.map((section) => section.code), [
    "language_oral.early_communication",
    "language_oral.intelligibility_screening",
    "language_oral.final_note",
  ]);
  assert.equal(sections[0]?.fields[1]?.value[0], "Uso dei gesti");
  assert.equal(sections.some((section) => section.code === "language_oral.social_communication_screening"), false);
  assert.deepEqual(definition?.toPrintSections({ finalNote: "   " }), []);
});

test("il payload pulito dopo reset può tornare completamente vuoto", () => {
  const withDomain = { earlyCommunication: { status: "further_assessment" } };
  const { earlyCommunication: _removed, ...clean } = withDomain;
  assert.deepEqual(clean, {});
  assert.equal(isLanguageOralModuleV1(clean), true);
  assert.deepEqual(getClinicalModuleDefinition("language_oral", 1)?.toPrintSections(clean), []);
});

test("il flusso di creazione configura una valutazione modulare locale completa", () => {
  const assessment = createConfiguredClinicalAssessmentV2({
    patientId: "patient-1",
    clinicalPathwayId: "pathway-1",
    assessmentType: "reassessment",
    clinicalDate: "2026-10-03",
    modules: [{ code: "language_oral", version: 1 }],
    now: "2026-10-03T09:00:00.000Z",
  });
  assert.equal(assessment.schemaVersion, 2);
  assert.equal(assessment.assessmentType, "reassessment");
  assert.equal(assessment.clinicalDate, "2026-10-03");
  assert.equal(assessment.status, "draft");
  assert.deepEqual(assessment.data.modules, [{ code: "language_oral", version: 1, data: {} }]);
  assert.equal(isClinicalAssessment(assessment), true);
  assert.equal(assessmentRendererVersion(assessment), "v2");
});

test("la creazione richiede almeno un modulo e usa il registry", () => {
  assert.throws(() => createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-03", modules: [] }), /almeno un.area clinica/);
  assert.throws(() => createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-03", modules: [{ code: "unknown", version: 1 }] }), /non supportato/);
});

test("la gestione aree non duplica e rimuove un modulo senza lasciare la valutazione vuota", () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-03", modules: [{ code: "language_oral", version: 1 }] });
  assert.equal(addClinicalModule(assessment, "language_oral", 1), assessment);
  assert.equal(isClinicalModuleEmpty(assessment.data.modules[0]), true);
  assert.throws(() => removeClinicalModule(assessment, "language_oral", 1), /almeno un.area clinica/);
  const syntheticSecond = { ...assessment, data: { ...assessment.data, modules: [...assessment.data.modules, { code: "future_module", version: 1, data: {} }] } };
  const removed = removeClinicalModule(syntheticSecond, "language_oral", 1);
  assert.deepEqual(removed.data.modules.map((module) => module.code), ["future_module"]);
});

test("la V2 non può essere scritta in cloud durante questa fase", () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "interim", clinicalDate: "2026-10-03", modules: [{ code: "language_oral", version: 1 }] });
  assert.doesNotThrow(() => assertClinicalAssessmentWriteMode(assessment, "local"));
  assert.throws(() => assertClinicalAssessmentWriteMode(assessment, "cloud"), /soltanto in modalità locale/);
});

test("l'autosave locale V2 conserva l'ultimo draft valido", () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-03", modules: [{ code: "language_oral", version: 1 }], now: "2026-10-03T09:00:00.000Z" });
  const data = {
    patients: [{ id: "patient-1" }], appointments: [], sessions: [], goals: [], materials: [],
    clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-10-03", createdAt: "2026-10-03T09:00:00.000Z", updatedAt: "2026-10-03T09:00:00.000Z" }],
    clinicalAssessments: [], profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" },
  };
  const created = createClinicalAssessmentDraft(data, assessment);
  const latest = { ...assessment, updatedAt: "2026-10-03T09:05:00.000Z", data: { modules: [{ code: "language_oral", version: 1, data: { finalNote: "Ultima modifica" } }] } };
  const saved = autosaveClinicalAssessmentDraft(created, latest);
  assert.equal(getClinicalAssessment(saved, assessment.id)?.updatedAt, "2026-10-03T09:05:00.000Z");
  assert.equal(getClinicalAssessment(saved, assessment.id)?.data.modules[0].data.finalNote, "Ultima modifica");
});

test("una nuova valutazione modulare apre dal Motivo dell’accesso", () => {
  assert.equal(INITIAL_ASSESSMENT_STEP, 0);
});

test("le sezioni comuni parziali sono valide e quelle vuote vengono omesse", () => {
  const base = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-04", modules: [{ code: "language_oral", version: 1 }] });
  let data = setClinicalAssessmentV2Section(base.data, "accessReason", { reason: "Approfondimento funzionale" });
  data = setClinicalAssessmentV2Section(data, "anamnesis", { relevantClinicalHistory: "Dato essenziale." });
  data = setClinicalAssessmentV2Section(data, "summary", { strengths: ["Buona partecipazione"] });
  data = setClinicalAssessmentV2Section(data, "planning", { notes: "Proseguire osservazione." });
  assert.equal(isClinicalAssessment({ ...base, data }), true);
  assert.equal("accessReason" in setClinicalAssessmentV2Section(data, "accessReason", {}), false);
  assert.equal("anamnesis" in setClinicalAssessmentV2Section(data, "anamnesis", { additionalNotes: "" }), false);
});

test("test e strumenti V2 supportano aggiunta, modifica e rimozione", () => {
  const base = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-04", modules: [{ code: "language_oral", version: 1 }] });
  const entry = { ...createAssessmentTestV2(), name: "Test sintetico", date: "2026-10-04", area: "Linguaggio", rawScore: "12", percentile: "50", notes: "Nessuna interpretazione automatica." };
  const withTest = setClinicalAssessmentV2Section(base.data, "tests", { items: [entry], notes: "Nota generale" });
  assert.equal(isClinicalAssessment({ ...base, data: withTest }), true);
  assert.equal(withTest.tests.items[0].name, "Test sintetico");
  const withoutTest = setClinicalAssessmentV2Section(withTest, "tests", {});
  assert.equal("tests" in withoutTest, false);
});

test("un payload V2 completo valida e produce un modello intermedio di stampa senza sezioni vuote", () => {
  const base = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "other", clinicalDate: "2026-10-04", modules: [{ code: "language_oral", version: 1 }] });
  const data = {
    ...base.data,
    accessReason: { reason: "Valutazione funzionale", reportedBy: "Paziente" },
    anamnesis: { educationWorkContext: "Contesto lavorativo." },
    tests: { items: [{ id: "test-1", name: "Strumento sintetico" }] },
    summary: { clinicalSummary: "Sintesi manuale.", strengths: ["Partecipazione"], difficulties: ["Aspetto da approfondire"] },
    planning: { notes: "Pianificazione manuale." },
  };
  assert.equal(isClinicalAssessment({ ...base, data }), true);
  assert.deepEqual(toClinicalAssessmentV2PrintSections(data).map((section) => section.code), ["access_reason", "anamnesis", "tests", "summary", "planning"]);
  assert.deepEqual(toClinicalAssessmentV2PrintSections(base.data), []);
});

test("autosave V2 conserva modifiche provenienti da step comuni differenti", () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-04", modules: [{ code: "language_oral", version: 1 }] });
  const data = { patients: [{ id: "patient-1" }], appointments: [], sessions: [], goals: [], materials: [], clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-10-04", createdAt: assessment.createdAt, updatedAt: assessment.updatedAt }], clinicalAssessments: [], profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" } };
  const created = createClinicalAssessmentDraft(data, assessment);
  const first = { ...assessment, data: setClinicalAssessmentV2Section(assessment.data, "accessReason", { reason: "Primo step" }) };
  const second = { ...first, data: setClinicalAssessmentV2Section(first.data, "planning", { notes: "Ultimo step" }) };
  const saved = autosaveClinicalAssessmentDraft(autosaveClinicalAssessmentDraft(created, first), second);
  const result = getClinicalAssessment(saved, assessment.id);
  assert.equal(result.data.accessReason.reason, "Primo step");
  assert.equal(result.data.planning.notes, "Ultimo step");
});

test("anamnesi omette categorie assenti, accetta una o più categorie e rimuove stringhe vuote", () => {
  const base = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-05", modules: [{ code: "language_oral", version: 1 }] });
  assert.equal(base.data.anamnesis, undefined);
  const one = setClinicalAssessmentV2Section(base.data, "anamnesis", { relevantClinicalHistory: "Storia essenziale" });
  assert.equal(isClinicalAssessment({ ...base, data: one }), true);
  const multiple = setClinicalAssessmentV2Section(one, "anamnesis", { ...one.anamnesis, familySocialContext: "Contesto rilevante" });
  assert.deepEqual(Object.keys(multiple.anamnesis), ["relevantClinicalHistory", "familySocialContext"]);
  assert.equal("anamnesis" in setClinicalAssessmentV2Section(multiple, "anamnesis", { relevantClinicalHistory: "", familySocialContext: "" }), false);
});

test("completamento V2 richiede data e almeno un modulo ma non domini compilati", () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-05", modules: [{ code: "language_oral", version: 1 }] });
  const data = { patients: [{ id: "patient-1" }], appointments: [], sessions: [], goals: [], materials: [], clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-10-05", createdAt: assessment.createdAt, updatedAt: assessment.updatedAt }], clinicalAssessments: [], profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" } };
  const created = createClinicalAssessmentDraft(data, assessment);
  const completed = completeClinicalAssessment(created, assessment.id, "2026-10-05T12:00:00.000Z");
  assert.equal(getClinicalAssessment(completed, assessment.id).status, "completed");
  assert.throws(() => completeClinicalAssessment(createClinicalAssessmentDraft(data, { ...assessment, id: "missing-date", clinicalDate: undefined }), "missing-date"), /data clinica/i);
  assert.throws(() => completeClinicalAssessment(createClinicalAssessmentDraft(data, { ...assessment, id: "missing-module", data: { modules: [] } }), "missing-module"), /almeno un.area clinica/);
});

test("completed V2 è sola lettura, non usa autosave draft e resta completed dopo correzione", () => {
  const assessment = { ...createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-10-05", modules: [{ code: "language_oral", version: 1 }] }), status: "completed" };
  assert.equal(isClinicalAssessmentV2ReadOnly(assessment), true);
  assert.equal(isClinicalAssessmentV2ReadOnly(assessment, true), false);
  assert.equal(shouldAutosaveClinicalAssessmentV2(assessment), false);
  const data = { patients: [{ id: "patient-1" }], appointments: [], sessions: [], goals: [], materials: [], clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-10-05", createdAt: assessment.createdAt, updatedAt: assessment.updatedAt }], clinicalAssessments: [assessment], profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" } };
  assert.throws(() => autosaveClinicalAssessmentDraft(data, assessment), /completata non può essere sovrascritta/);
  const corrected = correctClinicalAssessment(data, { ...assessment, data: { ...assessment.data, summary: { clinicalSummary: "Correzione esplicita" } } });
  assert.equal(getClinicalAssessment(corrected, assessment.id).status, "completed");
  assert.equal(getClinicalAssessment(corrected, assessment.id).data.summary.clinicalSummary, "Correzione esplicita");
});

test("modello stampa V2 usa il modulo documentato e titoli per assessmentType", () => {
  const module = { code: "language_oral", version: 1, data: { comprehension: { status: "difficulties_observed" } } };
  const sections = toClinicalAssessmentV2PrintSections({ modules: [module], anamnesis: { familySocialContext: "Solo questa categoria" } });
  assert.deepEqual(sections.map((section) => section.code), ["anamnesis", "language_oral.comprehension"]);
  assert.equal(sections[0].fields.length, 1);
  assert.equal(clinicalAssessmentTypeLabel("initial"), "Prima valutazione");
  assert.equal(clinicalAssessmentTypeLabel("reassessment"), "Rivalutazione");
  assert.equal(clinicalAssessmentTypeLabel("interim"), "Valutazione intermedia");
  assert.equal(clinicalAssessmentTypeLabel("other"), "Valutazione");
});
