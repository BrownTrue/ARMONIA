import { addCalendarDays, calendarWeekDays, type CalendarDate } from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";

export type MobileCalendarLabView = "day" | "agenda" | "month";

export function mobileCalendarWeek(date: CalendarDate): CalendarDate[] {
  return calendarWeekDays(date);
}

export function mobileCalendarEventsForDate(
  events: readonly CalendarLabEvent[],
  date: CalendarDate,
): CalendarLabEvent[] {
  return events
    .filter((event) => event.date === date)
    .slice()
    .sort((left, right) =>
      left.startMinutes - right.startMinutes ||
      left.endMinutes - right.endMinutes ||
      left.id.localeCompare(right.id));
}

export function navigateMobileCalendarPeriod(
  view: MobileCalendarLabView,
  date: CalendarDate,
  direction: -1 | 1,
): CalendarDate {
  if (view !== "month") return addCalendarDays(date, direction * 7);
  const source = new Date(`${date}T12:00:00Z`);
  const wantedDay = source.getUTCDate();
  const first = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + direction, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(wantedDay, lastDay)).padStart(2, "0")}` as CalendarDate;
}
