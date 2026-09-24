import "server-only";
import { GOOGLE_CALENDAR_NAME, GOOGLE_CALENDAR_TIME_ZONE, googleOAuthConfig } from "./config";
import { googleTokenStore, type GoogleTokenRecord } from "./token-store";
import { isGoogleDeleteAlreadyAbsent } from "./sync-queue";

const api = "https://www.googleapis.com/calendar/v3";

async function googleRequest<T>(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Google Calendar (${response.status}): ${detail}`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function refresh(userId:string,record: GoogleTokenRecord) {
  const config = googleOAuthConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: record.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Rinnovo autorizzazione Google non riuscito (${response.status})`);
  const value = (await response.json()) as { access_token: string; expires_in: number };
  const next = {
    ...record,
    accessToken: value.access_token,
    expiresAt: Date.now() + value.expires_in * 1000,
  };
  await googleTokenStore.save(userId,next);
  return next;
}

export async function validGoogleToken(userId:string) {
  const record = await googleTokenStore.load(userId);
  if (!record) throw new Error("Google Calendar non collegato");
  return record.expiresAt > Date.now() + 60_000 ? record : refresh(userId,record);
}

export async function ensureArmoniaCalendar(userId:string,record: GoogleTokenRecord) {
  if (record.calendarId) return record;
  const calendar = await googleRequest<{ id: string }>(`${api}/calendars`, record.accessToken, {
    method: "POST",
    body: JSON.stringify({ summary: GOOGLE_CALENDAR_NAME, timeZone: GOOGLE_CALENDAR_TIME_ZONE }),
  });
  const next = { ...record, calendarId: calendar.id };
  await googleTokenStore.save(userId,next);
  return next;
}

export async function upsertGoogleEvent(userId:string,input: {
  appointmentId: string;
  eventId?: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  reminderMinutes: number;
}) {
  const record = await ensureArmoniaCalendar(userId,await validGoogleToken(userId));
  const [year, month, day] = input.date.split("-").map(Number);
  const [hours, minutes] = input.time.split(":").map(Number);
  const end = new Date(Date.UTC(year, month - 1, day, hours, minutes + input.duration));
  const endDate = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
  const endTime = `${String(end.getUTCHours()).padStart(2, "0")}:${String(end.getUTCMinutes()).padStart(2, "0")}`;
  const event = {
    summary: input.title,
    description: "",
    start: { dateTime: `${input.date}T${input.time}:00`, timeZone: GOOGLE_CALENDAR_TIME_ZONE },
    end: { dateTime: `${endDate}T${endTime}:00`, timeZone: GOOGLE_CALENDAR_TIME_ZONE },
    visibility: "private",
    transparency: "opaque",
    attendees: [],
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: input.reminderMinutes }],
    },
    extendedProperties: { private: { armoniaAppointmentId: input.appointmentId } },
  };
  const base = `${api}/calendars/${encodeURIComponent(record.calendarId!)}/events`;
  try {
    return await googleRequest<{ id: string }>(input.eventId ? `${base}/${encodeURIComponent(input.eventId)}` : base, record.accessToken, {
      method: input.eventId ? "PATCH" : "POST",
      body: JSON.stringify(event),
    });
  } catch (error) {
    if (input.eventId && (error as { status?: number }).status === 404) {
      return googleRequest<{ id: string }>(base, record.accessToken, { method: "POST", body: JSON.stringify(event) });
    }
    throw error;
  }
}

export async function deleteGoogleEvent(userId:string,eventId: string) {
  const record = await ensureArmoniaCalendar(userId,await validGoogleToken(userId));
  try {
    await googleRequest<void>(`${api}/calendars/${encodeURIComponent(record.calendarId!)}/events/${encodeURIComponent(eventId)}`, record.accessToken, { method: "DELETE" });
  } catch (error) {
    if (!isGoogleDeleteAlreadyAbsent(error)) throw error;
  }
}
