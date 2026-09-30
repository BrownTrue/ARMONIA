import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EconomicDocumentRequestError,
  createEconomicDocumentIssueRunner,
  economicDocumentDownloadErrorMessage,
  economicDocumentDownloadUrl,
  economicDocumentIssueErrorMessage,
  issueEconomicDocument,
  voidEconomicDocument,
} from "./client.ts";

const document = { id:"document-1", patientId:"patient-1", documentType:"proforma", status:"issued", sequenceNumber:7, numberYear:2026, documentNumber:"PF-2026-0007", issueDate:"2026-09-30", professionalSnapshot:{}, recipientSnapshot:{}, subtotalCents:4500, totalCents:4500, currencyCode:"EUR", notes:"", logoIncluded:false, renderTemplateVersion:1, issuedAt:"2026-09-30T10:00:00.000Z", createdAt:"2026-09-30T09:00:00.000Z", updatedAt:"2026-09-30T10:00:00.000Z" };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:{ "content-type":"application/json" } });

test("emissione usa il numero definitivo restituito dal server", async () => {
  let call;
  const issued = await issueEconomicDocument("document-1", async (...args) => { call = args; return response({ document }); });
  assert.deepEqual(call, ["/api/economic-documents/document-1/issue", { method:"POST" }]);
  assert.equal(issued.documentNumber, "PF-2026-0007");
});

test("errori emissione restano comprensibili e non espongono dettagli server", async () => {
  await assert.rejects(() => issueEconomicDocument("document-1", async () => response({ error:"session_already_documented", details:"secret" }, 409)), (cause) => {
    assert.equal(economicDocumentIssueErrorMessage(cause), "Una o più prestazioni sono già incluse in un altro proforma emesso. Rivedi le prestazioni selezionate.");
    assert.doesNotMatch(cause.message, /secret/);
    return true;
  });
  assert.match(economicDocumentIssueErrorMessage(new EconomicDocumentRequestError("logo_missing", 409)), /logo/);
});

test("download usa esclusivamente la route server e il suo signed URL", async () => {
  let call;
  const url = await economicDocumentDownloadUrl("document-1", async (...args) => { call = args; return response({ url:"https://storage.example.test/signed" }); });
  assert.deepEqual(call, ["/api/economic-documents/document-1/download", { method:"GET" }]);
  assert.equal(url, "https://storage.example.test/signed");
  assert.match(economicDocumentDownloadErrorMessage(new EconomicDocumentRequestError("economic_document_pdf_unavailable", 404)), /non è disponibile/);
});

test("annullamento invia soltanto il motivo alla route dedicata", async () => {
  let options;
  const voided = { ...document, status:"voided", voidedAt:"2026-09-30T11:00:00.000Z", voidReason:"Errore destinatario" };
  const result = await voidEconomicDocument("document-1", "Errore destinatario", async (_url, init) => { options = init; return response({ document:voided }); });
  assert.equal(result.status, "voided");
  assert.deepEqual(JSON.parse(options.body), { reason:"Errore destinatario" });
  assert.equal(options.method, "POST");
});

test("one-step salva una sola draft e usa il suo id per emissione e retry", async () => {
  const runner = createEconomicDocumentIssueRunner();
  const calls = [];
  const persist = async () => { calls.push("save:draft-real-id"); return { id:"draft-real-id" }; };
  const firstIssue = async (id) => { calls.push(`issue:${id}`); throw new EconomicDocumentRequestError("upload_failed", 500, true); };
  await assert.rejects(() => runner.run({ persist, issue:firstIssue }), /upload_failed/);
  const result = await runner.run({ persist, issue:async (id) => { calls.push(`issue:${id}`); return document; } });
  assert.equal(result.documentNumber, "PF-2026-0007");
  assert.deepEqual(calls, ["save:draft-real-id", "issue:draft-real-id", "issue:draft-real-id"]);
  assert.deepEqual(runner.state(), { persistedDocumentId:"draft-real-id", issueStarted:true });
});

test("draft esistente salva le modifiche prima della prima emissione", async () => {
  const runner = createEconomicDocumentIssueRunner();
  const calls = [];
  await runner.run({ persist:async () => { calls.push("save:modified-draft"); return { id:"document-1" }; }, issue:async (id) => { calls.push(`issue:${id}`); return document; } });
  assert.deepEqual(calls, ["save:modified-draft", "issue:document-1"]);
});

test("click emissione apre la conferma senza id, salvataggio o rete", () => {
  const panel = readFileSync(new URL("../../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
  const handler = panel.match(/const requestIssueConfirmation = \(\) => \{([^}]+)\};/)?.[1] || "";
  assert.match(handler, /setIssueOpen\(true\)/);
  assert.match(handler, /setIssueFailed\(false\)/);
  assert.doesNotMatch(handler, /document|draftId|prepareDraft|onSave|onIssue|return/);
  assert.match(panel, /onClick=\{requestIssueConfirmation\}>Emetti proforma<\/button>/);
  assert.match(panel, /\{issueOpen && <Modal title="Emettere questo proforma\?"/);
  assert.match(panel, /onClick=\{\(\) => setIssueOpen\(false\)\}>Annulla<\/button>/);
});

test("la conferma valida e salva prima dell'issue senza return silenziosi", () => {
  const panel = readFileSync(new URL("../../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
  const start = panel.indexOf("const confirmIssue = async () =>");
  const end = panel.indexOf("return <Modal", start);
  const handler = panel.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(handler, /prepareDraft\(\)/);
  assert.match(handler, /throw new Error\(`Completa i dati del destinatario/);
  assert.match(handler, /throw new Error\(`Completa i dati professionali/);
  assert.match(handler, /issueRunner\.current\.run\(\{ persist:/);
  assert.match(handler, /await onSave\(next, normalizedLines, persistedLineIds\)/);
  assert.match(handler, /issue:onIssue/);
  assert.match(handler, /setIssueFailed\(true\)/);
  assert.match(handler, /setError\(/);
  assert.match(handler, /if \(issueFlight\.current\) return/);
});

test("UI E3C non muta pagamenti e richiede motivo per il void", () => {
  const panel = readFileSync(new URL("../../components/economy/economic-documents-panel.tsx", import.meta.url), "utf8");
  assert.match(panel, /if \(!reason\)/);
  assert.match(panel, /disabled=\{voiding \|\| !voidReason\.trim\(\)\}/);
  assert.match(panel, /setEditor\(issued\)/);
  assert.match(panel, /createEconomicDocumentIssueRunner/);
  assert.doesNotMatch(panel, /savePayment|savePaymentAllocation|deletePayment/);
});
