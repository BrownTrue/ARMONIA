import { CALENDAR_LAB_CONFIG, snapMinute } from "./date-time.ts";
import { CALENDAR_DRAG_THRESHOLD_PX } from "./drag-selection.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

type ResizeAnchor = {
  pointerId: number;
  anchorClientY: number;
  lastClientY: number;
  before: CalendarLabEvent;
};

export type CalendarEventResizeState =
  | { status: "idle" }
  | ({ status: "resizeCandidate" } & ResizeAnchor)
  | ({ status: "resizing"; preview: CalendarLabEvent } & ResizeAnchor);

export const IDLE_CALENDAR_EVENT_RESIZE: CalendarEventResizeState = Object.freeze({ status: "idle" });

export function isCalendarLabEventResizable(event: CalendarLabEvent): boolean {
  return event.status === "scheduled" && event.sessionState === "to_register";
}

export function resizedCalendarLabEvent(
  event: CalendarLabEvent,
  pointerEndMinute: number,
): CalendarLabEvent {
  const minimumEnd = event.startMinutes + CALENDAR_LAB_CONFIG.slotMinutes;
  const maximumEnd = CALENDAR_LAB_CONFIG.endHour * 60;
  const endMinutes = Math.max(
    minimumEnd,
    Math.min(maximumEnd, snapMinute(pointerEndMinute)),
  );
  return { ...event, endMinutes };
}

export function beginCalendarEventResize(input: {
  event: CalendarLabEvent;
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  clientY: number;
}): CalendarEventResizeState {
  if (
    !isCalendarLabEventResizable(input.event) ||
    !input.isPrimary ||
    input.button !== 0 ||
    input.pointerType === "touch"
  ) {
    return IDLE_CALENDAR_EVENT_RESIZE;
  }
  return {
    status: "resizeCandidate",
    pointerId: input.pointerId,
    anchorClientY: input.clientY,
    lastClientY: input.clientY,
    before: input.event,
  };
}

export function resizeCalendarEvent(
  state: CalendarEventResizeState,
  input: { pointerId: number; pointerEndMinute: number; clientY: number },
): CalendarEventResizeState {
  if (state.status === "idle" || input.pointerId !== state.pointerId) return state;
  if (
    state.status === "resizeCandidate" &&
    Math.abs(input.clientY - state.anchorClientY) < CALENDAR_DRAG_THRESHOLD_PX
  ) {
    return { ...state, lastClientY: input.clientY };
  }
  return {
    ...state,
    status: "resizing",
    lastClientY: input.clientY,
    preview: resizedCalendarLabEvent(state.before, input.pointerEndMinute),
  };
}

export function completeCalendarEventResize(
  state: CalendarEventResizeState,
  input: { pointerId: number; pointerEndMinute: number; clientY: number },
): { state: CalendarEventResizeState; event?: CalendarLabEvent; wasResize: boolean } {
  const finalState = resizeCalendarEvent(state, input);
  return {
    state: IDLE_CALENDAR_EVENT_RESIZE,
    event: finalState.status === "resizing" ? finalState.preview : undefined,
    wasResize: finalState.status === "resizing",
  };
}

export function cancelCalendarEventResize(): CalendarEventResizeState {
  return IDLE_CALENDAR_EVENT_RESIZE;
}
