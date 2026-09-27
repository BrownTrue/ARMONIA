import assert from "node:assert/strict";
import test from "node:test";
import { buildClinicalPathwayOverview } from "./pathway-overview.ts";

const patientId = "patient-1";
const stamp = "2026-09-27T08:00:00.000Z";
const pathway = (overrides = {}) => ({ id: "pathway-1", patientId, status: "active", startedOn: "2026-09-01", createdAt: stamp, updatedAt: stamp, ...overrides });
const goal = (id, overrides = {}) => ({ id, patientId, clinicalPathwayId: "pathway-1", title: `Goal ${id}`, description: "", priority: 2, status: "in_progress", progress: 20, createdAt: stamp, ...overrides });
const session = (id, date, goalIds, overrides = {}) => ({ id, patientId, date, duration: 45, goalIds, activities: "Attività", response: "", helpLevel: "", result: "Risultato", nextPlan: "Piano", homework: "", notes: "", materialIds: [], createdAt: `${date}T08:00:00.000Z`, ...overrides });
const assessment = (id, assessmentType = "initial", overrides = {}) => ({ id, patientId, clinicalPathwayId: "pathway-1", assessmentType, status: "completed", schemaVersion: 2, clinicalDate: "2026-09-10", data: { modules: [] }, createdAt: stamp, updatedAt: stamp, ...overrides });

test("costruisce un percorso attivo completo", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("g1")], [session("s1", "2026-09-20", ["g1"])], [assessment("a1"), assessment("a2", "reassessment")]);
  assert.equal(result.initialAssessment?.id, "a1");
  assert.deepEqual(result.assessments.map((item) => item.id), ["a1", "a2"]);
  assert.equal(result.activeGoals.length, 1);
  assert.equal(result.relevantSessions.length, 1);
  assert.equal(result.reassessments.length, 1);
});

test("gestisce un percorso senza assessment", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [goal("g1")], [], []).initialAssessment, undefined);
});

test("riconosce una valutazione iniziale V1", () => {
  const v1 = { ...assessment("v1"), schemaVersion: 1, moduleType: "language_communication", data: {} };
  assert.equal(buildClinicalPathwayOverview(pathway(), [], [], [v1]).initialAssessment?.id, "v1");
});

test("riconosce una valutazione iniziale V2", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [], [], [assessment("v2")]).initialAssessment?.schemaVersion, 2);
});

test("una assessment draft genera il richiamo prioritario", () => {
  const draft = assessment("draft", "reassessment", { status: "draft" });
  assert.deepEqual(buildClinicalPathwayOverview(pathway(), [], [], [draft]).operationalNotice, { kind: "assessment_draft", assessment: draft });
});

test("seleziona gli obiettivi attivi", () => {
  assert.deepEqual(buildClinicalPathwayOverview(pathway(), [goal("active"), goal("done", { status: "achieved" })], [], []).activeGoals.map((item) => item.id), ["active"]);
});

test("separa obiettivi conclusi e sospesi", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("done", { status: "achieved" }), goal("paused", { status: "suspended" })], [], []);
  assert.deepEqual(new Set(result.historicalGoals.map((item) => item.id)), new Set(["done", "paused"]));
});

test("mostra subito al massimo tre obiettivi", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("1"), goal("2"), goal("3"), goal("4")], [], []);
  assert.equal(result.visibleActiveGoals.length, 3);
  assert.equal(result.hiddenActiveGoalCount, 1);
});

test("include una seduta collegata tramite goal del pathway", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [goal("g1")], [session("s1", "2026-09-20", ["g1"])], []).relevantSessions.length, 1);
});

test("esclude una seduta senza goal", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [goal("g1")], [session("s1", "2026-09-20", [])], []).relevantSessions.length, 0);
});

test("esclude una seduta con goal appartenente a un altro pathway", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [goal("other", { clinicalPathwayId: "pathway-2" })], [session("s1", "2026-09-20", ["other"])], []).relevantSessions.length, 0);
});

test("deduplica una seduta con più goal dello stesso pathway", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("g1"), goal("g2")], [session("s1", "2026-09-20", ["g1", "g2"])], []);
  assert.equal(result.relevantSessions.length, 1);
});

test("seleziona l'ultima seduta pertinente", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("g1")], [session("old", "2026-09-10", ["g1"]), session("new", "2026-09-20", ["g1"])], []);
  assert.equal(result.latestRelevantSession?.id, "new");
});

test("conserva il nextPlan della seduta pertinente senza interpretarlo", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [goal("g1")], [session("s1", "2026-09-20", ["g1"], { nextPlan: "Riprendere il compito" })], []).latestRelevantSession?.nextPlan, "Riprendere il compito");
});

test("include una rivalutazione collegata", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [], [], [assessment("r1", "reassessment")]).reassessments[0].id, "r1");
});

test("conserva lo stato draft di una rivalutazione", () => {
  assert.equal(buildClinicalPathwayOverview(pathway(), [], [], [assessment("r1", "reassessment", { status: "draft" })]).reassessments[0].status, "draft");
});

test("ordina più rivalutazioni dalla più recente", () => {
  const result = buildClinicalPathwayOverview(pathway(), [], [], [assessment("old", "interim", { clinicalDate: "2026-09-10" }), assessment("new", "reassessment", { clinicalDate: "2026-09-20" })]);
  assert.deepEqual(result.reassessments.map((item) => item.id), ["new", "old"]);
});

test("un percorso storico non produce richiami operativi", () => {
  const result = buildClinicalPathwayOverview(pathway({ status: "closed", closedOn: "2026-09-25" }), [], [], []);
  assert.equal(result.operationalNotice, undefined);
});

test("più pathway non contaminano obiettivi sedute o assessment", () => {
  const result = buildClinicalPathwayOverview(pathway(), [goal("own"), goal("other", { clinicalPathwayId: "pathway-2" })], [session("own", "2026-09-20", ["own"]), session("other", "2026-09-21", ["other"])], [assessment("own-a"), assessment("other-a", "reassessment", { clinicalPathwayId: "pathway-2" })]);
  assert.deepEqual(result.activeGoals.map((item) => item.id), ["own"]);
  assert.deepEqual(result.relevantSessions.map((item) => item.id), ["own"]);
  assert.equal(result.reassessments.length, 0);
});

test("il richiamo operativo segue la priorità deterministica", () => {
  const noGoals = buildClinicalPathwayOverview(pathway(), [], [], [assessment("complete")]);
  const noAssessment = buildClinicalPathwayOverview(pathway(), [goal("g1")], [], []);
  assert.equal(noGoals.operationalNotice?.kind, "pathway_without_goals");
  assert.equal(noAssessment.operationalNotice?.kind, "pathway_without_assessment");
});

test("la proiezione non muta gli input", () => {
  const inputs = { pathway: pathway(), goals: [goal("g1")], sessions: [session("s1", "2026-09-20", ["g1"])], assessments: [assessment("a1")] };
  const before = structuredClone(inputs);
  buildClinicalPathwayOverview(inputs.pathway, inputs.goals, inputs.sessions, inputs.assessments);
  assert.deepEqual(inputs, before);
});
