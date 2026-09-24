import assert from "node:assert/strict";
import test from "node:test";
import { anamnesisSectionGroups, anamnesisSectionRegistry, calculateAgeAtDate, createClinicalAnamnesis, getAnamnesisAgeGroup, getSuggestedAnamnesisSectionCodes, isClinicalAnamnesisV2, normalizeClinicalAnamnesis, resolveAnamnesisSectionToggle, searchAnamnesisSections } from "./anamnesis-sections.ts";
import { toClinicalAssessmentV2PrintSections } from "./module-registry.ts";

test("il registry usa codici univoci, ordine canonico e gruppi validi", () => {
  const codes = anamnesisSectionRegistry.map(({ code }) => code);
  const groups = new Set(anamnesisSectionGroups.map(({ code }) => code));
  assert.equal(new Set(codes).size, codes.length);
  assert.deepEqual(anamnesisSectionRegistry.map(({ order }) => order), Array.from({ length: 18 }, (_, index) => index + 1));
  assert.equal(anamnesisSectionRegistry.every(({ group }) => groups.has(group)), true);
});

test("calcola l'età rispetto alla data clinica, inclusa la soglia del compleanno", () => {
  assert.equal(calculateAgeAtDate("2020-10-10", "2026-10-09"), 5);
  assert.equal(calculateAgeAtDate("2020-10-10", "2026-10-10"), 6);
  assert.equal(getAnamnesisAgeGroup("2020-10-10", "2026-10-09"), "early_childhood");
  assert.equal(getAnamnesisAgeGroup("2020-10-10", "2026-10-10"), "school_age");
  assert.equal(getAnamnesisAgeGroup("2000-01-01", "2026-10-10"), "adult");
});

test("propone le sezioni previste per 0-5, 6-17, adulti e DOB assente", () => {
  assert.deepEqual(getSuggestedAnamnesisSectionCodes("2022-01-01", "2026-01-01"), ["pregnancy_birth", "motor_development", "communication_language_development", "hearing_ent", "feeding_swallowing_history", "family_social"]);
  assert.deepEqual(getSuggestedAnamnesisSectionCodes("2015-01-01", "2026-01-01"), ["clinical_history", "communication_language_development", "hearing_ent", "school_learning_history", "previous_assessments", "family_social"]);
  assert.deepEqual(getSuggestedAnamnesisSectionCodes("1990-01-01", "2026-01-01"), ["clinical_history", "previous_assessments", "hearing_ent", "education_work", "family_social", "medications_therapies"]);
  assert.deepEqual(getSuggestedAnamnesisSectionCodes(undefined, "2026-01-01"), ["clinical_history", "previous_assessments", "hearing_ent", "family_social"]);
});

test("i suggerimenti non attivano o salvano automaticamente alcuna sezione", () => {
  getSuggestedAnamnesisSectionCodes("2022-01-01", "2026-01-01");
  assert.equal(createClinicalAnamnesis({}), undefined);
  assert.equal(anamnesisSectionRegistry.length, 18);
});

test("accetta anamnesi assente, una o più sezioni e omette stringhe vuote", () => {
  assert.equal(isClinicalAnamnesisV2(undefined), false);
  assert.deepEqual(createClinicalAnamnesis({ clinical_history: "Dato" }), { sections: { clinical_history: "Dato" } });
  assert.deepEqual(createClinicalAnamnesis({ clinical_history: "Dato", hearing_ent: "Controllo" }), { sections: { clinical_history: "Dato", hearing_ent: "Controllo" } });
  assert.equal(createClinicalAnamnesis({ clinical_history: "  " }), undefined);
  assert.equal(isClinicalAnamnesisV2({ sections: { unknown: "Dato" } }), false);
});

test("normalizza il formato legacy senza perdita e conserva entrambe le fonti in caso di collisione", () => {
  const legacy = { relevantClinicalHistory: "Storia", developmentAndHistory: "Sviluppo", educationWorkContext: "Lavoro", familySocialContext: "Famiglia", previousAssessmentsInterventions: "Precedenti", additionalNotes: "Altro" };
  assert.equal(isClinicalAnamnesisV2(legacy), true);
  assert.deepEqual(normalizeClinicalAnamnesis(legacy), { sections: { clinical_history: "Storia", general_development_autonomy: "Sviluppo", education_work: "Lavoro", family_social: "Famiglia", previous_assessments: "Precedenti", other: "Altro" } });
  assert.equal(normalizeClinicalAnamnesis({ sections: { clinical_history: "Nuovo" }, relevantClinicalHistory: "Legacy" }).sections.clinical_history, "Nuovo\n\nLegacy");
});

test("attivazione, rimozione e ricerca lavorano su sezioni indipendenti dai suggerimenti", () => {
  const activated = createClinicalAnamnesis({ onset_event: "Evento riferito" });
  assert.equal(activated.sections.onset_event, "Evento riferito");
  assert.equal(createClinicalAnamnesis({ ...activated.sections, onset_event: undefined }), undefined);
  assert.deepEqual(searchAnamnesisSections("ORL").map(({ code }) => code), ["hearing_ent"]);
  assert.deepEqual(searchAnamnesisSections("familiarita").map(({ code }) => code), ["family_history"]);
});

test("il toggle attiva una sezione inattiva", () => {
  assert.equal(resolveAnamnesisSectionToggle(false), "activate");
});

test("il toggle disattiva senza conferma una sezione attiva vuota", () => {
  let confirmations = 0;
  assert.equal(resolveAnamnesisSectionToggle(true, "  ", () => { confirmations += 1; return false; }), "deactivate");
  assert.equal(confirmations, 0);
});

test("una sezione compilata richiede conferma e l'annullamento la conserva", () => {
  let confirmations = 0;
  assert.equal(resolveAnamnesisSectionToggle(true, "Contenuto", () => { confirmations += 1; return false; }), "keep");
  assert.equal(confirmations, 1);
  assert.deepEqual(createClinicalAnamnesis({ clinical_history: "Contenuto" }), { sections: { clinical_history: "Contenuto" } });
});

test("la conferma disattiva la sezione compilata e consente di eliminare il testo", () => {
  assert.equal(resolveAnamnesisSectionToggle(true, "Contenuto", () => true), "deactivate");
  assert.equal(createClinicalAnamnesis({}), undefined);
});

test("la stampa include solo dati documentati nell'ordine canonico e non i gruppi UI", () => {
  const sections = toClinicalAssessmentV2PrintSections({ modules: [], anamnesis: { sections: { hearing_ent: "Udito", pregnancy_birth: "Parto", clinical_history: "Storia" } } });
  assert.deepEqual(sections[0].fields.map(({ label }) => label), ["Storia clinica rilevante", "Gravidanza e parto", "Udito e storia ORL"]);
  assert.equal(JSON.stringify(sections).includes("Sensoriale / ORL"), false);
});
