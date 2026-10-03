import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { proformaDraftValidationIssues, proformaIssuanceValidationIssues, proformaIssueTarget } from "./economic-document-validation-ui.ts";

const line = (overrides = {}) => ({ id: "line-a", patientId: "patient-a", documentId: "document-a", descriptionSnapshot: "Seduta", quantity: 1, unitAmountCents: 5000, lineTotalCents: 5000, position: 1, createdAt: "2026-10-03T10:00:00Z", updatedAt: "2026-10-03T10:00:00Z", ...overrides });
const recipient = { firstName: "Ada", lastName: "Rossi", address: "Via Roma 1", postalCode: "00100", city: "Roma", country: "Italia" };
const professional = { professionalName: "Dott. Bianchi", profession: "Logopedista", taxCode: "ABC", address: "Via Verdi 2", postalCode: "00100", city: "Roma", country: "Italia" };

test("associa descrizione quantità e importo alla riga stabile corretta", () => {
  const issues = proformaDraftValidationIssues("patient-a", true, [line({ id: "line-ok" }), line({ id: "line-b", descriptionSnapshot: "", quantity: 0, unitAmountCents: -1 })]);
  assert.deepEqual(issues.map((issue) => [issue.rowId, issue.field]), [["line-b", "description"], ["line-b", "quantity"], ["line-b", "amount"]]);
  assert.equal(proformaIssueTarget(issues[0]), "line-line-b-description");
});

test("distingue un errore singolo e più errori in sezioni diverse", () => {
  assert.equal(proformaDraftValidationIssues("patient-a", true, [line({ descriptionSnapshot: "" })]).length, 1);
  const issues = proformaIssuanceValidationIssues({ patientId: "patient-a", patientExists: true, lines: [line()], recipient: { ...recipient, city: "" }, professional: { ...professional, profession: "" }, totalCents: 5000 });
  assert.equal(issues.some((issue) => issue.section === "recipient" && issue.field === "city"), true);
  assert.equal(issues.some((issue) => issue.section === "professional" && issue.field === "profession"), true);
});

test("bozza valida non richiede dati fiscali completi mentre emissione sì", () => {
  assert.deepEqual(proformaDraftValidationIssues("patient-a", true, [line()]), []);
  assert.ok(proformaIssuanceValidationIssues({ patientId: "patient-a", patientExists: true, lines: [line()], recipient: {}, professional: {}, totalCents: 5000 }).length > 0);
  assert.deepEqual(proformaIssuanceValidationIssues({ patientId: "patient-a", patientExists: true, lines: [line()], recipient, professional, totalCents: 5000 }), []);
});

test("editor espone summary navigabile focus inline link Impostazioni e conserva il flusso issue", async () => {
  const source = await readFile(new URL("../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
  assert.match(source, /scrollIntoView/);
  assert.match(source, /aria-invalid=\{Boolean\(descriptionIssue\)\}/);
  assert.match(source, /data-proforma-field=\{`line-\$\{line\.id\}-quantity`\}/);
  assert.match(source, /href="\/impostazioni"/);
  assert.match(source, /if \(!validateForm\("issue"\)\) return; setError\(""\); setIssueFailed\(false\); setIssueOpen\(true\)/);
  assert.match(source, /issueRunner\.current\.run/);
  assert.match(source, /sticky bottom-0/);
});
