import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canShareDocument,
  documentFile,
  prepareDocumentUrl,
  shareDocument,
} from "./browser-actions.ts";

const pdfBlob = new Blob(["%PDF-test"], { type: "application/pdf" });
const blobSource = { kind: "blob", blob: pdfBlob };

test("crea un File PDF con nome e MIME preservati", async () => {
  const file = documentFile(blobSource, "Attestazione.pdf");
  assert.equal(file.name, "Attestazione.pdf");
  assert.equal(file.type, "application/pdf");
  assert.equal(await file.text(), "%PDF-test");
});

test("file share è disponibile soltanto con share e canShare positivi", () => {
  assert.equal(canShareDocument(blobSource, "Attestazione.pdf", {}), false);
  assert.equal(canShareDocument(blobSource, "Attestazione.pdf", { share: async () => undefined }), false);
  assert.equal(canShareDocument(blobSource, "Attestazione.pdf", { share: async () => undefined, canShare: () => false }), false);
  assert.equal(canShareDocument(blobSource, "Attestazione.pdf", { share: async () => undefined, canShare: (data) => data?.files?.[0]?.name === "Attestazione.pdf" }), true);
});

test("condivide Blob come File e URL server/statici come URL", async () => {
  const calls = [];
  const shareNavigator = { canShare: () => true, share: async (data) => calls.push(data) };
  assert.equal(await shareDocument(blobSource, "Attestazione.pdf", "Attestazione", shareNavigator), "shared");
  assert.equal(calls[0].files[0].name, "Attestazione.pdf");
  assert.equal(await shareDocument({ kind: "url", url: "/api/document.pdf" }, "Documento.pdf", "Documento", shareNavigator), "shared");
  assert.equal(calls[1].url, "/api/document.pdf");
});

test("annullare la share sheet non è un errore, un errore reale resta distinguibile", async () => {
  const cancelled = { canShare: () => true, share: async () => { throw new DOMException("cancel", "AbortError"); } };
  assert.equal(await shareDocument(blobSource, "Attestazione.pdf", "Attestazione", cancelled), "cancelled");
  const failed = { canShare: () => true, share: async () => { throw new Error("failure"); } };
  await assert.rejects(() => shareDocument(blobSource, "Attestazione.pdf", "Attestazione", failed), /failure/);
});

test("un Blob URL viene revocato una sola volta; un URL esistente non richiede cleanup", () => {
  const revoked = [];
  const prepared = prepareDocumentUrl(blobSource, { createObjectURL: () => "blob:document", revokeObjectURL: (url) => revoked.push(url) });
  assert.equal(prepared.url, "blob:document");
  prepared.release();
  prepared.release();
  assert.deepEqual(revoked, ["blob:document"]);
  const routed = prepareDocumentUrl({ kind: "url", url: "/document.pdf" }, { createObjectURL: () => { throw new Error("not expected"); }, revokeObjectURL: () => { throw new Error("not expected"); } });
  assert.equal(routed.url, "/document.pdf");
  routed.release();
});

test("la surface pilota espone preview primaria, fallback e nessun upload esterno", () => {
  const ui = readFileSync(new URL("../../components/documents/generated-pdf-actions.tsx", import.meta.url), "utf8");
  assert.match(ui, />Apri PDF</);
  assert.match(ui, />Condividi</);
  assert.match(ui, />Scarica</);
  assert.match(ui, />Stampa</);
  assert.match(ui, /La condivisione diretta del file non è disponibile/);
  assert.match(ui, /Non è stato possibile creare il PDF/);
  assert.match(ui, /window\.setTimeout\(prepared\.release, releaseDelay\)/);
  assert.doesNotMatch(ui, /fetch\(|XMLHttpRequest|storage\.from|supabase|https?:\/\//);
});

