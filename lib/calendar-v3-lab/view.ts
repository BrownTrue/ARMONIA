import { addCalendarDays, calendarWeekDays, type CalendarDate } from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

export type CalendarLabView = "day" | "week";

export function calendarLabVisibleDates(view: CalendarLabView, cursorDate: CalendarDate): CalendarDate[] {
  return view === "day" ? [cursorDate] : calendarWeekDays(cursorDate);
}

export function navigateCalendarLabDate(
  view: CalendarLabView,
  cursorDate: CalendarDate,
  direction: -1 | 1,
): CalendarDate {
  return addCalendarDays(cursorDate, direction * (view === "day" ? 1 : 7));
}

export function calendarLabDaySummary(events: readonly CalendarLabEvent[], date: CalendarDate) {
  const dayEvents = events.filter((event) => event.date === date);
  return {
    appointmentCount: dayEvents.length,
    occupiedMinutes: dayEvents.reduce((total, event) => total + event.endMinutes - event.startMinutes, 0),
  };
}
