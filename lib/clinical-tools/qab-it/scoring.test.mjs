import test from "node:test";
import assert from "node:assert/strict";
import { QAB_ITALIAN_FORMS, getQabItalianForm } from "./content.ts";
import { QAB_FORMULA_VERSION, scoreQabItalian } from "./scoring.ts";
import { isQabAdministrationV1 } from "./validation.ts";

function fixture(form, score = 4) {
  const definition = getQabItalianForm(form);
  const responses = {};
  for (const item of Object.values(definition.sections).flatMap((section) => section.items)) {
    const selected = item.allowedScores.includes(score) ? score : item.allowedScores.at(-1);
    responses[item.id] = { status: "scored", score: selected };
  }
  return { kind: "qab-it", schemaVersion: 1, form, status: "completed", responses };
}

test("tutti gli score massimi producono domini e overall pari a 10 in ogni modulo", () => {
  for (const form of [1, 2, 3]) {
    const result = scoreQabItalian(fixture(form));
    assert.equal(result.status, "available");
    assert.deepEqual(result.scores, { wordComprehension: 10, sentenceComprehension: 10, lexicalRetrieval: 10, grammar: 10, motorProgramming: 10, repetition: 10, reading: 10, overall: 10, formulaVersion: QAB_FORMULA_VERSION });
  }
});

test("i domini e i pesi overall replicano le formule ufficiali", () => {
  const input = fixture(1);
  for (const id of [..."abcdefgh"].map((letter) => `qab1-word-comprehension-${letter}`)) input.responses[id] = { status: "scored", score: 1 };
  const result = scoreQabItalian(input);
  assert.equal(result.status, "available");
  assert.equal(result.scores.wordComprehension, 0);
  assert.ok(Math.abs(result.scores.overall - 8.2) < 1e-12);
});

test("missing, notAdministered e notScorable non vengono convertiti in zero", () => {
  for (const status of [undefined, "notAdministered", "notScorable"]) {
    const input = fixture(2);
    if (status) input.responses["qab2-naming-a"] = { status }; else delete input.responses["qab2-naming-a"];
    const result = scoreQabItalian(input);
    assert.equal(result.status, "incomplete");
    assert.ok(result.missingItemIds.includes("qab2-naming-a"));
  }
});

test("una stop rule interrompe il calcolo e non produce overall", () => {
  const input = fixture(3);
  input.responses["qab3-awareness-h"] = { status: "scored", score: 2 };
  const result = scoreQabItalian(input);
  assert.deepEqual(result, { status: "stopped", stopItemId: "qab3-awareness-h" });
  assert.equal("scores" in result, false);
});

test("score 2 è rifiutato nella comprensione di parole", () => {
  const input = fixture(1);
  input.responses["qab1-word-comprehension-a"] = { status: "scored", score: 2 };
  assert.equal(isQabAdministrationV1(input), false);
  assert.deepEqual(scoreQabItalian(input), { status: "invalid", invalidItemIds: ["qab1-word-comprehension-a"] });
});

test("il payload raw non può contenere risultati derivati persistiti", () => {
  const input = { ...fixture(1), results: { overall: 10 } };
  assert.equal(isQabAdministrationV1(input), false);
});

test("le formule sono identiche nei tre moduli", () => {
  const results = QAB_ITALIAN_FORMS.map(({ form }) => scoreQabItalian(fixture(form)));
  assert.ok(results.every((result) => result.status === "available"));
  assert.deepEqual(results[0].scores, results[1].scores);
  assert.deepEqual(results[1].scores, results[2].scores);
});

test("lo scoring non muta il raw input e non arrotonda i risultati", () => {
  const input = fixture(1);
  input.responses["qab1-naming-a"] = { status: "scored", score: 3, responseNote: "Nota facoltativa" };
  const before = structuredClone(input);
  const result = scoreQabItalian(input);
  assert.deepEqual(input, before);
  assert.equal(result.status, "available");
  assert.equal(result.scores.lexicalRetrieval, 9.75);
  assert.equal(result.scores.formulaVersion, "official-italian-2026-v1");
});
