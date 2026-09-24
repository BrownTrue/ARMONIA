import assert from "node:assert/strict";
import test from "node:test";
import { createLanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";
import {
  autosaveClinicalAssessmentDraft,
  closeClinicalPathway,
  completeClinicalAssessment,
  correctClinicalAssessment,
  createClinicalAssessmentDraft,
  createClinicalPathway,
  deleteClinicalAssessment,
  deleteClinicalPathway,
  getClinicalAssessment,
  getClinicalPathway,
  updateClinicalPathway,
} from "./local.ts";
import { isClinicalAssessment } from "./validation.ts";
import { readLocalData, serializeLocalData } from "../data/local-store.ts";
import { formatMultilineList, parseMultilineList } from "./multiline-list.ts";
import { linkGoalToClinicalPathway, unlinkGoalFromClinicalPathway } from "./goals.ts";
import { buildPatientTimeline } from "./timeline.ts";

const patient = {
  id: "patient-1",
  firstName: "Paziente",
  lastName: "Sintetico",
  birthDate: "2020-01-01",
  contact: "",
  guardian: "",
  school: "",
  schoolClass: "",
  referralReason: "Test",
  notes: "",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const legacyData = () => ({
  patients: [patient],
  appointments: [],
  sessions: [],
  goals: [],
  materials: [],
  profile: { firstName: "Ada", lastName: "Test", profession: "Logopedista", email: "ada@example.test", studio: "" },
});

const appData = () => ({ ...legacyData(), clinicalPathways: [], clinicalAssessments: [] });
const pathway = (overrides = {}) => ({
  id: "pathway-1",
  patientId: patient.id,
  status: "active",
  startedOn: "2026-02-01",
  createdAt: "2026-02-01T08:00:00.000Z",
  updatedAt: "2026-02-01T08:00:00.000Z",
  ...overrides,
});

test("inizializza un archivio mancante con il fallback previsto", () => {
  const result = readLocalData(null, appData);
  assert.equal(result.writable, true);
  assert.equal(result.migrated, true);
  assert.equal(result.data.patients.length, 1);
  assert.deepEqual(result.data.clinicalPathways, []);
});

test("legge AppData legacy V0 e lo converte senza perdere dati", () => {
  const source = legacyData();
  const result = readLocalData(JSON.stringify(source), appData);
  assert.equal(result.migrated, true);
  assert.equal(result.writable, true);
  assert.deepEqual(result.data.patients, source.patients);
  assert.deepEqual(result.data.profile, source.profile);
  assert.deepEqual(result.data.clinicalPathways, []);
  assert.deepEqual(result.data.clinicalAssessments, []);
});

test("normalizza a vuoto le proprietà cliniche mancanti in un envelope V1", () => {
  const raw = JSON.stringify({ schemaVersion: 1, savedAt: "2026-01-01T00:00:00.000Z", data: legacyData() });
  const result = readLocalData(raw, appData);
  assert.equal(result.migrated, true);
  assert.deepEqual(result.data.clinicalPathways, []);
  assert.deepEqual(result.data.clinicalAssessments, []);
});

test("legge un envelope V1 valido", () => {
  const source = appData();
  const raw = serializeLocalData(source, "2026-01-01T00:00:00.000Z");
  const result = readLocalData(raw, appData);
  assert.equal(result.writable, true);
  assert.equal(result.migrated, false);
  assert.deepEqual(result.data, source);
});

test("rifiuta una versione futura senza renderla sovrascrivibile", () => {
  const raw = JSON.stringify({ schemaVersion: 2, savedAt: "2026-01-01T00:00:00.000Z", data: appData() });
  const result = readLocalData(raw, appData);
  assert.equal(result.writable, false);
  assert.match(result.error, /versione più recente/);
  assert.equal(raw.includes('"schemaVersion":2'), true);
});

test("gestisce JSON corrotto senza renderlo sovrascrivibile", () => {
  const raw = "{dato-corrotto";
  const result = readLocalData(raw, appData);
  assert.equal(result.writable, false);
  assert.match(result.error, /originale è stato conservato/);
  assert.equal(raw, "{dato-corrotto");
});

test("crea un percorso clinico", () => {
  const result = createClinicalPathway(appData(), pathway());
  assert.equal(getClinicalPathway(result, "pathway-1")?.status, "active");
});

test("rifiuta un secondo percorso attivo dello stesso paziente", () => {
  const first = createClinicalPathway(appData(), pathway());
  assert.throws(() => createClinicalPathway(first, pathway({ id: "pathway-2" })), /già un percorso clinico attivo/);
});

test("chiude un percorso senza eliminare entità", () => {
  const first = createClinicalPathway(appData(), pathway());
  const result = closeClinicalPathway(first, "pathway-1", "2026-06-01", "2026-06-01T09:00:00.000Z");
  assert.equal(getClinicalPathway(result, "pathway-1")?.status, "closed");
  assert.equal(getClinicalPathway(result, "pathway-1")?.closedOn, "2026-06-01");
  assert.equal(result.patients.length, 1);
});

test("rifiuta date del percorso incoerenti", () => {
  const first = createClinicalPathway(appData(), pathway());
  assert.throws(() => closeClinicalPathway(first, "pathway-1", "2026-01-01"), /non può precedere/);
});

test("modifica titolo e data iniziale del percorso senza cambiarne identità o stato", () => {
  const first = createClinicalPathway(appData(), pathway());
  const changed = updateClinicalPathway(first, { ...pathway(), title: "Percorso corretto", startedOn: "2026-02-10", updatedAt: "2026-02-10T09:00:00.000Z" });
  const saved = getClinicalPathway(changed, "pathway-1");
  assert.equal(saved?.title, "Percorso corretto");
  assert.equal(saved?.startedOn, "2026-02-10");
  assert.equal(saved?.patientId, patient.id);
  assert.equal(saved?.status, "active");
});

test("rifiuta una data iniziale non valida durante la modifica del percorso", () => {
  const first = createClinicalPathway(appData(), pathway());
  assert.throws(() => updateClinicalPathway(first, { ...pathway(), startedOn: "2026-02-31" }), /data di inizio/);
});

test("elimina un percorso vuoto", () => {
  const first = createClinicalPathway(appData(), pathway());
  const deleted = deleteClinicalPathway(first, "pathway-1");
  assert.equal(deleted.clinicalPathways.length, 0);
  assert.equal(deleted.patients.length, 1);
});

test("crea e aggiorna tramite autosave una valutazione draft", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1", "2026-02-01T09:00:00.000Z");
  const created = createClinicalAssessmentDraft(withPathway, draft);
  const changed = { ...draft, data: { summary: { clinicalSummary: "Dato sintetico" } }, updatedAt: "2026-02-01T09:05:00.000Z" };
  const saved = autosaveClinicalAssessmentDraft(created, changed);
  assert.equal(getClinicalAssessment(saved, draft.id)?.data.summary?.clinicalSummary, "Dato sintetico");
});

test("non elimina un percorso che contiene una valutazione", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1");
  const withAssessment = createClinicalAssessmentDraft(withPathway, draft);
  assert.throws(() => deleteClinicalPathway(withAssessment, "pathway-1"), /contiene valutazioni/);
});

test("elimina soltanto la bozza selezionata", () => {
  const data = { ...createClinicalPathway(appData(), pathway()), appointments: [{ id: "appointment-1" }], sessions: [{ id: "session-1" }], goals: [{ id: "goal-1" }] };
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1");
  const withAssessment = createClinicalAssessmentDraft(data, draft);
  const deleted = deleteClinicalAssessment(withAssessment, draft.id);
  assert.equal(deleted.clinicalAssessments.length, 0);
  assert.equal(deleted.clinicalPathways.length, 1);
  assert.deepEqual(deleted.appointments, data.appointments);
  assert.deepEqual(deleted.sessions, data.sessions);
  assert.deepEqual(deleted.goals, data.goals);
});

test("conserva più test e permette di rimuoverne uno in autosave", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1", "2026-02-01T09:00:00.000Z");
  const withTests = { ...draft, data: { tests: { items: [{ id: "test-1", name: "Test sintetico A" }, { id: "test-2", name: "Test sintetico B" }] } } };
  const created = createClinicalAssessmentDraft(withPathway, withTests);
  const changed = { ...withTests, data: { tests: { items: withTests.data.tests.items.filter((item) => item.id !== "test-1") } }, updatedAt: "2026-02-01T09:05:00.000Z" };
  const saved = autosaveClinicalAssessmentDraft(created, changed);
  assert.deepEqual(getClinicalAssessment(saved, draft.id)?.data.tests?.items?.map((item) => item.id), ["test-2"]);
});

test("l'envelope locale conserva percorso e valutazione dopo una rilettura", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1");
  const withAssessment = createClinicalAssessmentDraft(withPathway, draft);
  const restored = readLocalData(serializeLocalData(withAssessment), appData);
  assert.equal(restored.data.clinicalPathways[0]?.id, "pathway-1");
  assert.equal(restored.data.clinicalAssessments[0]?.id, draft.id);
});

test("rifiuta assessment e percorso appartenenti a pazienti diversi", () => {
  const secondPatient = { ...patient, id: "patient-2" };
  const data = createClinicalPathway({ ...appData(), patients: [patient, secondPatient] }, pathway());
  const draft = createLanguageCommunicationAssessmentV1(secondPatient.id, "pathway-1");
  assert.throws(() => createClinicalAssessmentDraft(data, draft), /non sono coerenti/);
});

test("completa una valutazione valida e blocca un autosave successivo", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = { ...createLanguageCommunicationAssessmentV1(patient.id, "pathway-1"), clinicalDate: "2026-02-02" };
  const created = createClinicalAssessmentDraft(withPathway, draft);
  const completed = completeClinicalAssessment(created, draft.id, "2026-02-02T12:00:00.000Z");
  assert.equal(getClinicalAssessment(completed, draft.id)?.status, "completed");
  assert.throws(() => autosaveClinicalAssessmentDraft(completed, draft), /non può essere sovrascritta/);
});

test("corregge esplicitamente una valutazione completata mantenendo stato e relazioni", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = { ...createLanguageCommunicationAssessmentV1(patient.id, "pathway-1"), clinicalDate: "2026-02-02", data: { summary: { clinicalSummary: "Versione originale" } } };
  const created = createClinicalAssessmentDraft(withPathway, draft);
  const completed = completeClinicalAssessment(created, draft.id, "2026-02-02T12:00:00.000Z");
  const source = getClinicalAssessment(completed, draft.id);
  const corrected = correctClinicalAssessment(completed, { ...source, data: { summary: { clinicalSummary: "Versione corretta", strengths: ["Voce uno", "Voce due"] } } }, "2026-02-03T12:00:00.000Z");
  const saved = getClinicalAssessment(corrected, draft.id);
  assert.equal(saved?.status, "completed");
  assert.equal(saved?.patientId, patient.id);
  assert.equal(saved?.clinicalPathwayId, "pathway-1");
  assert.equal(saved?.data.summary?.clinicalSummary, "Versione corretta");
  assert.equal(saved?.updatedAt, "2026-02-03T12:00:00.000Z");
});

test("la correzione completed valida clinicalDate e non può cambiare paziente o percorso", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = { ...createLanguageCommunicationAssessmentV1(patient.id, "pathway-1"), clinicalDate: "2026-02-02" };
  const completed = completeClinicalAssessment(createClinicalAssessmentDraft(withPathway, draft), draft.id);
  const source = getClinicalAssessment(completed, draft.id);
  assert.throws(() => correctClinicalAssessment(completed, { ...source, clinicalDate: undefined }), /data clinica è obbligatoria/);
  assert.throws(() => correctClinicalAssessment(completed, { ...source, patientId: "patient-2" }), /spostare una valutazione/);
  assert.throws(() => correctClinicalAssessment(completed, { ...source, clinicalPathwayId: "pathway-2" }), /spostare una valutazione/);
});

test("elimina una completed senza eliminare percorso o altre entità", () => {
  const data = { ...createClinicalPathway(appData(), pathway()), appointments: [{ id: "appointment-1" }], sessions: [{ id: "session-1" }], goals: [{ id: "goal-1" }] };
  const draft = { ...createLanguageCommunicationAssessmentV1(patient.id, "pathway-1"), clinicalDate: "2026-02-02" };
  const completed = completeClinicalAssessment(createClinicalAssessmentDraft(data, draft), draft.id);
  const deleted = deleteClinicalAssessment(completed, draft.id);
  assert.equal(deleted.clinicalAssessments.length, 0);
  assert.equal(deleted.clinicalPathways.length, 1);
  assert.deepEqual(deleted.appointments, data.appointments);
  assert.deepEqual(deleted.sessions, data.sessions);
  assert.deepEqual(deleted.goals, data.goals);
});

test("richiede la data clinica per completare", () => {
  const withPathway = createClinicalPathway(appData(), pathway());
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1");
  const created = createClinicalAssessmentDraft(withPathway, draft);
  assert.throws(() => completeClinicalAssessment(created, draft.id), /data clinica è obbligatoria/);
});

test("rifiuta payload con schemaVersion errata", () => {
  const draft = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1");
  assert.equal(isClinicalAssessment({ ...draft, schemaVersion: 2 }), false);
  const withPathway = createClinicalPathway(appData(), pathway());
  assert.throws(() => createClinicalAssessmentDraft(withPathway, { ...draft, schemaVersion: 2 }), /non valida o non supportata/);
});

test("converte un testo multilinea in un array pulito senza perdere le voci valide", () => {
  assert.deepEqual(parseMultilineList(" Italiano \n\n Inglese\n  LIS  \n"), ["Italiano", "Inglese", "LIS"]);
});

test("ricostruisce su righe separate gli elenchi salvati", () => {
  const items = ["Punto di forza uno", "Punto di forza due", "Punto di forza tre"];
  assert.equal(formatMultilineList(items), "Punto di forza uno\nPunto di forza due\nPunto di forza tre");
  assert.deepEqual(parseMultilineList(formatMultilineList(items)), items);
});

test("collega e scollega un obiettivo al percorso attivo dello stesso paziente", () => {
  const goal = { id: "goal-1", patientId: patient.id, title: "Obiettivo sintetico", description: "", priority: 2, status: "in_progress", progress: 25, createdAt: "2026-02-01T08:00:00.000Z" };
  const withPathway = createClinicalPathway({ ...appData(), goals: [goal] }, pathway());
  const linked = linkGoalToClinicalPathway(withPathway, goal.id, "pathway-1");
  assert.equal(linked.goals[0].clinicalPathwayId, "pathway-1");
  const unlinked = unlinkGoalFromClinicalPathway(linked, goal.id);
  assert.equal(unlinked.goals[0].clinicalPathwayId, undefined);
});

test("rifiuta associazioni Goal e percorso di pazienti diversi o con percorso chiuso", () => {
  const secondPatient = { ...patient, id: "patient-2" };
  const goal = { id: "goal-1", patientId: secondPatient.id, title: "Obiettivo sintetico", description: "", priority: 2, status: "in_progress", progress: 0, createdAt: "2026-02-01T08:00:00.000Z" };
  const withPathway = createClinicalPathway({ ...appData(), patients: [patient, secondPatient], goals: [goal] }, pathway());
  assert.throws(() => linkGoalToClinicalPathway(withPathway, goal.id, "pathway-1"), /stesso paziente/);
  const samePatient = { ...goal, patientId: patient.id };
  const closed = closeClinicalPathway({ ...withPathway, goals: [samePatient] }, "pathway-1", "2026-03-01");
  assert.throws(() => linkGoalToClinicalPathway(closed, samePatient.id, "pathway-1"), /percorso attivo/);
});

test("la chiusura conserva il collegamento Goal e impedisce di alterare lo storico", () => {
  const goal = { id: "goal-1", patientId: patient.id, title: "Obiettivo sintetico", description: "", priority: 2, status: "in_progress", progress: 50, createdAt: "2026-02-01T08:00:00.000Z" };
  const linked = linkGoalToClinicalPathway(createClinicalPathway({ ...appData(), goals: [goal] }, pathway()), goal.id, "pathway-1");
  const closed = closeClinicalPathway(linked, "pathway-1", "2026-03-01");
  assert.equal(closed.goals[0].clinicalPathwayId, "pathway-1");
  assert.throws(() => unlinkGoalFromClinicalPathway(closed, goal.id), /collegamento storico/);
  const restored = readLocalData(serializeLocalData(closed), appData);
  assert.equal(restored.data.goals[0].clinicalPathwayId, "pathway-1");
});

test("non elimina un percorso con obiettivi collegati", () => {
  const goal = { id: "goal-1", patientId: patient.id, title: "Obiettivo sintetico", description: "", priority: 2, status: "in_progress", progress: 50, createdAt: "2026-02-01T08:00:00.000Z" };
  const linked = linkGoalToClinicalPathway(createClinicalPathway({ ...appData(), goals: [goal] }, pathway()), goal.id, "pathway-1");
  assert.throws(() => deleteClinicalPathway(linked, "pathway-1"), /obiettivi collegati/);
});

test("aggrega sedute e valutazioni in ordine per data clinica e createdAt", () => {
  const sessions = [
    { id: "session-older", patientId: patient.id, date: "2026-09-24", duration: 45, goalIds: [], activities: "Attività", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: "2026-09-24T08:00:00.000Z" },
    { id: "session-newer", patientId: patient.id, date: "2026-09-26", duration: 45, goalIds: [], activities: "", response: "", helpLevel: "", result: "Risultato", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: "2026-09-26T09:00:00.000Z" },
  ];
  const assessment = { ...createLanguageCommunicationAssessmentV1(patient.id, "pathway-1", "2026-09-24T10:00:00.000Z"), clinicalDate: "2026-09-24", status: "completed" };
  const draftWithoutDate = createLanguageCommunicationAssessmentV1(patient.id, "pathway-1", "2026-09-25T10:00:00.000Z");
  const timeline = buildPatientTimeline(patient.id, sessions, [assessment, draftWithoutDate]);
  assert.deepEqual(timeline.map((item) => item.id), ["session:session-newer", `clinical_assessment:${draftWithoutDate.id}`, `clinical_assessment:${assessment.id}`, "session:session-older"]);
  assert.equal(timeline[1].occurredOn, "2026-09-25");
});
