import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { assessmentStepsWithIssues, assessmentV2CompletionIssues, firstNavigableAssessmentIssue } from "./assessment-v2-validation-ui.ts";

const assessment = (overrides = {}) => ({ id: "a1", patientId: "p1", clinicalPathwayId: "cp1", status: "draft", clinicalDate: "2026-10-04", assessmentType: "initial", schemaVersion: 2, data: { modules: [{ code: "language_oral", version: 1, data: {} }] }, createdAt: "2026-10-04T10:00:00Z", updatedAt: "2026-10-04T10:00:00Z", ...overrides });

test("mappa data clinica mancante al campo e al primo step", () => {
  const issues = assessmentV2CompletionIssues(assessment({ clinicalDate: undefined }));
  assert.deepEqual(issues[0], { path: "clinicalDate", step: 0, field: "clinical-date", message: "Completa la data clinica.", kind: "field" });
  assert.equal(firstNavigableAssessmentIssue(issues)?.step, 0);
});

test("segnala lo step aree cliniche senza alterare gli step validi", () => {
  const issues = assessmentV2CompletionIssues(assessment({ data: { modules: [] } }));
  const steps = assessmentStepsWithIssues(issues);
  assert.equal(steps.has(2), true);
  assert.equal(steps.has(0), false);
});

test("ordina errori multipli e porta al primo errore utile", () => {
  const issues = assessmentV2CompletionIssues(assessment({ clinicalDate: undefined, data: { modules: [] } }));
  assert.equal(issues.length, 2);
  assert.equal(firstNavigableAssessmentIssue(issues)?.field, "clinical-date");
});

test("distingue un errore globale non associabile a un campo", () => {
  const invalid = assessment({ data: { modules: [{ code: "language_oral", version: 1, data: {} }], futureSection: {} } });
  const issues = assessmentV2CompletionIssues(invalid);
  assert.equal(issues.some((issue) => issue.kind === "global" && issue.step === undefined), true);
});

test("una bozza incompleta produce issue UI senza mutare il payload", () => {
  const draft = assessment({ clinicalDate: undefined, data: { modules: [] } });
  const before = structuredClone(draft);
  assessmentV2CompletionIssues(draft);
  assert.deepEqual(draft, before);
});

test("valutazione completabile non produce errori UI", () => {
  assert.deepEqual(assessmentV2CompletionIssues(assessment()), []);
});

test("wizard espone errori accessibili, warning step e validazione prima del modal", async () => {
  const source = await readFile(new URL("../../components/clinical/assessment-v2-editor.tsx", import.meta.url), "utf8");
  assert.match(source, /aria-invalid=\{Boolean\(error\)\}/);
  assert.match(source, /aria-describedby=\{errorId\}/);
  assert.match(source, /contiene informazioni da controllare/);
  assert.match(source, /onClick=\{requestCompletion\}/);
  assert.match(source, /if \(validateForCompletion\(\)\) setCompleteOpen\(true\)/);
  assert.match(source, /scrollIntoView/);
});
