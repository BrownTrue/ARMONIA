import { addCalendarDays, calendarWeekDays, type CalendarDate } from "./date-time.ts";
import type { CalendarLabEvent } from "./fixtures.ts";
import { calendarMonthDays } from "./month-view.ts";

export type CalendarLabView = "day" | "week" | "month";

export function calendarLabVisibleDates(view: CalendarLabView, cursorDate: CalendarDate): CalendarDate[] {
  if (view === "day") return [cursorDate];
  if (view === "month") return calendarMonthDays(cursorDate);
  return calendarWeekDays(cursorDate);
}

export function navigateCalendarLabDate(
  view: CalendarLabView,
  cursorDate: CalendarDate,
  direction: -1 | 1,
): CalendarDate {
  if (view === "month") return addCalendarMonths(cursorDate, direction);
  return addCalendarDays(cursorDate, direction * (view === "day" ? 1 : 7));
}

export function calendarLabPeriodLabel(view: CalendarLabView, cursorDate: CalendarDate): string {
  if (view === "day") {
    return capitalize(new Intl.DateTimeFormat("it-IT", {
      weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
    }).format(toUtcDate(cursorDate)));
  }
  if (view === "month") {
    return capitalize(new Intl.DateTimeFormat("it-IT", {
      month: "long", year: "numeric", timeZone: "UTC",
    }).format(toUtcDate(cursorDate)));
  }
  const days = calendarWeekDays(cursorDate);
  const firstDay = Number(days[0].slice(8));
  const lastDay = Number(days[6].slice(8));
  const firstMonth = Number(days[0].slice(5, 7));
  const lastMonth = Number(days[6].slice(5, 7));
  const year = days[6].slice(0, 4);
  const monthFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "UTC" });
  if (firstMonth === lastMonth) return `${firstDay} – ${lastDay} ${monthFormatter.format(toUtcDate(days[6]))} ${year}`;
  return `${firstDay} ${monthFormatter.format(toUtcDate(days[0]))} – ${lastDay} ${monthFormatter.format(toUtcDate(days[6]))} ${year}`;
}

export function calendarLabDaySummary(events: readonly CalendarLabEvent[], date: CalendarDate) {
  const dayEvents = events.filter((event) => event.date === date);
  return {
    appointmentCount: dayEvents.length,
    occupiedMinutes: dayEvents.reduce((total, event) => total + event.endMinutes - event.startMinutes, 0),
  };
}

function addCalendarMonths(date: CalendarDate, amount: number): CalendarDate {
  const source = toUtcDate(date);
  const wantedDay = source.getUTCDate();
  const targetFirst = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + amount, 1));
  const lastDay = new Date(Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth() + 1, 0)).getUTCDate();
  return formatCalendarDate(new Date(Date.UTC(
    targetFirst.getUTCFullYear(),
    targetFirst.getUTCMonth(),
    Math.min(wantedDay, lastDay),
  )));
}

function toUtcDate(date: CalendarDate): Date {
  return new Date(`${date}T12:00:00Z`);
}

function formatCalendarDate(date: Date): CalendarDate {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}` as CalendarDate;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("it") + value.slice(1);
}
