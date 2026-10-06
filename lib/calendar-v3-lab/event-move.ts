import {
  CALENDAR_LAB_CONFIG,
  snapMinute,
  type CalendarDate,
} from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";
import { CALENDAR_DRAG_THRESHOLD_PX } from "./drag-selection.ts";

type MoveAnchor = {
  pointerId: number;
  anchorClientX: number;
  anchorClientY: number;
  lastClientX: number;
  lastClientY: number;
  grabOffsetMinutes: number;
  before: CalendarLabEvent;
};

export type CalendarEventMoveState =
  | { status: "idle" }
  | ({ status: "pointerDownCandidate" } & MoveAnchor)
  | ({ status: "moving"; preview: CalendarLabEvent } & MoveAnchor);

export const IDLE_CALENDAR_EVENT_MOVE: CalendarEventMoveState = Object.freeze({ status: "idle" });

export function isCalendarLabEventDraggable(event: CalendarLabEvent): boolean {
  return event.status === "scheduled" &&
    event.sessionState === "to_register";
}

export function calendarDayFromClientX(
  clientX: number,
  gridLeft: number,
  gridWidth: number,
  days: readonly CalendarDate[],
): CalendarDate {
  if (!days.length || !(gridWidth > 0)) throw new Error("invalid_calendar_day_geometry");
  const relativeX = Math.min(gridWidth - Number.EPSILON, Math.max(0, clientX - gridLeft));
  const dayIndex = Math.min(days.length - 1, Math.floor(relativeX / (gridWidth / days.length)));
  return days[dayIndex];
}

export function movedCalendarLabEvent(
  event: CalendarLabEvent,
  date: CalendarDate,
  pointerMinute: number,
  grabOffsetMinutes: number,
): CalendarLabEvent {
  const duration = event.endMinutes - event.startMinutes;
  const dayStart = CALENDAR_LAB_CONFIG.startHour * 60;
  const lastStart = CALENDAR_LAB_CONFIG.endHour * 60 - duration;
  const proposedStart = snapMinute(pointerMinute - grabOffsetMinutes);
  const startMinutes = Math.max(dayStart, Math.min(lastStart, proposedStart));
  return {
    ...event,
    date,
    startMinutes,
    endMinutes: startMinutes + duration,
  };
}

export function beginCalendarEventMove(input: {
  event: CalendarLabEvent;
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  pointerMinute: number;
  clientX: number;
  clientY: number;
}): CalendarEventMoveState {
  if (
    !isCalendarLabEventDraggable(input.event) ||
    !input.isPrimary ||
    input.button !== 0 ||
    input.pointerType === "touch"
  ) {
    return IDLE_CALENDAR_EVENT_MOVE;
  }
  return {
    status: "pointerDownCandidate",
    pointerId: input.pointerId,
    anchorClientX: input.clientX,
    anchorClientY: input.clientY,
    lastClientX: input.clientX,
    lastClientY: input.clientY,
    grabOffsetMinutes: input.pointerMinute - input.event.startMinutes,
    before: input.event,
  };
}

export function moveCalendarEvent(
  state: CalendarEventMoveState,
  input: {
    pointerId: number;
    date: CalendarDate;
    pointerMinute: number;
    clientX: number;
    clientY: number;
  },
): CalendarEventMoveState {
  if (state.status === "idle" || input.pointerId !== state.pointerId) return state;
  const distance = Math.hypot(
    input.clientX - state.anchorClientX,
    input.clientY - state.anchorClientY,
  );
  if (state.status === "pointerDownCandidate" && distance < CALENDAR_DRAG_THRESHOLD_PX) {
    return { ...state, lastClientX: input.clientX, lastClientY: input.clientY };
  }
  return {
    ...state,
    status: "moving",
    lastClientX: input.clientX,
    lastClientY: input.clientY,
    preview: movedCalendarLabEvent(
      state.before,
      input.date,
      input.pointerMinute,
      state.grabOffsetMinutes,
    ),
  };
}

export function completeCalendarEventMove(
  state: CalendarEventMoveState,
  input: {
    pointerId: number;
    date: CalendarDate;
    pointerMinute: number;
    clientX: number;
    clientY: number;
  },
): { state: CalendarEventMoveState; event?: CalendarLabEvent; wasMove: boolean } {
  const finalState = moveCalendarEvent(state, input);
  return {
    state: IDLE_CALENDAR_EVENT_MOVE,
    event: finalState.status === "moving" ? finalState.preview : undefined,
    wasMove: finalState.status === "moving",
  };
}

export function cancelCalendarEventMove(): CalendarEventMoveState {
  return IDLE_CALENDAR_EVENT_MOVE;
}
