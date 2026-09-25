import type { GoogleNameFormat } from "./token-store";

export function googleEventTitle(first: string, last: string, format: GoogleNameFormat) {
  if (format === "full") return `Logopedia · ${first} ${last}`.trim();
  if (format === "initials") {
    return `Logopedia · ${(first[0] || "").toUpperCase()}.${last ? ` ${(last[0] || "").toUpperCase()}.` : ""}`;
  }
  return `Logopedia · ${first}${last ? ` ${(last[0] || "").toUpperCase()}.` : ""}`;
}

export function romeAppointmentDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

