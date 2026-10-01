import test from "node:test";
import assert from "node:assert/strict";
import { getContentById } from "../content-bank/catalog.ts";
import { buildImageNamingPreview, buildMinimalPairsPreview, buildReadingComprehensionPreview, buildRepetitionPreview, buildSentenceReadingPreview } from "./bricks.ts";
import { createExerciseDraft, editExerciseDraft, moveExerciseDraftItem, removeExerciseDraftItem, resetExerciseDraft } from "./exercise-draft.ts";

const previews = [
  ["picture_naming", buildImageNamingPreview({ itemCount: 5 })],
  ["minimal_pairs", buildMinimalPairsPreview({ itemCount: 5 })],
  ["repetition", buildRepetitionPreview({ itemCount: 5, contentKind: "both" })],
  ["reading_comprehension", buildReadingComprehensionPreview({ passageId: "passage_001" })],
  ["sentence_reading", buildSentenceReadingPreview({ itemCount: 5 })],
];

test("i cinque Mattoncini creano draft tipizzati con riferimenti reali", () => {
  for (const [kind, preview] of previews) {
    const draft = createExerciseDraft(preview);
    assert.equal(draft?.kind, kind);
    assert.ok(draft?.title && draft.instructions && draft.items.length);
    for (const item of draft.items) {
      const id = item.wordId || item.minimalPairId || item.contentId || item.passageId || item.sentenceId;
      assert.ok(getContentById(id), `${kind}:${id}`);
    }
  }
});

test("conversione Mattoncino draft è deterministica e conserva ordine e contenuti", () => {
  for (const [, preview] of previews) assert.deepEqual(createExerciseDraft(preview), createExerciseDraft(preview));
  const preview = buildSentenceReadingPreview({ itemCount: 10, audience: "primary_school" });
  const draft = createExerciseDraft(preview);
  assert.deepEqual(draft?.items.map((item) => item.sentenceId), preview.items.map((item) => item.sentenceId));
  assert.deepEqual(draft?.items.map((item) => item.text), preview.items.map((item) => item.text));
});

test("titolo e istruzione cambiano soltanto sul draft", () => {
  const initial = createExerciseDraft(buildRepetitionPreview({ itemCount: 5, contentKind: "word" }));
  const edited = editExerciseDraft(initial, { title: "Parole scelte", instructions: "Leggi con calma." });
  assert.equal(edited.title, "Parole scelte");
  assert.equal(edited.instructions, "Leggi con calma.");
  assert.notEqual(initial.title, edited.title);
});

test("rimozione e riordino non modificano preview o catalogo", () => {
  const preview = buildSentenceReadingPreview({ itemCount: 5 });
  const sourceBefore = structuredClone(getContentById(preview.items[0].sentenceId));
  const initial = createExerciseDraft(preview);
  const moved = moveExerciseDraftItem(initial, 0, 1);
  const removed = removeExerciseDraftItem(moved, 0);
  assert.equal(moved.items[1].sentenceId, initial.items[0].sentenceId);
  assert.equal(removed.items.length, initial.items.length - 1);
  assert.equal(preview.items.length, 5);
  assert.deepEqual(getContentById(preview.items[0].sentenceId), sourceBefore);
});

test("reset ripristina integralmente il draft iniziale senza condividere gli array", () => {
  const initial = createExerciseDraft(buildReadingComprehensionPreview({ passageId: "passage_001" }));
  const changed = editExerciseDraft(removeExerciseDraftItem(initial, 0), { title: "Titolo modificato", instructions: "Nuova istruzione" });
  const reset = resetExerciseDraft(initial);
  assert.notDeepEqual(changed, initial);
  assert.deepEqual(reset, initial);
  assert.notEqual(reset.items, initial.items);
  assert.notEqual(reset.items[0].questions, initial.items[0].questions);
});

test("draft vuoto non viene creato e nessun item è inventato", () => {
  assert.equal(createExerciseDraft(buildImageNamingPreview({ itemCount: 1, phoneme: "z" })), undefined);
});
