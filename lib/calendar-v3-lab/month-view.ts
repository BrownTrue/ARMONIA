import {
  addCalendarDays,
  calendarDayOfWeek,
  type CalendarDate,
} from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

export const CALENDAR_MONTH_CELL_COUNT = 42;
export const CALENDAR_MONTH_VISIBLE_EVENT_LIMIT = 2;

export function startOfCalendarMonth(date: CalendarDate): CalendarDate {
  return `${date.slice(0, 7)}-01` as CalendarDate;
}

export function calendarMonthDays(date: CalendarDate): CalendarDate[] {
  const first = startOfCalendarMonth(date);
  const weekday = calendarDayOfWeek(first);
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  const firstVisible = addCalendarDays(first, -mondayOffset);
  return Array.from(
    { length: CALENDAR_MONTH_CELL_COUNT },
    (_, index) => addCalendarDays(firstVisible, index),
  );
}

export function isCalendarDateInMonth(date: CalendarDate, monthDate: CalendarDate): boolean {
  return date.slice(0, 7) === monthDate.slice(0, 7);
}

export function calendarMonthEventsByDate(events: readonly CalendarLabEvent[]) {
  const grouped = new Map<CalendarDate, CalendarLabEvent[]>();
  for (const event of events) {
    const current = grouped.get(event.date) ?? [];
    current.push(event);
    grouped.set(event.date, current);
  }
  for (const dayEvents of grouped.values()) {
    dayEvents.sort((left, right) =>
      left.startMinutes - right.startMinutes ||
      left.endMinutes - right.endMinutes ||
      left.patientName.localeCompare(right.patientName, "it") ||
      left.id.localeCompare(right.id),
    );
  }
  return grouped;
}

export function calendarMonthEventSlice(
  events: readonly CalendarLabEvent[],
  limit = CALENDAR_MONTH_VISIBLE_EVENT_LIMIT,
) {
  const visible = events.slice(0, Math.max(0, limit));
  return { visible, hiddenCount: Math.max(0, events.length - visible.length) };
}
