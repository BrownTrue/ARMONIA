import assert from "node:assert/strict";
import test from "node:test";
import {
  autosaveCloudClinicalAssessmentDraft,
  completeCloudClinicalAssessment,
  correctCloudClinicalAssessment,
  createCloudClinicalAssessmentDraft,
  clinicalAssessmentFromRow,
  clinicalAssessmentRow,
  clinicalPathwayFromRow,
  clinicalPathwayRow,
  loadCloudClinicalData,
} from "./clinical-repository.ts";
import { goalFromRow, goalRow } from "./repository.ts";
import { createConfiguredClinicalAssessmentV2 } from "../clinical/assessment-v2.ts";
import { createLanguageCommunicationAssessmentV1 } from "../clinical/assessment-v1.ts";

const userId = "00000000-0000-4000-8000-000000000001";

test("converte ClinicalPathway tra riga DB e modello applicativo", () => {
  const row = {
    id: "pathway-1",
    patient_id: "patient-1",
    title: "Percorso sintetico",
    status: "closed",
    started_on: "2026-01-10",
    closed_on: "2026-06-10",
    created_at: "2026-01-10T08:00:00.000Z",
    updated_at: "2026-06-10T08:00:00.000Z",
  };
  const model = clinicalPathwayFromRow(row);
  assert.equal(model.patientId, "patient-1");
  assert.equal(model.closedOn, "2026-06-10");
  assert.deepEqual(clinicalPathwayRow(model, userId), { ...row, user_id: userId });
});

test("converte e valida il JSONB ClinicalAssessment V1", () => {
  const row = {
    id: "assessment-1",
    patient_id: "patient-1",
    clinical_pathway_id: "pathway-1",
    module_type: "language_communication",
    assessment_type: "initial",
    status: "draft",
    schema_version: 1,
    clinical_date: null,
    data: { summary: { strengths: ["Dato sintetico"] } },
    created_at: "2026-01-10T08:00:00.000Z",
    updated_at: "2026-01-10T08:05:00.000Z",
  };
  const model = clinicalAssessmentFromRow(row);
  assert.equal(model.clinicalPathwayId, "pathway-1");
  assert.deepEqual(model.data, row.data);
  assert.deepEqual(clinicalAssessmentRow(model, userId), { ...row, user_id: userId });
  assert.throws(
    () => clinicalAssessmentFromRow({ ...row, data: { summary: { strengths: [42] } } }),
    /non è compatibile/,
  );
});

const v2Row = (overrides = {}) => ({
  id: "assessment-v2",
  patient_id: "patient-1",
  clinical_pathway_id: "pathway-1",
  module_type: null,
  assessment_type: "initial",
  status: "draft",
  schema_version: 2,
  clinical_date: "2026-09-25",
  data: { modules: [] },
  created_at: "2026-09-25T08:00:00.000Z",
  updated_at: "2026-09-25T08:00:00.000Z",
  ...overrides,
});

test("converte una riga V2 senza introdurre moduleType nel dominio", () => {
  for (const assessmentType of ["initial", "reassessment", "interim", "other"]) {
    const model = clinicalAssessmentFromRow(v2Row({ assessment_type: assessmentType }));
    assert.equal(model.schemaVersion, 2);
    assert.equal(model.assessmentType, assessmentType);
    assert.equal("moduleType" in model, false);
    assert.equal(clinicalAssessmentRow(model, userId).module_type, null);
    assert.equal(clinicalAssessmentRow(model, userId).schema_version, 2);
  }
});

test("round trip V2 conserva draft vuoto, multi-modulo, completed e anamnesi", () => {
  const data = {
    modules: [
      { code: "language_oral", version: 1, data: { comprehension: { status: "further_assessment" } } },
      { code: "voice", version: 1, data: { profile: { status: "no_evident_difficulty" } } },
    ],
    anamnesis: { sections: { clinical_history: "Dato sintetico" } },
  };
  const source = v2Row({ status: "completed", assessment_type: "reassessment", data });
  const model = clinicalAssessmentFromRow(source);
  const row = clinicalAssessmentRow(model, userId);
  assert.deepEqual(row, { ...source, user_id: userId });
  assert.equal("moduleType" in model, false);
  assert.deepEqual(clinicalAssessmentFromRow(v2Row()).data, { modules: [] });
});

test("rifiuta versioni, discriminanti e payload V2 incoerenti", () => {
  assert.throws(() => clinicalAssessmentFromRow(v2Row({ schema_version: 3 })), /non supportata/);
  assert.throws(() => clinicalAssessmentFromRow(v2Row({ schema_version: 1, module_type: null })), /V1 cloud non sono coerenti/);
  assert.throws(() => clinicalAssessmentFromRow(v2Row({ module_type: "language_communication" })), /V2 cloud non sono coerenti/);
  assert.throws(() => clinicalAssessmentFromRow(v2Row({ assessment_type: "diagnostic" })), /V2 cloud non sono coerenti/);
  assert.throws(() => clinicalAssessmentFromRow(v2Row({ data: { modules: [{ code: "unknown", version: 1, data: {} }] } })), /non è compatibile/);
});

function fakeClinicalClient() {
  const writes = [];
  const chain = (table) => ({
    insert(value) { writes.push({ table, kind: "insert", value }); return this; },
    update(value) { writes.push({ table, kind: "update", value }); return this; },
    eq() { return this; },
    select() { return this; },
    single() { return Promise.resolve({ data: { id: "assessment-v2" }, error: null }); },
  });
  return { client: { from: (table) => chain(table) }, writes };
}

const cloudData = (assessment) => ({
  patients: [{ id: "patient-1" }], appointments: [], sessions: [], goals: [], materials: [],
  clinicalPathways: [{ id: "pathway-1", patientId: "patient-1", status: "active", startedOn: "2026-09-25", createdAt: "2026-09-25T08:00:00.000Z", updatedAt: "2026-09-25T08:00:00.000Z" }],
  clinicalAssessments: assessment ? [assessment] : [],
  profile: { firstName: "", lastName: "", profession: "", email: "", studio: "" },
});

test("create cloud V2 inserisce esplicitamente i discriminanti V2 e modules vuoto", async () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "initial", clinicalDate: "2026-09-25", modules: [], now: "2026-09-25T08:00:00.000Z" });
  const { client, writes } = fakeClinicalClient();
  const next = await createCloudClinicalAssessmentDraft(client, userId, cloudData(), assessment);
  assert.equal(next.clinicalAssessments[0].schemaVersion, 2);
  assert.equal(writes[0].value.module_type, null);
  assert.equal(writes[0].value.schema_version, 2);
  assert.deepEqual(writes[0].value.data, { modules: [] });
});

test("create cloud V1 mantiene i discriminanti e il payload storici", async () => {
  const assessment = createLanguageCommunicationAssessmentV1(
    "patient-1",
    "pathway-1",
    "2026-09-25T08:00:00.000Z",
  );
  const { client, writes } = fakeClinicalClient();
  const next = await createCloudClinicalAssessmentDraft(client, userId, cloudData(), assessment);
  assert.equal(next.clinicalAssessments[0].schemaVersion, 1);
  assert.equal(writes[0].value.module_type, "language_communication");
  assert.equal(writes[0].value.assessment_type, "initial");
  assert.equal(writes[0].value.schema_version, 1);
  assert.deepEqual(writes[0].value.data, {});
});

test("load cloud restituisce V1 e V2 dalla stessa lista", async () => {
  const pathway = {
    id: "pathway-1",
    patient_id: "patient-1",
    title: null,
    status: "active",
    started_on: "2026-09-25",
    closed_on: null,
    created_at: "2026-09-25T08:00:00.000Z",
    updated_at: "2026-09-25T08:00:00.000Z",
  };
  const v1 = {
    id: "assessment-v1",
    patient_id: "patient-1",
    clinical_pathway_id: "pathway-1",
    module_type: "language_communication",
    assessment_type: "initial",
    status: "draft",
    schema_version: 1,
    clinical_date: null,
    data: {},
    created_at: "2026-09-25T08:00:00.000Z",
    updated_at: "2026-09-25T08:00:00.000Z",
  };
  const rowsByTable = {
    clinical_pathways: [pathway],
    clinical_assessments: [v1, v2Row()],
  };
  const client = {
    from(table) {
      return {
        select() { return this; },
        eq() { return this; },
        order() { return Promise.resolve({ data: rowsByTable[table], error: null }); },
      };
    },
  };
  const loaded = await loadCloudClinicalData(client, userId);
  assert.deepEqual(loaded.clinicalAssessments.map(({ schemaVersion }) => schemaVersion), [1, 2]);
  assert.equal("moduleType" in loaded.clinicalAssessments[1], false);
});

test("autosave, completamento e correzione cloud V2 mantengono il payload completo", async () => {
  const assessment = createConfiguredClinicalAssessmentV2({ patientId: "patient-1", clinicalPathwayId: "pathway-1", assessmentType: "interim", clinicalDate: "2026-09-25", modules: [{ code: "voice", version: 1 }], now: "2026-09-25T08:00:00.000Z" });
  const changed = { ...assessment, updatedAt: "2026-09-25T08:01:00.000Z", data: { ...assessment.data, anamnesis: { sections: { clinical_history: "Dato" } } } };
  const autosaveFake = fakeClinicalClient();
  const saved = await autosaveCloudClinicalAssessmentDraft(autosaveFake.client, userId, cloudData(assessment), changed);
  assert.deepEqual(autosaveFake.writes[0].value.data, changed.data);

  const completeFake = fakeClinicalClient();
  const completedData = await completeCloudClinicalAssessment(completeFake.client, userId, saved, assessment.id);
  assert.equal(completedData.clinicalAssessments[0].status, "completed");
  assert.equal(completeFake.writes[0].value.status, "completed");

  const completed = completedData.clinicalAssessments[0];
  const corrected = { ...completed, data: { ...completed.data, summary: { clinicalSummary: "Correzione" } } };
  const correctFake = fakeClinicalClient();
  const correctedData = await correctCloudClinicalAssessment(correctFake.client, userId, completedData, corrected, "2026-09-25T08:02:00.000Z");
  assert.equal(correctedData.clinicalAssessments[0].status, "completed");
  assert.deepEqual(correctFake.writes[0].value.data, corrected.data);
  assert.equal(correctFake.writes[0].value.updated_at, "2026-09-25T08:02:00.000Z");
});

test("converte Goal con associazione opzionale al percorso", () => {
  const row = {
    id: "goal-1",
    patient_id: "patient-1",
    clinical_pathway_id: "pathway-1",
    title: "Obiettivo sintetico",
    description: null,
    priority: 2,
    status: "in_progress",
    progress: 30,
    created_at: "2026-01-10T08:00:00.000Z",
  };
  const model = goalFromRow(row);
  assert.equal(model.clinicalPathwayId, "pathway-1");
  assert.equal(goalRow(model, userId).clinical_pathway_id, "pathway-1");
  assert.equal(goalFromRow({ ...row, clinical_pathway_id: null }).clinicalPathwayId, undefined);
});
