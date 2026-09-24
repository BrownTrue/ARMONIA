import assert from "node:assert/strict";
import test from "node:test";
import {
  clinicalAssessmentFromRow,
  clinicalAssessmentRow,
  clinicalPathwayFromRow,
  clinicalPathwayRow,
} from "./clinical-repository.ts";
import { goalFromRow, goalRow } from "./repository.ts";

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
