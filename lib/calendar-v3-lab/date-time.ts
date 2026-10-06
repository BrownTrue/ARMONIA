export const CALENDAR_TIME_ZONE = "Europe/Rome" as const;

export type CalendarDate = `${number}-${number}-${number}`;

export type CalendarTimeRange = {
  startMinutes: number;
  endMinutes: number;
};

export const CALENDAR_LAB_CONFIG = Object.freeze({
  timeZone: CALENDAR_TIME_ZONE,
  startHour: 7,
  endHour: 21,
  slotMinutes: 15,
});

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function calendarDateParts(date: CalendarDate) {
  const match = DATE_PATTERN.exec(date);
  if (!match) throw new Error("invalid_calendar_date");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new Error("invalid_calendar_date");
  }
  return { year, month, day };
}

function toCalendarDate(year: number, month: number, day: number): CalendarDate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as CalendarDate;
}

export function calendarDateFromInstant(
  instant: Date | string | number,
  timeZone: string = CALENDAR_TIME_ZONE,
): CalendarDate {
  const value = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(value.getTime())) throw new Error("invalid_instant");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}` as CalendarDate;
}

export function calendarTimeFromInstant(
  instant: Date | string | number,
  timeZone: string = CALENDAR_TIME_ZONE,
): string {
  const value = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(value.getTime())) throw new Error("invalid_instant");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("hour")}:${part("minute")}`;
}

export function timeToMinutes(time: string): number {
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new Error("invalid_calendar_time");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("invalid_calendar_time");
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 24 * 60) {
    throw new Error("invalid_calendar_minutes");
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function addMinutes(time: string, amount: number): string {
  return minutesToTime(timeToMinutes(time) + amount);
}

export function timeRange(startTime: string, durationMinutes: number): CalendarTimeRange {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    throw new Error("invalid_calendar_duration");
  }
  const startMinutes = timeToMinutes(startTime);
  return { startMinutes, endMinutes: startMinutes + durationMinutes };
}

export function addCalendarDays(date: CalendarDate, amount: number): CalendarDate {
  const { year, month, day } = calendarDateParts(date);
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return toCalendarDate(result.getUTCFullYear(), result.getUTCMonth() + 1, result.getUTCDate());
}

export function calendarDayOfWeek(date: CalendarDate): number {
  const { year, month, day } = calendarDateParts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function startOfCalendarWeek(date: CalendarDate): CalendarDate {
  const day = calendarDayOfWeek(date);
  return addCalendarDays(date, -(day === 0 ? 6 : day - 1));
}

export function calendarWeekDays(date: CalendarDate): CalendarDate[] {
  const monday = startOfCalendarWeek(date);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(monday, index));
}

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
  calendarDateParts(left);
  calendarDateParts(right);
  return left === right ? 0 : left < right ? -1 : 1;
}

export function clampMinute(
  minute: number,
  config = CALENDAR_LAB_CONFIG,
): number {
  return Math.min(config.endHour * 60, Math.max(config.startHour * 60, minute));
}

export function snapMinute(
  minute: number,
  config = CALENDAR_LAB_CONFIG,
): number {
  return clampMinute(Math.round(minute / config.slotMinutes) * config.slotMinutes, config);
}

export function minuteToY(
  minute: number,
  pixelsPerMinute: number,
  config = CALENDAR_LAB_CONFIG,
): number {
  return (clampMinute(minute, config) - config.startHour * 60) * pixelsPerMinute;
}

export function yToSnappedMinute(
  y: number,
  pixelsPerMinute: number,
  config = CALENDAR_LAB_CONFIG,
): number {
  if (!(pixelsPerMinute > 0)) throw new Error("invalid_pixels_per_minute");
  return snapMinute(config.startHour * 60 + Math.max(0, y) / pixelsPerMinute, config);
}

export function getInitialScrollMinute(
  visibleWeek: CalendarDate[],
  now: Date | string | number,
  config = CALENDAR_LAB_CONFIG,
): number {
  const today = calendarDateFromInstant(now, config.timeZone);
  const currentMinute = timeToMinutes(calendarTimeFromInstant(now, config.timeZone));
  if (
    visibleWeek.includes(today) &&
    currentMinute >= config.startHour * 60 &&
    currentMinute <= config.endHour * 60
  ) {
    return clampMinute(currentMinute - 60, config);
  }
  return clampMinute(8 * 60, config);
}
