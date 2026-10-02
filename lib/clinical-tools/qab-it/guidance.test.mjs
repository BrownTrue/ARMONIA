import test from "node:test";
import assert from "node:assert/strict";
import { getQabItalianForm } from "./content.ts";
import { getQabCardForItem, getQabScoreLabel, getQabSectionGuide } from "./guidance.ts";

test("esistono guide per tutte le otto sezioni di ogni modulo", () => {
  for (const form of [1, 2, 3]) {
    for (const code of Object.keys(getQabItalianForm(form).sections)) {
      const guide = getQabSectionGuide(form, code);
      assert.ok(guide.do.length && guide.say.length && guide.show.length && guide.scoring.length && guide.notes.length);
    }
  }
});

test("comprensione parole usa carte e rubriche canoniche senza punteggio 2", () => {
  const section = getQabItalianForm(1).sections.wordComprehension;
  assert.deepEqual(section.items[0].allowedScores, [0, 1, 3, 4]);
  assert.equal(getQabCardForItem(1, "wordComprehension", 0)?.cardNumber, 2);
  assert.equal(getQabCardForItem(1, "wordComprehension", 4)?.cardNumber, 3);
  assert.equal(getQabScoreLabel("wordComprehension", section.items[0], 1), "Distrattore correlato");
});

test("le stop rule canoniche restano associate ai tre item awareness", () => {
  const items = getQabItalianForm(1).sections.awareness.items;
  assert.deepEqual(items.filter((item) => item.stopRule).map((item) => item.stopRule.scores), [[0], [0, 1], [0, 1, 2]]);
});
