import assert from "node:assert/strict";
import test from "node:test";
import { buildPatientTimeline, filterPatientTimeline } from "./timeline.ts";

const stamp = "2026-09-27T08:00:00.000Z";
const patientId = "patient-1";
const session = (overrides = {}) => ({ id: "session-1", patientId, date: "2026-09-25", duration: 45, goalIds: [], activities: "Attività registrata", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: stamp, ...overrides });
const v1 = (overrides = {}) => ({ id: "assessment-v1", patientId, clinicalPathwayId: "pathway-1", moduleType: "language_communication", assessmentType: "initial", status: "completed", schemaVersion: 1, clinicalDate: "2026-09-24", data: {}, createdAt: stamp, updatedAt: stamp, ...overrides });
const v2 = (assessmentType, overrides = {}) => ({ id: `assessment-${assessmentType}`, patientId, clinicalPathwayId: "pathway-1", assessmentType, status: "completed", schemaVersion: 2, clinicalDate: "2026-09-26", data: { modules: [] }, createdAt: stamp, updatedAt: stamp, ...overrides });

test("ordina sedute e assessment dal più recente al più vecchio", () => {
  const items = buildPatientTimeline(patientId, [session({ date: "2026-09-25" })], [v1(), v2("initial")]);
  assert.deepEqual(items.map((item) => item.id), ["clinical_assessment:assessment-initial", "session:session-1", "clinical_assessment:assessment-v1"]);
});

test("conserva tutti i campi registrati di una seduta completa", () => {
  const complete = session({ response: "Buona", helpLevel: "Minimo", result: "Risultato", homework: "Compito", nextPlan: "Prossima volta", notes: "Nota", goalIds: ["goal-1"], materialIds: ["material-1"] });
  const item = buildPatientTimeline(patientId, [complete], [], [{ id: "goal-1", patientId, title: "Obiettivo", description: "", priority: 1, status: "in_progress", progress: 0, createdAt: stamp }], [{ id: "material-1", title: "Carte", description: "", category: "gioco", tags: [], fileName: "carte.pdf", mimeType: "application/pdf", size: 10, favorite: false, patientIds: [], createdAt: stamp }])[0];
  assert.equal(item.type, "session");
  assert.equal(item.session.homework, "Compito");
  assert.equal(item.session.nextPlan, "Prossima volta");
  assert.equal(item.session.notes, "Nota");
});

test("gestisce una seduta con soli dati minimi senza inventare placeholder", () => {
  const item = buildPatientTimeline(patientId, [session({ activities: "--", result: "" })], [])[0];
  assert.equal(item.subtitle, undefined);
  assert.deepEqual(item.goals, []);
  assert.deepEqual(item.materials, []);
});

test("risolve i nomi degli obiettivi collegati senza inventare esiti", () => {
  const goals = [{ id: "goal-1", patientId, title: "Produzione narrativa", description: "", priority: 1, status: "in_progress", progress: 50, createdAt: stamp }];
  const item = buildPatientTimeline(patientId, [session({ goalIds: ["goal-1"] })], [], goals)[0];
  assert.deepEqual(item.goals, [{ id: "goal-1", title: "Produzione narrativa", available: true }]);
});

test("risolve titolo e tipo dei materiali collegati", () => {
  const materials = [{ id: "material-1", title: "Sequenze", description: "", category: "linguaggio", tags: [], fileName: "sequenze.pdf", mimeType: "application/pdf", size: 10, favorite: false, patientIds: [], createdAt: stamp }];
  const item = buildPatientTimeline(patientId, [session({ materialIds: ["material-1"] })], [], [], materials)[0];
  assert.equal(item.materials[0].title, "Sequenze");
  assert.equal(item.materials[0].mimeType, "application/pdf");
  assert.equal(item.materials[0].available, true);
});

test("rappresenta elegantemente un materiale storico eliminato", () => {
  const item = buildPatientTimeline(patientId, [session({ materialIds: ["missing"] })], [])[0];
  assert.deepEqual(item.materials[0], { id: "missing", title: "Materiale non più disponibile", mimeType: undefined, available: false, material: undefined });
});

test("mantiene homework nextPlan e note senza reinterpretarli", () => {
  const item = buildPatientTimeline(patientId, [session({ homework: "Leggere", nextPlan: "Ripetere", notes: "Testo libero" })], [])[0];
  assert.equal(item.session.homework, "Leggere");
  assert.equal(item.session.nextPlan, "Ripetere");
  assert.equal(item.session.notes, "Testo libero");
});

test("etichetta correttamente Assessment V1", () => {
  const item = buildPatientTimeline(patientId, [], [v1()])[0];
  assert.equal(item.title, "Prima valutazione");
  assert.deepEqual(item.moduleLabels, ["Linguaggio e comunicazione"]);
});

for (const [type, label] of [["initial", "Valutazione iniziale"], ["reassessment", "Rivalutazione"], ["interim", "Valutazione intermedia"], ["other", "Altro"]]) {
  test(`etichetta correttamente Assessment V2 ${type}`, () => {
    assert.equal(buildPatientTimeline(patientId, [], [v2(type)])[0].title, label);
  });
}

test("distingue assessment draft e completed conservandone lo stato", () => {
  const items = buildPatientTimeline(patientId, [], [v2("initial", { id: "draft", status: "draft" }), v2("reassessment", { id: "completed" })]);
  assert.equal(items.find((item) => item.entityId === "draft").assessment.status, "draft");
  assert.equal(items.find((item) => item.entityId === "completed").assessment.status, "completed");
});

test("espone le label reali dei moduli V2", () => {
  const item = buildPatientTimeline(patientId, [], [v2("reassessment", { data: { modules: [{ code: "language_oral", version: 1, data: {} }, { code: "social_pragmatics", version: 1, data: {} }] } })])[0];
  assert.deepEqual(item.moduleLabels, ["Linguaggio orale", "Comunicazione sociale e pragmatica"]);
});

test("filtro Tutte conserva tutti gli elementi", () => {
  const items = buildPatientTimeline(patientId, [session()], [v1()]);
  assert.equal(filterPatientTimeline(items, "all").length, 2);
});

test("filtro Sedute mostra soltanto le sedute", () => {
  const items = filterPatientTimeline(buildPatientTimeline(patientId, [session()], [v1()]), "sessions");
  assert.deepEqual(items.map((item) => item.type), ["session"]);
});

test("filtro Valutazioni mostra soltanto le valutazioni", () => {
  const items = filterPatientTimeline(buildPatientTimeline(patientId, [session()], [v1()]), "assessments");
  assert.deepEqual(items.map((item) => item.type), ["clinical_assessment"]);
});

test("ricerca locale trova attività e risultati delle sedute", () => {
  const items = buildPatientTimeline(patientId, [session({ id: "a", activities: "Denominazione figure" }), session({ id: "b", activities: "Gioco", result: "Comprensione migliorata" })], []);
  assert.deepEqual(filterPatientTimeline(items, "all", "denominazione").map((item) => item.entityId), ["a"]);
  assert.deepEqual(filterPatientTimeline(items, "all", "comprensione").map((item) => item.entityId), ["b"]);
});

test("ricerca locale trova tipo e moduli delle valutazioni", () => {
  const items = buildPatientTimeline(patientId, [], [v2("reassessment", { data: { modules: [{ code: "social_pragmatics", version: 1, data: {} }] } })]);
  assert.equal(filterPatientTimeline(items, "all", "rivalutazione").length, 1);
  assert.equal(filterPatientTimeline(items, "all", "pragmatica").length, 1);
});

test("ricerca e filtro si combinano e la query vuota conserva il risultato", () => {
  const items = buildPatientTimeline(patientId, [session({ activities: "Narrazione" })], [v1()]);
  assert.equal(filterPatientTimeline(items, "assessments", "narrazione").length, 0);
  assert.equal(filterPatientTimeline(items, "all", "  ").length, 2);
});

test("costruzione e filtri non mutano gli input", () => {
  const sessions = [session({ goalIds: ["goal-1"], materialIds: ["material-1"] })];
  const assessments = [v1()];
  const before = structuredClone({ sessions, assessments });
  const items = buildPatientTimeline(patientId, sessions, assessments);
  filterPatientTimeline(items, "sessions", "attività");
  assert.deepEqual({ sessions, assessments }, before);
});
