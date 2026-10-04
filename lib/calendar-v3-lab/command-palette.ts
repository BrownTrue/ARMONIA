import type { CalendarDate } from "./date-time.ts";
import type { CalendarLabView } from "./view.ts";

export type CalendarCommandId = "create" | "today" | "go_to_date" | "week" | "month" | "day";

export type CalendarCommand = {
  id: CalendarCommandId;
  label: string;
  keywords: readonly string[];
  shortcut?: string;
  enabled: boolean;
  badge?: string;
};

export const CALENDAR_COMMANDS: readonly CalendarCommand[] = Object.freeze([
  { id: "create", label: "Crea appuntamento", keywords: ["crea", "nuovo", "appuntamento"], shortcut: "C", enabled: true },
  { id: "today", label: "Vai a oggi", keywords: ["oggi", "torna", "data corrente"], shortcut: "T", enabled: true },
  { id: "go_to_date", label: "Vai a una data…", keywords: ["data", "giorno", "vai"], enabled: true },
  { id: "week", label: "Vista settimana", keywords: ["vista", "settimana", "week"], enabled: true },
  { id: "month", label: "Vista mese", keywords: ["vista", "mese", "month"], enabled: false, badge: "Prossimamente" },
  { id: "day", label: "Vista giorno", keywords: ["vista", "giorno", "day"], enabled: true },
]);

export function calendarCommandsForView(view: CalendarLabView): readonly CalendarCommand[] {
  return CALENDAR_COMMANDS.map((command) =>
    command.id === view ? { ...command, badge: "Attiva" } : command,
  );
}

export function filterCalendarCommands(query: string, view: CalendarLabView = "week"): readonly CalendarCommand[] {
  const normalized = query.trim().toLocaleLowerCase("it");
  const commands = calendarCommandsForView(view);
  if (!normalized) return commands;
  return commands.filter((command) =>
    [command.label, ...command.keywords].some((value) => value.toLocaleLowerCase("it").includes(normalized)),
  );
}

export function nextEnabledCalendarCommandIndex(
  commands: readonly CalendarCommand[],
  currentIndex: number,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
): number {
  const enabledIndices = commands.flatMap((command, index) => command.enabled ? [index] : []);
  if (!enabledIndices.length) return -1;
  if (key === "Home") return enabledIndices[0];
  if (key === "End") return enabledIndices.at(-1)!;
  const currentPosition = enabledIndices.indexOf(currentIndex);
  if (key === "ArrowDown") return enabledIndices[(currentPosition + 1 + enabledIndices.length) % enabledIndices.length];
  return enabledIndices[(currentPosition - 1 + enabledIndices.length) % enabledIndices.length];
}

export function isCalendarShortcutTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const element = target as HTMLElement;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) || element.isContentEditable === true;
}

export function isValidCalendarCommandDate(value: string): value is CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3]);
}
