import { scoreQabItalian } from "./qab-it/scoring.ts";
import type { QabAdministrationV1 } from "./qab-it/types.ts";
import { isQabAdministrationV1 } from "./qab-it/validation.ts";
import { QAB_ITALIAN_ATTRIBUTION } from "./qab-it/content.ts";
import type { QabScores } from "./qab-it/types.ts";

export type NativeClinicalToolEnvelope = { toolId: string; schemaVersion: number; data: unknown };

export type NativeClinicalToolDefinition<T> = {
  toolId: string;
  schemaVersion: number;
  createInitialData: () => T;
  validate: (value: unknown) => value is T;
  calculateResults: (value: T) => unknown;
};

const qabItalianDefinition: NativeClinicalToolDefinition<QabAdministrationV1> = {
  toolId: "qab-it",
  schemaVersion: 1,
  createInitialData: () => ({ kind: "qab-it", schemaVersion: 1, status: "not_started", responses: {} }),
  validate: isQabAdministrationV1,
  calculateResults: scoreQabItalian,
};

export const nativeClinicalToolRegistry = [qabItalianDefinition] as const;
export const getNativeClinicalTool = (toolId: string) => nativeClinicalToolRegistry.find((entry) => entry.toolId === toolId);
export const isNativeClinicalToolEnvelope = (value: unknown): value is NativeClinicalToolEnvelope => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const envelope = value as Record<string, unknown>;
  const definition = typeof envelope.toolId === "string" ? getNativeClinicalTool(envelope.toolId) : undefined;
  return Boolean(definition && envelope.schemaVersion === definition.schemaVersion && definition.validate(envelope.data));
};

export function createNativeClinicalToolEnvelope(toolId: string): NativeClinicalToolEnvelope {
  const definition = getNativeClinicalTool(toolId);
  if (!definition) throw new Error(`Strumento nativo non supportato: ${toolId}.`);
  return { toolId, schemaVersion: definition.schemaVersion, data: definition.createInitialData() };
}

const QAB_DOMAINS: readonly [keyof Omit<QabScores, "overall" | "formulaVersion">, string][] = [["wordComprehension", "Comprensione parole"], ["sentenceComprehension", "Comprensione frasi"], ["lexicalRetrieval", "Recupero lessicale"], ["grammar", "Costruzione grammaticale"], ["motorProgramming", "Programmazione fonetico-articolatoria"], ["repetition", "Ripetizione"], ["reading", "Lettura"]];
export function nativeClinicalToolPrintLines(envelope: NativeClinicalToolEnvelope): string[] {
  if (envelope.toolId !== "qab-it" || !isQabAdministrationV1(envelope.data)) return [];
  const value = envelope.data;
  const result = value.form ? scoreQabItalian(value) : { status: "incomplete" as const };
  const lines = [`Italian QAB${value.form ? ` · Modulo ${value.form}` : ""}`, `Stato: ${value.status === "completed" ? "Completata" : value.status === "stopped" ? "Interrotta" : value.status === "in_progress" ? "In corso" : "Non avviata"}`];
  if (value.administrationDate) lines.push(`Data: ${value.administrationDate}`);
  if (value.stop) lines.push(`Interruzione: ${value.stop.reason}`);
  if (result.status === "available") {
    lines.push(`QAB generale: ${result.scores.overall.toLocaleString("it-IT", { maximumFractionDigits: 2 })} / 10`);
    for (const [key, label] of QAB_DOMAINS) lines.push(`${label}: ${result.scores[key].toLocaleString("it-IT", { maximumFractionDigits: 2 })}`);
    lines.push(`Formula: ${result.scores.formulaVersion}`);
  }
  lines.push(`${QAB_ITALIAN_ATTRIBUTION.title} · ${QAB_ITALIAN_ATTRIBUTION.adaptationAuthors.join(", ")} · ${QAB_ITALIAN_ATTRIBUTION.license}`);
  return lines;
}
