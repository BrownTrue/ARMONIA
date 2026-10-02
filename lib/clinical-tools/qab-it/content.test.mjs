import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { QAB_ITALIAN_ADMINISTRATION_RULES, QAB_ITALIAN_ATTRIBUTION, QAB_ITALIAN_EDITORIAL_DISCREPANCIES, QAB_ITALIAN_FORMS, QAB_ITALIAN_STIMULUS_CARDS, getQabItalianForm } from "./content.ts";
import { validateQabCanonicalContent } from "./validation.ts";

test("il contenuto canonico comprende tre moduli, otto sezioni e conteggi stabili", () => {
  assert.deepEqual(validateQabCanonicalContent(), []);
  assert.equal(QAB_ITALIAN_FORMS.length, 3);
  for (const form of QAB_ITALIAN_FORMS) {
    assert.deepEqual(Object.fromEntries(Object.entries(form.sections).map(([code, section]) => [code, section.items.length])), {
      awareness: 8, spontaneousSpeech: 10, wordComprehension: 8, sentenceComprehension: 12, naming: 6, repetition: 6, reading: 6, motorSpeech: 2,
    });
  }
});

test("le diciotto carte hanno mapping completo e asset PNG fisicamente disponibili", () => {
  assert.equal(QAB_ITALIAN_STIMULUS_CARDS.length, 18);
  assert.equal(new Set(QAB_ITALIAN_STIMULUS_CARDS.map((card) => `${card.form}-${card.cardNumber}`)).size, 18);
  assert.ok(QAB_ITALIAN_STIMULUS_CARDS.every((card) => card.assetAvailable === true && card.assetPath.endsWith(`card-${card.cardNumber}.png`)));
  for (const card of QAB_ITALIAN_STIMULUS_CARDS) {
    const path = new URL(`../../../public${card.assetPath}`, import.meta.url);
    assert.equal(fs.existsSync(path), true, card.assetPath);
    const png = fs.readFileSync(path);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [3840, 2160], `pagina intera non coerente: ${card.assetPath}`);
    assert.equal(card.source, "ItalianQAB_StimulusCards.pdf");
  }
});

test("gli item dinamici sono strutturati e lo score 2 non è ammesso nella comprensione di parole", () => {
  for (const form of QAB_ITALIAN_FORMS) {
    assert.ok(form.sections.awareness.items.slice(2, 5).every((item) => item.dynamicFields?.length));
    assert.ok(form.sections.wordComprehension.items.every((item) => !item.allowedScores.includes(2)));
  }
  const clothingItems = getQabItalianForm(3).sections.sentenceComprehension.items.slice(0, 2);
  assert.ok(clothingItems.every((item) => item.dynamicFields?.some((field) => field.key === "examinerGarmentColor")));
  assert.equal(getQabItalianForm(1).sections.awareness.items[2].followUpPrompts.length, 3);
  assert.equal(QAB_ITALIAN_ADMINISTRATION_RULES.length, 5);
});

test("le stop rule ufficiali sono dichiarative", () => {
  for (const form of QAB_ITALIAN_FORMS) {
    const awareness = form.sections.awareness.items;
    assert.deepEqual(awareness[0].stopRule.scores, [0]);
    assert.deepEqual(awareness[1].stopRule.scores, [0, 1]);
    assert.deepEqual(awareness[7].stopRule.scores, [0, 1, 2]);
  }
});

test("il testo PDF canonico prevale sulle discrepanze Excel note", () => {
  const form1 = getQabItalianForm(1).sections.sentenceComprehension.items;
  const form3 = getQabItalianForm(3).sections.sentenceComprehension.items;
  assert.equal(form1[7].prompt, "Se dico che fumavo, pensi che io fumi adesso?");
  assert.equal(form3[3].prompt, "I bambini vengono sgridati dai genitori?");
  assert.doesNotMatch(JSON.stringify(QAB_ITALIAN_FORMS), /nominati|fumi fumi/);
  assert.ok(QAB_ITALIAN_EDITORIAL_DISCREPANCIES.length >= 7);
});

test("l'attribuzione non inventa una versione numerica della licenza", () => {
  assert.equal(QAB_ITALIAN_ATTRIBUTION.publisher, "AphasiaLab");
  assert.equal(QAB_ITALIAN_ATTRIBUTION.license, "Creative Commons Attribution License");
  assert.doesNotMatch(QAB_ITALIAN_ATTRIBUTION.license, /[0-9]\.0/);
});
