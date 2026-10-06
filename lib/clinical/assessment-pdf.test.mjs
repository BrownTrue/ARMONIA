import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pdf } from "@react-pdf/renderer";
import { assessmentPdfFileName } from "./assessment-pdf.ts";
import { assessmentPdfDocument } from "./assessment-pdf-document.ts";
import { buildAssessmentPrintModel } from "./assessment-print-model.ts";
import { clinicalModuleRegistry } from "./module-registry.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const v1Editor = readFileSync(`${root}components/clinical/assessment-wizard.tsx`, "utf8");
const v2Editor = readFileSync(`${root}components/clinical/assessment-v2-editor.tsx`, "utf8");
const actions = readFileSync(`${root}components/clinical/assessment-pdf-actions.tsx`, "utf8");
const pdfSource = readFileSync(`${root}lib/clinical/assessment-pdf-document.ts`, "utf8");
const htmlV1 = readFileSync(`${root}components/clinical/assessment-summary.tsx`, "utf8");
const htmlV2 = readFileSync(`${root}components/clinical/assessment-summary-v2.tsx`, "utf8");
const stamp = "2026-10-06T10:00:00.000Z";

function v1(data = {}) {
  return { id: "a1", patientId: "p1", clinicalPathwayId: "cp1", moduleType: "language_communication", status: "completed", schemaVersion: 1, clinicalDate: "2026-10-05", data, createdAt: stamp, updatedAt: stamp };
}

function v2(data = {}) {
  return { id: "a2", patientId: "p1", clinicalPathwayId: "cp1", assessmentType: "reassessment", status: "completed", schemaVersion: 2, clinicalDate: "2026-10-05", data: { modules: [], ...data }, createdAt: stamp, updatedAt: stamp };
}

const base = { patientName: "Mario Rossi", pathwayTitle: "Percorso clinico", professional: { firstName: "Giulia", lastName: "Bianchi", profession: "Logopedista", studio: "Studio Armonia" }, generatedAt: stamp };

test("filename PDF è deterministico e non espone dati clinici o del paziente", () => {
  assert.equal(assessmentPdfFileName(stamp), "valutazione-clinica-2026-10-06.pdf");
  assert.doesNotMatch(assessmentPdfFileName(stamp), /mario|rossi|p1|a1/i);
  assert.throws(() => assessmentPdfFileName("oggi"), /assessment_pdf_date_invalid/);
});

test("filename PDF usa la data civile locale e non il giorno UTC", () => {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "Europe/Rome";
  try {
    assert.equal(assessmentPdfFileName("2026-10-05T22:30:00.000Z"), "valutazione-clinica-2026-10-06.pdf");
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});

test("modello V1 conserva disponibilità, opzionali, ordine e omette il vuoto", () => {
  const model = buildAssessmentPrintModel({ ...base, assessment: v1({
    accessReason: { description: "Richiesta di approfondimento." },
    anamnesis: { pregnancyBirth: { availability: "not_available" }, firstWordsMonths: { availability: "not_applicable" }, languages: ["Italiano"] },
    observation: { communication: { value: "adequate" }, production: { availability: "not_available" }, notes: "Osservazione presente." },
    tests: { notAdministered: true },
    summary: { clinicalSummary: "Sintesi clinica.", strengths: ["Punto di forza"] },
  }) });
  assert.deepEqual(model.sections.map(({ code }) => code), ["access", "anamnesis", "observation", "tests", "summary"]);
  assert.equal(model.sections.some(({ code }) => code === "planning"), false);
  const values = model.sections.flatMap((section) => section.fields).map((field) => field.value).flat();
  assert.ok(values.includes("Non disponibile"));
  assert.ok(values.includes("Non applicabile"));
  assert.ok(values.includes("Non valutata"));
  assert.ok(values.includes("Test non somministrati"));
});

test("modello V1 draft usa lo stato corrente senza inventare valori per sezioni vuote", () => {
  const assessment = { ...v1({ accessReason: { notes: "Nota ancora in bozza." }, observation: {} }), status: "draft" };
  const model = buildAssessmentPrintModel({ ...base, assessment });
  assert.deepEqual(model.sections.map(({ code }) => code), ["access"]);
  assert.equal(model.sections[0].fields[0].value, "Nota ancora in bozza.");
  assert.equal(JSON.stringify(model).includes("Nessuna difficoltà"), false);
});

test("modello V2 usa il registry, conserva ordine/versione dei moduli e gli obiettivi", () => {
  const model = buildAssessmentPrintModel({ ...base, assessment: v2({
    accessReason: { reason: "Rivalutazione programmata." },
    modules: [
      { code: "voice", version: 1, data: { profile: { status: "further_assessment", contextsExplored: ["conversation"], notes: "Nota vocale." } } },
      { code: "speech_sound", version: 1, data: { profile: { status: "difficulties_observed", observedFeatures: ["distortions"] } } },
    ],
    summary: { clinicalSummary: "Sintesi modulare." },
  }), goals: [{ id: "g1", patientId: "p1", clinicalPathwayId: "cp1", title: "Obiettivo condiviso", progress: 40, status: "active", createdAt: stamp, updatedAt: stamp }] });
  const modules = model.sections.find(({ code }) => code === "clinical_areas")?.groups || [];
  assert.deepEqual(modules.map(({ code }) => code), ["voice@1", "speech_sound@1"]);
  assert.deepEqual(modules.map(({ title }) => title), ["Voce", "Fonetica, fonologia e articolazione"]);
  const planning = model.sections.find(({ code }) => code === "planning");
  assert.deepEqual(planning?.fields.find(({ label }) => label === "Obiettivi del percorso")?.value, ["Obiettivo condiviso · 40%"]);
  assert.ok(clinicalModuleRegistry.every((definition) => typeof definition.toPrintSections === "function"));
});

test("PDF A4 reale conserva testo lungo e produce più pagine", async () => {
  const model = buildAssessmentPrintModel({ ...base, assessment: v1({
    accessReason: { description: "Motivo documentato." },
    summary: { clinicalSummary: "Testo clinico esteso senza perdita di contenuto. ".repeat(260), conclusions: "Conclusione finale." },
  }) });
  const blob = await pdf(assessmentPdfDocument(model)).toBlob();
  assert.equal(blob.type, "application/pdf");
  const buffer = Buffer.from(await blob.arrayBuffer());
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.ok(buffer.length > 5_000);
  assert.ok((buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length >= 2);
  assert.match(pdfSource, /size: "A4"/);
  assert.match(pdfSource, /minPresenceAhead/);
  assert.match(pdfSource, /Generato con Armonia/);
});

test("renderer PDF resta generico e la stampa HTML condivide lo stesso modello", () => {
  for (const definition of clinicalModuleRegistry) assert.doesNotMatch(pdfSource, new RegExp(`(?:^|[^a-z_])${definition.code}(?:[^a-z_]|$)`));
  assert.match(htmlV1, /buildAssessmentPrintModel/);
  assert.match(htmlV2, /buildAssessmentPrintModel/);
  assert.match(htmlV1, /AssessmentPrintDocument/);
  assert.match(htmlV2, /AssessmentPrintDocument/);
});

test("azioni PDF usano lo stato corrente, invalidano la revisione e restano solo in sola lettura", () => {
  assert.match(actions, /GeneratedPdfActions/);
  assert.match(actions, /revisionKey/);
  assert.match(actions, /props\.assessment/);
  assert.match(actions, /patientName: props\.patientName/);
  assert.match(actions, /props\.pathwayTitle, props\.patientName, props\.professional/);
  assert.match(actions, /resolveAssessmentPdfLogo/);
  for (const editor of [v1Editor, v2Editor]) {
    assert.match(editor, /AssessmentPdfActions/);
    assert.match(editor, /readOnly && <AssessmentPdfActions/);
    assert.match(editor, /assessment=\{draft\}/);
    assert.match(editor, /window\.print\(\)/);
  }
});
