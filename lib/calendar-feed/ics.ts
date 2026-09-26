import { createHash } from "node:crypto";

export type CalendarFeedTitleFormat = "abbreviated" | "full" | "private";

export type CalendarFeedAppointment = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  type: string;
  updatedAt: string;
  patientFirstName: string;
  patientLastName: string;
};

const ROME_TIME_ZONE = "Europe/Rome";

const dateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value || "0");
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour"), minute: part("minute"), second: part("second") };
};

function zonedDateTimeToUtc(value: { year: number; month: number; day: number; hour: number; minute: number; second: number }, timeZone: string) {
  const target = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = dateParts(new Date(candidate), timeZone);
    const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second);
    candidate += target - shownAsUtc;
  }
  return new Date(candidate);
}

export function calendarFeedWindowStart(now = new Date()) {
  const today = dateParts(now, ROME_TIME_ZONE);
  const localDate = new Date(Date.UTC(today.year, today.month - 1, today.day));
  localDate.setUTCDate(localDate.getUTCDate() - 90);
  return zonedDateTimeToUtc({
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth() + 1,
    day: localDate.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  }, ROME_TIME_ZONE);
}

export function calendarFeedTitle(firstName: string, lastName: string, format: CalendarFeedTitleFormat) {
  const first = firstName.trim();
  const last = lastName.trim();
  if (format === "private") return "Appuntamento ARMONIA";
  if (format === "full") return `Appuntamento · ${first} ${last}`.trim();
  return `Appuntamento · ${first}${last ? ` ${last[0].toLocaleUpperCase("it-IT")}.` : ""}`;
}

export function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export function foldIcsLine(line: string) {
  const folded: string[] = [];
  let current = "";
  let limit = 75;
  for (const character of line) {
    const candidate = current + character;
    if (Buffer.byteLength(candidate, "utf8") > limit && current) {
      folded.push(current);
      current = ` ${character}`;
      limit = 75;
    } else current = candidate;
  }
  folded.push(current);
  return folded.join("\r\n");
}

export function formatIcsUtc(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Data calendario non valida");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function calendarFeedUid(appointmentId: string) {
  return `appointment-${appointmentId}@armonia`;
}

export function buildCalendarFeed(appointments: CalendarFeedAppointment[], titleFormat: CalendarFeedTitleFormat) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Armonia//Calendario professionale//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Armonia",
  ];
  for (const appointment of appointments) {
    if (appointment.type === "cancelled") continue;
    const start = new Date(appointment.startsAt);
    const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
    const updated = formatIcsUtc(appointment.updatedAt);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${calendarFeedUid(appointment.id)}`,
      `DTSTAMP:${updated}`,
      `LAST-MODIFIED:${updated}`,
      `DTSTART:${formatIcsUtc(start)}`,
      `DTEND:${formatIcsUtc(end)}`,
      `SUMMARY:${escapeIcsText(calendarFeedTitle(appointment.patientFirstName, appointment.patientLastName, titleFormat))}`,
      "CLASS:PRIVATE",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function calendarFeedEtag(content: string) {
  return `"${createHash("sha256").update(content, "utf8").digest("base64url")}"`;
}

export function calendarFeedHttpResponse(content: string, ifNoneMatch?: string | null) {
  const etag = calendarFeedEtag(content);
  const headers = {
    "Cache-Control": "private, no-store",
    "Content-Disposition": 'inline; filename="armonia.ics"',
    "Content-Type": "text/calendar; charset=utf-8",
    ETag: etag,
    "Referrer-Policy": "no-referrer",
  };
  const matches = ifNoneMatch?.split(",").some(value => value.trim().replace(/^W\//, "") === etag) ?? false;
  return matches ? new Response(null, { status: 304, headers }) : new Response(content, { status: 200, headers });
}
