import { scoreQabItalian } from "./scoring.ts";
import type { QabAdministrationV1, QabForm, QabItemResponse, QabScoredItem } from "./types.ts";

export const canChangeQabForm = (value: QabAdministrationV1) => value.status === "not_started" && Object.keys(value.responses).length === 0;
export const startQabAdministration = (value: QabAdministrationV1, form: QabForm, date?: string): QabAdministrationV1 => ({ ...value, form, status: "in_progress", administrationDate: date || value.administrationDate });
export const pauseQabAdministration = (value: QabAdministrationV1): QabAdministrationV1 => value.status === "in_progress" ? value : value;
export const qabTimerLabel = (seconds: number) => seconds < 3 ? "Prima dei 3 secondi" : seconds < 6 ? "Oltre 3 secondi" : "Oltre 6 secondi";

export function applyQabResponse(value: QabAdministrationV1, item: QabScoredItem, response: QabItemResponse) {
  if (value.status !== "in_progress") return { status: "blocked" as const, value };
  if (response.status === "scored" && !item.allowedScores.includes(response.score)) return { status: "invalid" as const, value };
  if (response.status === "scored" && item.stopRule?.scores.includes(response.score)) return { status: "confirm_stop" as const, value, reason: item.stopRule.reason };
  return { status: "updated" as const, value: { ...value, responses: { ...value.responses, [item.id]: response } } };
}

export function completeQabAdministration(value: QabAdministrationV1) {
  const result = scoreQabItalian(value);
  return result.status === "available" ? { ok: true as const, value: { ...value, status: "completed" as const }, result } : { ok: false as const, value, result };
}
