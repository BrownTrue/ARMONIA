import type { CalendarLabEvent } from "./fixtures.ts";

export type CalendarContextMenuAction =
  | "create"
  | "go_to_day"
  | "open"
  | "register_session"
  | "duplicate"
  | "cancel";

export type CalendarContextMenuItem = {
  id: CalendarContextMenuAction;
  label: string;
  separatorBefore?: boolean;
  destructive?: boolean;
};

export const EMPTY_SLOT_CONTEXT_ITEMS: readonly CalendarContextMenuItem[] = Object.freeze([
  { id: "create", label: "Crea appuntamento qui" },
  { id: "go_to_day", label: "Vai a questo giorno", separatorBefore: true },
]);

export function contextMenuItemsForEvent(event: CalendarLabEvent): readonly CalendarContextMenuItem[] {
  if (event.status === "cancelled") {
    return [
      { id: "open", label: "Apri" },
      { id: "duplicate", label: "Duplica" },
    ];
  }

  return [
    { id: "open", label: "Apri" },
    ...(event.sessionState === "to_register"
      ? [{ id: "register_session" as const, label: "Registra seduta" }]
      : []),
    { id: "duplicate", label: "Duplica" },
    { id: "cancel", label: "Annulla appuntamento", separatorBefore: true, destructive: true },
  ];
}

export function duplicateCalendarLabEvent(event: CalendarLabEvent, id: string): CalendarLabEvent {
  return {
    ...event,
    id,
    status: "scheduled",
    sessionState: "to_register",
  };
}

export function clampContextMenuPosition(
  anchor: { x: number; y: number },
  menu: { width: number; height: number },
  viewport: { width: number; height: number },
  padding = 8,
): { x: number; y: number } {
  return {
    x: Math.max(padding, Math.min(anchor.x, viewport.width - menu.width - padding)),
    y: Math.max(padding, Math.min(anchor.y, viewport.height - menu.height - padding)),
  };
}

export function nextContextMenuIndex(
  currentIndex: number,
  itemCount: number,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
): number {
  if (itemCount <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;
  if (key === "ArrowDown") return (currentIndex + 1 + itemCount) % itemCount;
  return (currentIndex - 1 + itemCount) % itemCount;
}
