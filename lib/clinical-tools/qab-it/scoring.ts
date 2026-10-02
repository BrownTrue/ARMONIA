import { getQabItalianForm } from "./content.ts";
import type { QabAdministrationV1, QabForm, QabItemResponse, QabScoredItem, QabScores, QabScoringResult } from "./types.ts";

export const QAB_FORMULA_VERSION = "official-italian-2026-v1" as const;

const responseScore = (responses: Readonly<Record<string, QabItemResponse>>, item: QabScoredItem) => {
  const response = responses[item.id];
  if (!response || response.status !== "scored") return undefined;
  return item.allowedScores.includes(response.score) ? response.score : Number.NaN;
};

const ids = (form: QabForm, section: string, letters: string) => [...letters].map((letter) => `qab${form}-${section}-${letter}`);

export function scoreQabItalian(administration: QabAdministrationV1): QabScoringResult {
  if (!administration.form) return { status: "incomplete" };
  const definition = getQabItalianForm(administration.form);
  const allItems = Object.values(definition.sections).flatMap((section) => section.items);
  const invalidItemIds = allItems.filter((item) => Number.isNaN(responseScore(administration.responses, item))).map((item) => item.id);
  if (invalidItemIds.length) return { status: "invalid", invalidItemIds };

  for (const item of definition.sections.awareness.items) {
    const score = responseScore(administration.responses, item);
    if (score !== undefined && item.stopRule?.scores.some((stopScore) => stopScore === score)) return { status: "stopped", stopItemId: item.id };
  }
  if (administration.status === "stopped") return { status: "stopped" };

  const required = [
    ...definition.sections.wordComprehension.items,
    ...definition.sections.sentenceComprehension.items,
    ...definition.sections.naming.items,
    ...definition.sections.repetition.items,
    ...definition.sections.reading.items,
    ...definition.sections.spontaneousSpeech.items,
    definition.sections.motorSpeech.items[1],
  ];
  const missingItemIds = required.filter((item) => responseScore(administration.responses, item) === undefined).map((item) => item.id);
  if (missingItemIds.length) return { status: "incomplete", missingItemIds };

  const score = (id: string) => (administration.responses[id] as Extract<QabItemResponse, { status: "scored" }>).score;
  const sum = (itemIds: readonly string[]) => itemIds.reduce((total, id) => total + score(id), 0);
  const form = administration.form;
  const spontaneous = ids(form, "spontaneous-speech", "abcdefghij");
  const wordComprehension = Math.max(sum(ids(form, "word-comprehension", "abcdefgh")) - 8, 0) / 24 * 10;
  const sentenceComprehension = Math.max(sum(ids(form, "sentence-comprehension", "abcdefghijkl")) - 24, 0) / 24 * 10;
  const naming = sum(ids(form, "naming", "abcdef"));
  const lexicalRetrieval = 6 * naming / 24
    + 2 * score(spontaneous[4]) / 4
    + 2 * (Math.min(score(spontaneous[5]), score(spontaneous[4])) + Math.min(score(spontaneous[6]), score(spontaneous[4])) + Math.min(score(spontaneous[7]), score(spontaneous[4]))) / 12;
  const repetitionSentenceIds = ids(form, "repetition", "ef");
  const readingSentenceIds = ids(form, "reading", "ef");
  const grammar = 4 * score(spontaneous[2]) / 4
    + 2 * score(spontaneous[0]) / 4
    + 2 * Math.min(score(spontaneous[3]), score(spontaneous[2])) / 4
    + 2 * sum([...repetitionSentenceIds, ...readingSentenceIds]) / 16;
  const motorProgramming = score(`qab${form}-motor-speech-b`) / 4 * 10;
  const repetition = sum(ids(form, "repetition", "abcdef")) / 24 * 10;
  const reading = sum(ids(form, "reading", "abcdef")) / 24 * 10;
  const overall = 0.18 * wordComprehension
    + 0.18 * sentenceComprehension
    + 0.14 * lexicalRetrieval
    + 0.14 * grammar
    + 0.08 * motorProgramming
    + 0.08 * repetition
    + 0.08 * reading
    + 0.8 * (score(spontaneous[9]) + 1) / 5
    + 0.2 * score(spontaneous[1]) / 4
    + 0.2 * score(spontaneous[8]) / 4;

  // The official workbook does not round formulas. Presentation layers may format these values.
  const scores: QabScores = { wordComprehension, sentenceComprehension, lexicalRetrieval, grammar, motorProgramming, repetition, reading, overall, formulaVersion: QAB_FORMULA_VERSION };
  return { status: "available", scores };
}
