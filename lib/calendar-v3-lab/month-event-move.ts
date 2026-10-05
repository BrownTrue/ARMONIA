import type { CalendarDate } from "./date-time.ts";
import { CALENDAR_DRAG_THRESHOLD_PX } from "./drag-selection.ts";
import { isCalendarLabEventDraggable } from "./event-move.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

type MonthMoveAnchor = {
  pointerId: number;
  anchorClientX: number;
  anchorClientY: number;
  lastClientX: number;
  lastClientY: number;
  before: CalendarLabEvent;
};

export type CalendarMonthEventMoveState =
  | { status: "idle" }
  | ({ status: "pointerDownCandidate" } & MonthMoveAnchor)
  | ({ status: "movingMonthEvent"; preview: CalendarLabEvent } & MonthMoveAnchor);

export const IDLE_CALENDAR_MONTH_EVENT_MOVE: CalendarMonthEventMoveState = Object.freeze({ status: "idle" });

export function calendarMonthDateFromClientPoint(
  clientX: number,
  clientY: number,
  grid: { left: number; top: number; width: number; height: number },
  days: readonly CalendarDate[],
): CalendarDate | null {
  if (days.length !== 42 || !(grid.width > 0) || !(grid.height > 0)) return null;
  const relativeX = clientX - grid.left;
  const relativeY = clientY - grid.top;
  if (relativeX < 0 || relativeY < 0 || relativeX >= grid.width || relativeY >= grid.height) return null;
  const column = Math.min(6, Math.floor(relativeX / (grid.width / 7)));
  const row = Math.min(5, Math.floor(relativeY / (grid.height / 6)));
  return days[row * 7 + column] ?? null;
}

export function movedCalendarMonthEvent(event: CalendarLabEvent, date: CalendarDate): CalendarLabEvent {
  return { ...event, date };
}

export function beginCalendarMonthEventMove(input: {
  event: CalendarLabEvent;
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  clientX: number;
  clientY: number;
}): CalendarMonthEventMoveState {
  if (
    !isCalendarLabEventDraggable(input.event) ||
    !input.isPrimary ||
    input.button !== 0 ||
    input.pointerType === "touch"
  ) {
    return IDLE_CALENDAR_MONTH_EVENT_MOVE;
  }
  return {
    status: "pointerDownCandidate",
    pointerId: input.pointerId,
    anchorClientX: input.clientX,
    anchorClientY: input.clientY,
    lastClientX: input.clientX,
    lastClientY: input.clientY,
    before: input.event,
  };
}

export function moveCalendarMonthEvent(
  state: CalendarMonthEventMoveState,
  input: { pointerId: number; date: CalendarDate; clientX: number; clientY: number },
): CalendarMonthEventMoveState {
  if (state.status === "idle" || state.pointerId !== input.pointerId) return state;
  const distance = Math.hypot(input.clientX - state.anchorClientX, input.clientY - state.anchorClientY);
  if (state.status === "pointerDownCandidate" && distance < CALENDAR_DRAG_THRESHOLD_PX) {
    return { ...state, lastClientX: input.clientX, lastClientY: input.clientY };
  }
  return {
    ...state,
    status: "movingMonthEvent",
    lastClientX: input.clientX,
    lastClientY: input.clientY,
    preview: movedCalendarMonthEvent(state.before, input.date),
  };
}

export function completeCalendarMonthEventMove(
  state: CalendarMonthEventMoveState,
  input: { pointerId: number; date: CalendarDate | null; clientX: number; clientY: number },
): { state: CalendarMonthEventMoveState; event?: CalendarLabEvent; wasMove: boolean } {
  if (!input.date) return { state: IDLE_CALENDAR_MONTH_EVENT_MOVE, wasMove: false };
  const finalState = moveCalendarMonthEvent(state, { ...input, date: input.date });
  return {
    state: IDLE_CALENDAR_MONTH_EVENT_MOVE,
    event: finalState.status === "movingMonthEvent" ? finalState.preview : undefined,
    wasMove: finalState.status === "movingMonthEvent",
  };
}

export function cancelCalendarMonthEventMove(): CalendarMonthEventMoveState {
  return IDLE_CALENDAR_MONTH_EVENT_MOVE;
}
