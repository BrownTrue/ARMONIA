import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentPrintVisibility,
  formatClinicalValue,
  hasPrintableClinicalValue,
  printableLines,
  printableList,
  readableClinicalLabel,
} from "./print-format.ts";

test("converte codici clinici in etichette leggibili", () => {
  assert.equal(readableClinicalLabel("comprehension_difficulty"), "Difficoltà di comprensione");
  assert.equal(readableClinicalLabel("nuovo_valore"), "Nuovo valore");
});

test("normalizza testo multilinea e liste senza righe vuote", () => {
  assert.deepEqual(printableLines(" Prima riga \n\n Seconda riga\r\n"), ["Prima riga", "Seconda riga"]);
  assert.deepEqual(printableList(["Italiano\nInglese", "  LIS  "]), ["Italiano", "Inglese", "LIS"]);
});

test("formatta selezioni multiple, note e disponibilità", () => {
  assert.equal(formatClinicalValue({ value: ["single_word", "simple_sentence"] }), "Parola singola, Frase semplice");
  assert.equal(formatClinicalValue({ value: "adequate", note: "Dato sintetico" }), "Adeguata — Dato sintetico");
  assert.equal(formatClinicalValue({ availability: "not_available" }, "Non valutata"), "Non valutata");
  assert.equal(hasPrintableClinicalValue({ availability: "available" }), false);
  assert.equal(hasPrintableClinicalValue({ availability: "not_applicable" }), true);
});

test("omette le sezioni vuote e rileva una valutazione con pochi dati", () => {
  assert.deepEqual(assessmentPrintVisibility({}), { access: false, anamnesis: false, observation: false, tests: false, summary: false, goals: false });
  assert.deepEqual(assessmentPrintVisibility({ accessReason: { description: "Dato sintetico" } }), { access: true, anamnesis: false, observation: false, tests: false, summary: false, goals: false });
});

test("rileva sezioni ricche e test multipli ignorando test vuoti", () => {
  const result = assessmentPrintVisibility({ anamnesis: { languages: ["Italiano", "Inglese"] }, observation: { production: { value: ["single_word", "simple_sentence"] } }, tests: { items: [{ id: "empty" }, { id: "one", name: "Test sintetico" }, { id: "two", percentile: 45 }] }, summary: { strengths: ["Punto uno", "Punto due"] }, goals: { planningNotes: "Proseguire il percorso" } });
  assert.deepEqual(result, { access: false, anamnesis: true, observation: true, tests: true, summary: true, goals: true });
});
