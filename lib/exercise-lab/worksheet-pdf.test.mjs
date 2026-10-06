import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pdf } from "@react-pdf/renderer";
import { worksheetPdfDocument } from "./worksheet-pdf-document.ts";
import { assertWorksheetPdfImages, resolveWorksheetPdfImageSources, worksheetPdfFileName, worksheetPdfImagePaths } from "./worksheet-pdf.ts";
import { buildWorksheetPrintModel } from "./worksheet-print.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const printViewSource = readFileSync(`${root}components/worksheet-print-view.tsx`, "utf8");
const actionsSource = readFileSync(`${root}components/documents/generated-pdf-actions.tsx`, "utf8");
const patientResourcesSource = readFileSync(`${root}components/patient-resources-section.tsx`, "utf8");
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const exercises = {
  picture_naming: { kind: "picture_naming", title: "Denominazione immagini", instructions: "Nomina le immagini.", items: [{ wordId: "casa", imageAssetId: "a", imagePath: "/a.webp", altText: "Casa", text: "casa" }, { wordId: "cane", imageAssetId: "b", imagePath: "/b.webp", altText: "Cane", text: "cane" }] },
  minimal_pairs: { kind: "minimal_pairs", title: "Coppie minime", instructions: "Leggi le coppie.", items: [{ minimalPairId: "p", wordAId: "a", wordBId: "b", wordA: "pane", wordB: "cane", imagePathA: "/a.webp", imagePathB: "/b.webp", contrast: { kind: "phoneme", phonemeA: "p", phonemeB: "k", position: "initial" }, pairType: "minimal" }] },
  repetition: { kind: "repetition", title: "Ripetizione", instructions: "Ripeti.", items: [{ contentId: "w", contentKind: "word", text: "casa", phonemicTranscription: "/kasa/", syllabification: "ca-sa" }, { contentId: "n", contentKind: "nonword", text: "pame", phonemicTranscription: "/pame/", syllabification: "pa-me" }] },
  sentence_reading: { kind: "sentence_reading", title: "Lettura di frasi", instructions: "Leggi.", items: Array.from({ length: 16 }, (_, index) => ({ sentenceId: `s-${index}`, text: `La frase numero ${index + 1} resta associata alla sua attività.`, wordCount: 9 })) },
  reading_comprehension: { kind: "reading_comprehension", title: "Lettura e comprensione", instructions: "Leggi e rispondi.", items: [{ passageId: "r", passageTitle: "Il viaggio", text: "Un testo sufficientemente lungo per verificare la composizione della pagina. ".repeat(18), wordCount: 180, questions: [{ id: "q1", type: "literal", prompt: "Dove si svolge il racconto?", expectedAnswer: "Nel luogo indicato dal testo." }, { id: "q2", type: "inferential", prompt: "Che cosa possiamo dedurre?", expectedAnswer: "Una deduzione coerente." }] }] },
};

function worksheet(kinds = Object.keys(exercises)) {
  return { title: "Scheda completa", instructions: "Procedi con calma.", blocks: kinds.map((kind, index) => ({ id: `block-${index}`, exercise: structuredClone(exercises[kind]), initialExercise: structuredClone(exercises[kind]) })) };
}

test("filename PDF è deterministico e non contiene dati paziente", () => {
  assert.equal(worksheetPdfFileName("2026-10-06T10:00:00.000Z"), "scheda-attivita-2026-10-06.pdf");
  assert.throws(() => worksheetPdfFileName("oggi"), /worksheet_pdf_date_invalid/);
});

test("asset resolver deduplica immagini, mantiene ordine e non ignora file mancanti", async () => {
  const model = buildWorksheetPrintModel(worksheet(["picture_naming", "minimal_pairs"]), "patient");
  assert.deepEqual(worksheetPdfImagePaths(model), ["/a.webp", "/b.webp"]);
  const loaded = [];
  const sources = await resolveWorksheetPdfImageSources(model, async (path) => { loaded.push(path); return `${png}#${path}`; });
  assert.deepEqual(loaded, ["/a.webp", "/b.webp"]);
  assert.deepEqual(Object.keys(sources), ["/a.webp", "/b.webp"]);
  await assert.rejects(() => resolveWorksheetPdfImageSources(model, async () => ""), /worksheet_pdf_asset_missing/);
  assert.throws(() => assertWorksheetPdfImages(model, {}), /worksheet_pdf_assets_missing/);
});

test("renderer produce un PDF A4 reale multi-pagina con tutti i Mattoncini", async () => {
  const model = buildWorksheetPrintModel(worksheet(), "therapist");
  const document = worksheetPdfDocument(model, { "/a.webp": png, "/b.webp": png });
  const blob = await pdf(document).toBlob();
  assert.equal(blob.type, "application/pdf");
  const buffer = Buffer.from(await blob.arrayBuffer());
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.ok(buffer.length > 4_000);
  assert.ok((buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length >= 2);
});

test("UI riusa GeneratedPdfActions, invalida per revisione e conserva window.print desktop", () => {
  assert.match(printViewSource, /GeneratedPdfActions/);
  assert.match(printViewSource, /JSON\.stringify\(\{ variant, worksheet \}\)/);
  assert.match(printViewSource, /resolveWorksheetPdfImageSources/);
  assert.match(printViewSource, /window\.print\(\)/);
  assert.match(actionsSource, /busy \? "Creazione PDF…" : "Crea PDF"/);
  assert.match(actionsSource, /PDF pronto/);
  assert.match(actionsSource, /Non è stato possibile creare il PDF\. Riprova\./);
  assert.match(actionsSource, /setSource\(undefined\)/);
  assert.match(actionsSource, /generatedRevision\.current === revisionKey/);
  assert.match(actionsSource, /DocumentActions/);
  assert.match(patientResourcesSource, /worksheet=.*view=print/);
  assert.match(patientResourcesSource, /PDF \/ Stampa/);
});
