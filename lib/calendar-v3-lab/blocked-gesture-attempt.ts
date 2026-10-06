import { CALENDAR_DRAG_THRESHOLD_PX } from "./drag-selection.ts";

type AttemptAnchor = {
  pointerId: number;
  anchorClientX: number;
  anchorClientY: number;
};

export type CalendarBlockedGestureAttempt =
  | { status: "idle" }
  | ({ status: "candidate" } & AttemptAnchor)
  | ({ status: "attempted" } & AttemptAnchor);

export const IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT: CalendarBlockedGestureAttempt = Object.freeze({ status: "idle" });

export function beginCalendarBlockedGestureAttempt(input: {
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  button: number;
  clientX: number;
  clientY: number;
}): CalendarBlockedGestureAttempt {
  if (!input.isPrimary || input.button !== 0 || input.pointerType === "touch") {
    return IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT;
  }
  return {
    status: "candidate",
    pointerId: input.pointerId,
    anchorClientX: input.clientX,
    anchorClientY: input.clientY,
  };
}

export function moveCalendarBlockedGestureAttempt(
  state: CalendarBlockedGestureAttempt,
  input: { pointerId: number; clientX: number; clientY: number },
): CalendarBlockedGestureAttempt {
  if (state.status === "idle" || state.pointerId !== input.pointerId || state.status === "attempted") return state;
  const distance = Math.hypot(input.clientX - state.anchorClientX, input.clientY - state.anchorClientY);
  return distance >= CALENDAR_DRAG_THRESHOLD_PX ? { ...state, status: "attempted" } : state;
}

export function completeCalendarBlockedGestureAttempt(
  state: CalendarBlockedGestureAttempt,
  input: { pointerId: number; clientX: number; clientY: number },
): { state: CalendarBlockedGestureAttempt; wasAttempt: boolean } {
  const finalState = moveCalendarBlockedGestureAttempt(state, input);
  return {
    state: IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT,
    wasAttempt: finalState.status === "attempted",
  };
}

export function cancelCalendarBlockedGestureAttempt(): CalendarBlockedGestureAttempt {
  return IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT;
}
