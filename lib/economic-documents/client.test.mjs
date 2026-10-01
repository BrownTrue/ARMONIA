import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  EconomicDocumentRequestError,
  createEconomicDocumentIssueRunner,
  economicDocumentDraftIsDirty,
  economicDocumentDownloadErrorMessage,
  economicDocumentDownloadUrl,
  economicDocumentIssueErrorMessage,
  issueEconomicDocument,
  voidEconomicDocument,
} from "./client.ts";

const document = { id:"document-1", patientId:"patient-1", documentType:"proforma", status:"issued", sequenceNumber:7, numberYear:2026, documentNumber:"PF-2026-0007", issueDate:"2026-09-30", professionalSnapshot:{}, recipientSnapshot:{}, subtotalCents:4500, totalCents:4500, currencyCode:"EUR", notes:"", logoIncluded:false, renderTemplateVersion:1, issuedAt:"2026-09-30T10:00:00.000Z", createdAt:"2026-09-30T09:00:00.000Z", updatedAt:"2026-09-30T10:00:00.000Z" };
const draft = { ...document, status:"draft", sequenceNumber:undefined, numberYear:undefined, documentNumber:undefined, issueDate:undefined, issuedAt:undefined };
const line = { id:"line-1", patientId:"patient-1", documentId:"document-1", sessionId:"session-1", serviceId:"service-1", serviceNameSnapshot:"Seduta", serviceDateSnapshot:"2026-09-29", descriptionSnapshot:"Seduta", quantity:1, unitAmountCents:4500, lineTotalCents:4500, position:1, createdAt:"2026-09-30T09:00:00.000Z", updatedAt:"2026-09-30T09:00:00.000Z" };
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

test("nuovo documento salva una sola draft e usa il suo id per emissione e retry", async () => {
  const runner = createEconomicDocumentIssueRunner();
  const calls = [];
  const persist = async () => { calls.push("save:draft-real-id"); return { id:"draft-real-id" }; };
  const firstIssue = async (id) => { calls.push(`issue:${id}`); throw new EconomicDocumentRequestError("upload_failed", 500, true); };
  await assert.rejects(() => runner.run({ shouldPersist:true, persist, issue:firstIssue }), /upload_failed/);
  const result = await runner.run({ shouldPersist:true, persist, issue:async (id) => { calls.push(`issue:${id}`); return document; } });
  assert.equal(result.documentNumber, "PF-2026-0007");
  assert.deepEqual(calls, ["save:draft-real-id", "issue:draft-real-id", "issue:draft-real-id"]);
  assert.deepEqual(runner.state(), { persistedDocumentId:"draft-real-id", issueStarted:true });
});

test("draft esistente invariata e reopen retry chiamano issue senza persist", async () => {
  for (let pass=0;pass<2;pass+=1) {
    const runner = createEconomicDocumentIssueRunner();
    const calls = [];
    await runner.run({ documentId:"document-1", shouldPersist:false, persist:async()=>{calls.push("save");return draft;}, issue:async(id)=>{calls.push(`issue:${id}`);return document;} });
    assert.deepEqual(calls,["issue:document-1"]);
  }
});

test("draft esistente modificata salva le modifiche prima della prima emissione", async () => {
  const runner = createEconomicDocumentIssueRunner();
  const calls = [];
  await runner.run({ documentId:"document-1", shouldPersist:true, persist:async () => { calls.push("save:modified-draft"); return { id:"document-1" }; }, issue:async (id) => { calls.push(`issue:${id}`); return document; } });
  assert.deepEqual(calls, ["save:modified-draft", "issue:document-1"]);
});

test("errore persist di una draft modificata non viene ignorato", async () => {
  const runner=createEconomicDocumentIssueRunner();
  let issued=false;
  await assert.rejects(()=>runner.run({documentId:"document-1",shouldPersist:true,persist:async()=>{throw new Error("save_failed")},issue:async()=>{issued=true;return document;}}),/save_failed/);
  assert.equal(issued,false);
});

test("dirty detection ignora timestamp e ordine chiavi ma rileva modifiche utente",()=>{
  const reloaded={...draft,professionalSnapshot:{profession:"Logopedista",professionalName:"Anna"},updatedAt:"2026-10-01T10:00:00.000Z"};
  const current={...reloaded,professionalSnapshot:{professionalName:"Anna",profession:"Logopedista"},updatedAt:"2026-10-01T11:00:00.000Z"};
  assert.equal(economicDocumentDraftIsDirty(reloaded,[line],{...current,totalCents:9999,subtotalCents:9999},[{...line,position:7,lineTotalCents:9999,updatedAt:"2026-10-01T11:00:00.000Z"}]),false);
  assert.equal(economicDocumentDraftIsDirty(reloaded,[line],{...current,notes:"Modifica"},[line]),true);
  assert.equal(economicDocumentDraftIsDirty(reloaded,[line],current,[{...line,descriptionSnapshot:"Seduta modificata"}]),true);
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
  assert.match(handler, /economicDocumentDraftIsDirty\(document, originalLines, prepared\.next, prepared\.normalizedLines\)/);
  assert.match(handler, /issueRunner\.current\.run\(\{ documentId: document\?\.id, shouldPersist,/);
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
