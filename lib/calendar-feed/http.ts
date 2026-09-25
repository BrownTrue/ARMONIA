import type { CalendarFeedTitleFormat } from "./ics";

export const calendarFeedTitleFormats: CalendarFeedTitleFormat[] = ["abbreviated", "full", "private"];

export function isCalendarFeedTitleFormat(value: unknown): value is CalendarFeedTitleFormat {
  return typeof value === "string" && calendarFeedTitleFormats.includes(value as CalendarFeedTitleFormat);
}

export function calendarFeedUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/calendar/${token}.ics`;
}

export function isCalendarFeedTokenPath(value: string) {
  return /^[A-Za-z0-9_-]{43}\.ics$/.test(value);
}

