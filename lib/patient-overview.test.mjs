import assert from "node:assert/strict";
import test from "node:test";
import {
  clinicalAssessmentTypeLabel,
  getActiveClinicalPathway,
  getLatestAssessment,
  getLatestSession,
  getNextFutureAppointment,
  getPatientOverview,
} from "./patient-overview.ts";

const stamp = "2026-09-27T08:00:00.000Z";
const patient = { id: "patient-1", firstName: "Ada", lastName: "Verdi", birthDate: "", contact: "", guardian: "", school: "", schoolClass: "", referralReason: "", notes: "", status: "active", createdAt: stamp };
const pathway = (overrides = {}) => ({ id: "pathway-1", patientId: patient.id, status: "active", startedOn: "2026-09-01", createdAt: stamp, updatedAt: stamp, ...overrides });
const assessment = (overrides = {}) => ({ id: "assessment-1", patientId: patient.id, clinicalPathwayId: "pathway-1", status: "completed", clinicalDate: "2026-09-10", assessmentType: "initial", schemaVersion: 2, data: { modules: [] }, createdAt: stamp, updatedAt: stamp, ...overrides });
const session = (overrides = {}) => ({ id: "session-1", patientId: patient.id, date: "2026-09-20", duration: 45, goalIds: [], activities: "Attività", response: "", helpLevel: "", result: "Risultato registrato", nextPlan: "Riprendere il lavoro", homework: "", notes: "", materialIds: [], createdAt: stamp, ...overrides });
const goal = (id, status = "in_progress", overrides = {}) => ({ id, patientId: patient.id, title: id, description: "", priority: 2, status, progress: 20, createdAt: stamp, ...overrides });
const appointment = (id, date, time = "10:00", overrides = {}) => ({ id, patientId: patient.id, date, time, duration: 45, type: "regular", notes: "", createdAt: stamp, ...overrides });
const data = (overrides = {}) => ({ patients: [patient], appointments: [], locations: [], services: [], sessions: [], goals: [], materials: [], clinicalPathways: [], clinicalAssessments: [], profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" }, ...overrides });

test("seleziona il percorso attivo corretto", () => {
  const active = pathway();
  const closed = pathway({ id: "pathway-old", status: "closed", closedOn: "2026-08-31" });
  assert.equal(getActiveClinicalPathway([closed, active], patient.id)?.id, active.id);
});

test("restituisce undefined quando non esiste un percorso attivo", () => {
  assert.equal(getActiveClinicalPathway([pathway({ status: "closed", closedOn: "2026-09-20" })], patient.id), undefined);
});

test("seleziona l'ultima valutazione per data clinica e aggiornamento", () => {
  const latest = assessment({ id: "latest", clinicalDate: "2026-09-22" });
  assert.equal(getLatestAssessment([latest, assessment({ id: "old", clinicalDate: "2026-08-10" })], patient.id)?.id, "latest");
});

test("usa etichetta corretta per assessment V1", () => {
  const v1 = assessment({ schemaVersion: 1, moduleType: "language_communication", assessmentType: "initial", data: {} });
  assert.equal(clinicalAssessmentTypeLabel(v1), "Prima valutazione");
});

test("usa etichetta corretta per assessment V2 initial", () => {
  assert.equal(clinicalAssessmentTypeLabel(assessment()), "Prima valutazione");
});

test("usa etichetta corretta per assessment V2 reassessment", () => {
  assert.equal(clinicalAssessmentTypeLabel(assessment({ assessmentType: "reassessment" })), "Rivalutazione");
});

test("seleziona l'ultima seduta e il suo nextPlan", () => {
  const overview = getPatientOverview(data({ sessions: [session(), session({ id: "latest", date: "2026-09-25", nextPlan: "Nuovo piano" })] }), patient.id);
  assert.equal(getLatestSession(overview.latestSession ? [overview.latestSession] : [], patient.id)?.id, "latest");
  assert.equal(overview.latestNextPlan, "Nuovo piano");
});

test("limita il focus a tre obiettivi attivi", () => {
  const goals = [goal("g1"), goal("g2"), goal("g3"), goal("g4")];
  const overview = getPatientOverview(data({ goals }), patient.id);
  assert.equal(overview.focusGoals.length, 3);
});

test("esclude obiettivi raggiunti e sospesi dal focus", () => {
  const overview = getPatientOverview(data({ goals: [goal("active"), goal("done", "achieved"), goal("paused", "suspended")] }), patient.id);
  assert.deepEqual(overview.focusGoals.map((item) => item.id), ["active"]);
});

test("seleziona il primo appuntamento realmente futuro", () => {
  const result = getNextFutureAppointment([
    appointment("past", "2026-09-27", "08:00"),
    appointment("later", "2026-09-28", "15:00"),
    appointment("next", "2026-09-27", "11:00"),
  ], patient.id, new Date("2026-09-27T10:00:00"));
  assert.equal(result?.id, "next");
});

test("esclude appuntamenti passati e annullati", () => {
  const result = getNextFutureAppointment([
    appointment("past", "2026-09-26"),
    appointment("cancelled", "2026-09-28", "10:00", { type: "cancelled" }),
  ], patient.id, new Date("2026-09-27T10:00:00"));
  assert.equal(result, undefined);
});

test("supporta un appuntamento legacy senza campi Calendario V2", () => {
  const legacy = appointment("legacy", "2026-09-28");
  assert.equal(getNextFutureAppointment([legacy], patient.id, new Date("2026-09-27T10:00:00"))?.id, "legacy");
});

test("non muta le collezioni in input", () => {
  const source = data({ clinicalPathways: [pathway()], goals: [goal("g2"), goal("g1")], sessions: [session()], clinicalAssessments: [assessment()], appointments: [appointment("next", "2026-09-28")] });
  const before = structuredClone(source);
  getPatientOverview(source, patient.id, new Date("2026-09-27T10:00:00"));
  assert.deepEqual(source, before);
});

test("costruisce una overview sicura con dati parziali", () => {
  const overview = getPatientOverview(data(), patient.id, new Date("2026-09-27T10:00:00"));
  assert.equal(overview.activePathway, undefined);
  assert.equal(overview.latestAssessment, undefined);
  assert.equal(overview.latestSession, undefined);
  assert.equal(overview.nextAppointment, undefined);
  assert.deepEqual(overview.focusGoals, []);
  assert.equal(overview.workflowNotice?.kind, "pathway_missing");
});
