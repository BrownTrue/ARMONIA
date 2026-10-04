import type { CalendarDate } from "./date-time.ts";
import { normalizeCalendarSelection, type CalendarSelection } from "./selection.ts";

export const CALENDAR_DRAG_THRESHOLD_PX = 5;
export const CALENDAR_AUTOSCROLL_EDGE_PX = 56;
export const CALENDAR_AUTOSCROLL_MAX_PX = 8;

type DragAnchor = {
  pointerId: number;
  date: CalendarDate;
  anchorMinutes: number;
  anchorClientY: number;
  lastClientY: number;
};

export type CalendarDragSelectionState =
  | { status: "idle" }
  | ({ status: "pointerDownCandidate" } & DragAnchor)
  | ({ status: "selecting"; selection: CalendarSelection } & DragAnchor);

export const IDLE_CALENDAR_DRAG_SELECTION: CalendarDragSelectionState = Object.freeze({ status: "idle" });

export function beginCalendarDragSelection(input: {
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  date: CalendarDate;
  minute: number;
  clientY: number;
}): CalendarDragSelectionState {
  if (!input.isPrimary || input.button !== 0 || input.pointerType === "touch") {
    return IDLE_CALENDAR_DRAG_SELECTION;
  }
  return {
    status: "pointerDownCandidate",
    pointerId: input.pointerId,
    date: input.date,
    anchorMinutes: input.minute,
    anchorClientY: input.clientY,
    lastClientY: input.clientY,
  };
}

export function moveCalendarDragSelection(
  state: CalendarDragSelectionState,
  input: { pointerId: number; minute: number; clientY: number },
): CalendarDragSelectionState {
  if (state.status === "idle" || input.pointerId !== state.pointerId) return state;
  if (
    state.status === "pointerDownCandidate" &&
    Math.abs(input.clientY - state.anchorClientY) < CALENDAR_DRAG_THRESHOLD_PX
  ) {
    return { ...state, lastClientY: input.clientY };
  }
  return {
    ...state,
    status: "selecting",
    lastClientY: input.clientY,
    selection: normalizeCalendarSelection(state.date, state.anchorMinutes, input.minute),
  };
}

export function completeCalendarDragSelection(
  state: CalendarDragSelectionState,
  input: { pointerId: number; minute: number; clientY: number },
): { state: CalendarDragSelectionState; selection?: CalendarSelection; wasDrag: boolean } {
  const finalState = moveCalendarDragSelection(state, input);
  return {
    state: IDLE_CALENDAR_DRAG_SELECTION,
    selection: finalState.status === "selecting" ? finalState.selection : undefined,
    wasDrag: finalState.status === "selecting",
  };
}

export function cancelCalendarDragSelection(): CalendarDragSelectionState {
  return IDLE_CALENDAR_DRAG_SELECTION;
}

export function calendarDragAutoScrollVelocity(
  pointerClientY: number,
  containerTop: number,
  containerBottom: number,
): number {
  if (pointerClientY < containerTop + CALENDAR_AUTOSCROLL_EDGE_PX) {
    const ratio = Math.min(1, (containerTop + CALENDAR_AUTOSCROLL_EDGE_PX - pointerClientY) / CALENDAR_AUTOSCROLL_EDGE_PX);
    return -Math.max(1, Math.round(ratio * CALENDAR_AUTOSCROLL_MAX_PX));
  }
  if (pointerClientY > containerBottom - CALENDAR_AUTOSCROLL_EDGE_PX) {
    const ratio = Math.min(1, (pointerClientY - (containerBottom - CALENDAR_AUTOSCROLL_EDGE_PX)) / CALENDAR_AUTOSCROLL_EDGE_PX);
    return Math.max(1, Math.round(ratio * CALENDAR_AUTOSCROLL_MAX_PX));
  }
  return 0;
}
