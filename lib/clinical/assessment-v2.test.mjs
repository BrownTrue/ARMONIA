import assert from "node:assert/strict";
import test from "node:test";
import { createLanguageCommunicationAssessmentV1 } from "./assessment-v1.ts";
import { assessmentRendererVersion } from "./assessment-dispatch.ts";
import { createClinicalAssessmentV2 } from "./assessment-v2.ts";
import { completeClinicalAssessment, createClinicalAssessmentDraft, getClinicalAssessment } from "./local.ts";
import { createClinicalModuleInstance, getClinicalModuleDefinition } from "./module-registry.ts";
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
