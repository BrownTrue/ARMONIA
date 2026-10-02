import test from "node:test";
import assert from "node:assert/strict";
import { getQabItalianForm } from "./content.ts";
import { applyQabResponse, canChangeQabForm, completeQabAdministration, pauseQabAdministration, qabTimerLabel, startQabAdministration } from "./runner.ts";

const empty = () => ({ kind: "qab-it", schemaVersion: 1, status: "not_started", responses: {} });
const completeFixture = (form) => {
  const started = startQabAdministration(empty(), form, "2026-10-03");
  const responses = {};
  for (const item of Object.values(getQabItalianForm(form).sections).flatMap((section) => section.items)) responses[item.id] = { status: "scored", score: item.allowedScores.at(-1) };
  return { ...started, responses };
};

test("i tre moduli partono da not_started e la scelta si blocca dopo l'inizio", () => {
  for (const form of [1, 2, 3]) { const started = startQabAdministration(empty(), form); assert.equal(started.form, form); assert.equal(started.status, "in_progress"); assert.equal(canChangeQabForm(started), false); }
});
test("la pausa mantiene in_progress e il timer non modifica il payload", () => { const value = startQabAdministration(empty(), 1); assert.equal(pauseQabAdministration(value), value); assert.deepEqual([qabTimerLabel(2), qabTimerLabel(3), qabTimerLabel(6)], ["Prima dei 3 secondi", "Oltre 3 secondi", "Oltre 6 secondi"]); assert.deepEqual(value.responses, {}); });
test("una stop rule richiede conferma ed è distinta da incomplete", () => { const value = startQabAdministration(empty(), 1); const item = getQabItalianForm(1).sections.awareness.items[0]; const outcome = applyQabResponse(value, item, { status: "scored", score: 0 }); assert.equal(outcome.status, "confirm_stop"); assert.notEqual(outcome.status, "incomplete"); });
test("score non consentiti sono rifiutati e le note non modificano il valore", () => { const value = startQabAdministration(empty(), 1); const item = getQabItalianForm(1).sections.wordComprehension.items[0]; assert.equal(applyQabResponse(value, item, { status: "scored", score: 2 }).status, "invalid"); const valid = applyQabResponse(value, item, { status: "scored", score: 4, responseNote: "Qualitativa" }); assert.equal(valid.value.responses[item.id].score, 4); });
test("completed richiede dati completi, missing non produce overall e il massimo è 10", () => { assert.equal(completeQabAdministration(startQabAdministration(empty(), 1)).ok, false); for (const form of [1, 2, 3]) { const outcome = completeQabAdministration(completeFixture(form)); assert.equal(outcome.ok, true); assert.equal(outcome.result.scores.overall, 10); } });
