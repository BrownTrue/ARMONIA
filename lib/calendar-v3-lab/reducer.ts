import { CALENDAR_LAB_WEEK, type CalendarLabEvent } from "./fixtures.ts";
import type { CalendarDate } from "./date-time.ts";
import type { CalendarSelection } from "./selection.ts";

export type CalendarLabState = {
  cursorDate: CalendarDate;
  view: "week";
  sidebarOpen: boolean;
  selectedEventId: string | null;
  selection: CalendarSelection | null;
  hiddenFilters: readonly string[];
  events: readonly CalendarLabEvent[];
};

export type CalendarLabAction =
  | { type: "set_cursor_date"; date: CalendarDate }
  | { type: "set_sidebar_open"; open: boolean }
  | { type: "select_event"; eventId: string | null }
  | { type: "set_selection"; selection: CalendarSelection | null }
  | { type: "add_event"; event: CalendarLabEvent }
  | { type: "update_event"; event: CalendarLabEvent }
  | { type: "move_event"; event: CalendarLabEvent }
  | { type: "toggle_filter"; filter: string }
  | { type: "reset"; events: readonly CalendarLabEvent[] };

export function createCalendarLabState(events: readonly CalendarLabEvent[]): CalendarLabState {
  return {
    cursorDate: CALENDAR_LAB_WEEK,
    view: "week",
    sidebarOpen: true,
    selectedEventId: null,
    selection: null,
    hiddenFilters: [],
    events,
  };
}

export function calendarLabReducer(
  state: CalendarLabState,
  action: CalendarLabAction,
): CalendarLabState {
  switch (action.type) {
    case "set_cursor_date":
      return { ...state, cursorDate: action.date };
    case "set_sidebar_open":
      return { ...state, sidebarOpen: action.open };
    case "select_event":
      return { ...state, selectedEventId: action.eventId };
    case "set_selection":
      return { ...state, selection: action.selection };
    case "add_event":
      return { ...state, events: [...state.events, action.event], selection: null, selectedEventId: null };
    case "update_event":
      return {
        ...state,
        events: state.events.map((event) => event.id === action.event.id ? action.event : event),
        selection: null,
        selectedEventId: null,
      };
    case "move_event":
      return {
        ...state,
        events: state.events.map((event) => event.id === action.event.id ? action.event : event),
      };
    case "toggle_filter":
      return {
        ...state,
        hiddenFilters: state.hiddenFilters.includes(action.filter)
          ? state.hiddenFilters.filter((filter) => filter !== action.filter)
          : [...state.hiddenFilters, action.filter],
      };
    case "reset":
      return createCalendarLabState(action.events);
  }
}
