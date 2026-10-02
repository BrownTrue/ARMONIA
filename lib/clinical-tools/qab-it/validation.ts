import { QAB_ITALIAN_FORMS, QAB_ITALIAN_STIMULUS_CARDS } from "./content.ts";
import { QAB_FORMS, QAB_SECTION_CODES, type QabAdministrationV1, type QabItemResponse, type QabScore } from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isScore = (value: unknown): value is QabScore => Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 4;

export function isQabItemResponse(value: unknown): value is QabItemResponse {
  if (!isRecord(value) || !["scored", "notAdministered", "notScorable"].includes(String(value.status))) return false;
  if (Object.keys(value).some((key) => !["status", "score", "responseNote"].includes(key))) return false;
  if (value.responseNote !== undefined && typeof value.responseNote !== "string") return false;
  return value.status === "scored" ? isScore(value.score) : value.score === undefined;
}

export function isQabAdministrationV1(value: unknown): value is QabAdministrationV1 {
  if (!isRecord(value) || value.kind !== "qab-it" || value.schemaVersion !== 1 || (value.form !== undefined && !QAB_FORMS.includes(value.form as 1 | 2 | 3)) || !["not_started", "in_progress", "completed", "stopped"].includes(String(value.status)) || !isRecord(value.responses)) return false;
  if (value.status !== "not_started" && value.form === undefined) return false;
  if (value.status === "not_started" && Object.keys(value.responses).length > 0) return false;
  if (value.administrationDate !== undefined && typeof value.administrationDate !== "string") return false;
  if (value.location !== undefined && typeof value.location !== "string") return false;
  if (value.examiner !== undefined && typeof value.examiner !== "string") return false;
  if (value.dynamicValues !== undefined && (!isRecord(value.dynamicValues) || !Object.values(value.dynamicValues).every((item) => typeof item === "string" || typeof item === "number"))) return false;
  if (value.stop !== undefined && (!isRecord(value.stop) || typeof value.stop.itemId !== "string" || typeof value.stop.reason !== "string" || typeof value.stop.stoppedAt !== "string")) return false;
  if (Object.keys(value).some((key) => !["kind", "schemaVersion", "form", "status", "responses", "administrationDate", "location", "examiner", "dynamicValues", "stop"].includes(key))) return false;
  if (value.form === undefined) return true;
  const definition = QAB_ITALIAN_FORMS.find((form) => form.form === value.form)!;
  const items = Object.values(definition.sections).flatMap((section) => section.items);
  const byId = new Map(items.map((item) => [item.id, item]));
  return Object.entries(value.responses).every(([id, response]) => {
    if (!isQabItemResponse(response)) return false;
    const item = byId.get(id);
    return Boolean(item) && (response.status !== "scored" || item!.allowedScores.includes(response.score));
  });
}

export function validateQabCanonicalContent() {
  const issues: string[] = [];
  if (QAB_ITALIAN_FORMS.length !== 3) issues.push("Sono richiesti esattamente tre moduli.");
  const ids = new Set<string>();
  const expectedCounts = { awareness: 8, spontaneousSpeech: 10, wordComprehension: 8, sentenceComprehension: 12, naming: 6, repetition: 6, reading: 6, motorSpeech: 2 };
  for (const form of QAB_ITALIAN_FORMS) {
    if (Object.keys(form.sections).length !== 8) issues.push(`Modulo ${form.form}: numero sezioni errato.`);
    for (const code of QAB_SECTION_CODES) {
      const section = form.sections[code];
      if (section.items.length !== expectedCounts[code]) issues.push(`Modulo ${form.form}, ${code}: conteggio item errato.`);
      for (const item of section.items) {
        if (ids.has(item.id)) issues.push(`ID duplicato: ${item.id}.`);
        ids.add(item.id);
        if (!item.allowedScores.length || item.allowedScores.some((score) => !isScore(score))) issues.push(`Score non validi: ${item.id}.`);
      }
    }
    for (const id of [`qab${form.form}-awareness-c`, `qab${form.form}-awareness-d`, `qab${form.form}-awareness-e`]) if (!ids.has(id) || !form.sections.awareness.items.find((item) => item.id === id)?.dynamicFields?.length) issues.push(`Placeholder dinamici mancanti: ${id}.`);
  }
  if (QAB_ITALIAN_STIMULUS_CARDS.length !== 18) issues.push("Sono richieste esattamente 18 carte stimolo.");
  for (const form of QAB_FORMS) for (let card = 1; card <= 6; card += 1) if (!QAB_ITALIAN_STIMULUS_CARDS.some((entry) => entry.form === form && entry.cardNumber === card)) issues.push(`Carta mancante: modulo ${form}, carta ${card}.`);
  return issues;
}
