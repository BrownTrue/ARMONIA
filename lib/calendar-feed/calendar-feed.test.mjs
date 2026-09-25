import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildCalendarFeed,
  calendarFeedEtag,
  calendarFeedHttpResponse,
  calendarFeedTitle,
  calendarFeedUid,
  calendarFeedWindowStart,
  escapeIcsText,
  foldIcsLine,
} from "./ics.ts";
import {
  createCalendarFeedCredentials,
  decryptCalendarFeedToken,
  encryptCalendarFeedToken,
  generateCalendarFeedToken,
  hashCalendarFeedToken,
  parseCalendarFeedEncryptionKey,
} from "./token.ts";
import { calendarFeedAppointmentsFromRows } from "./rows.ts";

const migration = await readFile(new URL("../../supabase/migrations/013_calendar_feed_subscriptions.sql", import.meta.url), "utf8");
const repository = await readFile(new URL("./repository.ts", import.meta.url), "utf8");
const feedRoute = await readFile(new URL("../../app/calendar/[token]/route.ts", import.meta.url), "utf8");
const managementRoute = await readFile(new URL("../../app/api/calendar-feed/route.ts", import.meta.url), "utf8");
const settingsComponent = await readFile(new URL("../../components/calendar-feed-settings.tsx", import.meta.url), "utf8");
const settingsPage = await readFile(new URL("../../app/impostazioni/page.tsx", import.meta.url), "utf8");
const validEncryptionKey = Buffer.alloc(32, 0x5a).toString("base64url");

const appointment = (overrides = {}) => ({
  id: "5ecad96c-72a4-4496-8f1c-f3caa123cc10",
  startsAt: "2026-03-29T08:00:00.000Z",
  durationMinutes: 45,
  type: "regular",
  updatedAt: "2026-03-20T10:30:00.000Z",
  patientFirstName: "Mario",
  patientLastName: "Rossi",
  ...overrides,
});

test("genera token URL-safe con almeno 32 byte di entropia", () => {
  const token = generateCalendarFeedToken(size => Buffer.alloc(size, 0xab));
  assert.equal(token.length, 43);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
  assert.equal(Buffer.from(token, "base64url").length, 32);
});

test("hash SHA-256 è stabile e non contiene il token", () => {
  const token = "token-segreto-di-test";
  const hash = hashCalendarFeedToken(token);
  assert.equal(hash, hashCalendarFeedToken(token));
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash.includes(token), false);
});

test("cifra e decifra il token con autenticazione AES-GCM", () => {
  const token = "token-calendar-feed";
  const encrypted = encryptCalendarFeedToken(token, validEncryptionKey);
  assert.equal(encrypted.includes(token), false);
  assert.equal(decryptCalendarFeedToken(encrypted, validEncryptionKey), token);
  assert.throws(() => decryptCalendarFeedToken(encrypted, Buffer.alloc(32, 0x6b).toString("base64url")));
});

test("rotazione produce credenziali nuove e invalida il vecchio hash", () => {
  const oldCredentials = createCalendarFeedCredentials(validEncryptionKey, "old-token");
  const newCredentials = createCalendarFeedCredentials(validEncryptionKey, "new-token");
  assert.notEqual(newCredentials.tokenHash, oldCredentials.tokenHash);
  assert.notEqual(newCredentials.tokenEncrypted, oldCredentials.tokenEncrypted);
  assert.equal(hashCalendarFeedToken("old-token") === newCredentials.tokenHash, false);
});

test("accetta esclusivamente una chiave Base64URL canonica da 32 byte", () => {
  assert.deepEqual(parseCalendarFeedEncryptionKey(validEncryptionKey), Buffer.alloc(32, 0x5a));
  assert.throws(() => parseCalendarFeedEncryptionKey(undefined), /Base64URL.*32 byte/);
  assert.throws(() => parseCalendarFeedEncryptionKey(Buffer.alloc(16).toString("base64url")), /Base64URL.*32 byte/);
  assert.throws(() => parseCalendarFeedEncryptionKey("non+base64/url="), /Base64URL.*32 byte/);
  assert.throws(() => parseCalendarFeedEncryptionKey(Buffer.alloc(31).toString("base64url")), /Base64URL.*32 byte/);
  assert.throws(() => parseCalendarFeedEncryptionKey(Buffer.alloc(33).toString("base64url")), /Base64URL.*32 byte/);
});

test("ogni cifratura usa un IV nuovo e i valori manomessi non sono decifrabili", () => {
  const first = encryptCalendarFeedToken("stesso-token", validEncryptionKey);
  const second = encryptCalendarFeedToken("stesso-token", validEncryptionKey);
  assert.notEqual(first, second);
  for (const field of ["iv", "tag", "data"]) {
    const packed = JSON.parse(first);
    const bytes = Buffer.from(packed[field], "base64");
    bytes[0] ^= 0xff;
    packed[field] = bytes.toString("base64");
    assert.throws(() => decryptCalendarFeedToken(JSON.stringify(packed), validEncryptionKey));
  }
});

test("il feed include soltanto pazienti appartenenti al proprietario", () => {
  const row = patientUserId => ({
    id: "appointment-a",
    starts_at: "2026-10-01T08:00:00.000Z",
    duration_minutes: 45,
    type: "regular",
    updated_at: null,
    patients: { first_name: "Mario", last_name: "Rossi", user_id: patientUserId },
  });
  assert.equal(calendarFeedAppointmentsFromRows([row("user-a")], "user-a").length, 1);
  assert.deepEqual(calendarFeedAppointmentsFromRows([row("user-b")], "user-a"), []);
  assert.match(repository, /\.eq\("user_id", userId\)[\s\S]*?\.eq\("patients\.user_id", userId\)/);
});

test("la risposta API di gestione non espone hash o ciphertext", () => {
  const publicValue = managementRoute.match(/const publicValue[\s\S]*?: \{ active: false \};/)?.[0] || "";
  assert.ok(publicValue);
  assert.doesNotMatch(publicValue, /token_hash|token_encrypted/);
  assert.doesNotMatch(managementRoute, /subscription\.(token_hash|token_encrypted)/);
});

test("la UI Calendario ARMONIA usa le API autenticate senza mostrare il link", () => {
  assert.match(settingsComponent, /fetch\("\/api\/calendar-feed", \{ cache: "no-store" \}\)/);
  assert.match(settingsComponent, /request\("POST", \{ titleFormat \}\)/);
  assert.match(settingsComponent, /request\("PATCH", \{ titleFormat: option\.value \}\)/);
  assert.match(settingsComponent, /request\("PATCH", \{ action: "rotate" \}\)/);
  assert.match(settingsComponent, /request\("DELETE"\)/);
  assert.doesNotMatch(settingsComponent, />\s*\{feedUrl\}\s*</);
  assert.doesNotMatch(settingsComponent, /token_hash|token_encrypted/);
});

test("Apple Calendar trasforma il link soltanto durante l'azione", () => {
  assert.match(settingsComponent, /window\.location\.href = feedUrl\.replace\(\/\^https\?:\\\/\\\/\/, "webcal:\/\/"\)/);
  assert.doesNotMatch(settingsComponent, /setWebcal|webcalUrl/);
});

test("modalità locale non interroga il feed e mostra la disponibilità cloud", () => {
  assert.match(settingsComponent, /if \(!cloudAvailable\) return;/);
  assert.match(settingsComponent, /Disponibile nella versione cloud di ARMONIA/);
});

test("Impostazioni raggruppa Google e ARMONIA e offre una spiegazione accessibile", () => {
  assert.match(settingsPage, /aria-labelledby="calendars-title"/);
  assert.match(settingsPage, /<CalendarFeedSettings[\s\S]*?googleConnected=/);
  assert.match(settingsPage, /<Modal title="Come funzionano i calendari\?"/);
  assert.match(settingsComponent, /aria-expanded=\{expanded\}/);
  assert.match(settingsComponent, /aria-controls=\{contentId\}/);
});

test("subscription disabilitate non sono risolte dalla query pubblica", () => {
  assert.match(repository, /\.eq\("token_hash", hashCalendarFeedToken\(token\)\)[\s\S]*?\.eq\("enabled", true\)/);
  assert.match(feedRoute, /if \(!subscription\) return notFound\(\)/);
  assert.doesNotMatch(feedRoute, /console\.(log|error)/);
});

test("migration è additiva, privata e non crea subscription", () => {
  assert.match(migration, /create table if not exists public\.calendar_feed_subscriptions/i);
  assert.match(migration, /user_id uuid primary key references auth\.users\(id\) on delete cascade/i);
  assert.match(migration, /token_hash text not null unique/i);
  assert.match(migration, /token_encrypted text not null/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete[\s\S]*?to service_role/i);
  assert.doesNotMatch(migration, /insert into public\.calendar_feed_subscriptions/i);
  assert.doesNotMatch(migration, /alter table public\.(patients|sessions|clinical_assessments|google_calendar)/i);
});

test("formatta i tre titoli senza includere Logopedia", () => {
  assert.equal(calendarFeedTitle("Mario", "Rossi", "abbreviated"), "Appuntamento · Mario R.");
  assert.equal(calendarFeedTitle("Anna", "De Luca", "abbreviated"), "Appuntamento · Anna D.");
  assert.equal(calendarFeedTitle("Mario", "Rossi", "full"), "Appuntamento · Mario Rossi");
  assert.equal(calendarFeedTitle("Mario", "Rossi", "private"), "Appuntamento ARMONIA");
});

test("escaping ICS gestisce slash, newline, virgola e punto e virgola", () => {
  assert.equal(escapeIcsText("A\\B\nC,D;E"), "A\\\\B\\nC\\,D\\;E");
});

test("line folding rispetta 75 ottetti anche con UTF-8", () => {
  const folded = foldIcsLine(`SUMMARY:${"È molto lungo, ".repeat(12)}`);
  const lines = folded.split("\r\n");
  assert.ok(lines.length > 1);
  assert.ok(lines.every(line => Buffer.byteLength(line, "utf8") <= 75));
  assert.ok(lines.slice(1).every(line => line.startsWith(" ")));
});

test("UID resta stabile quando cambiano orario, durata e paziente", () => {
  const id = appointment().id;
  assert.equal(calendarFeedUid(id), `appointment-${id}@armonia`);
  assert.equal(calendarFeedUid({ ...appointment(), startsAt: "2027-01-01T08:00:00Z" }.id), calendarFeedUid(id));
});

test("feed usa UTC e conserva gli istanti nei cambi di ora Europe/Rome", () => {
  const feed = buildCalendarFeed([
    appointment({ id: "spring", startsAt: "2026-03-29T08:00:00.000Z" }),
    appointment({ id: "autumn", startsAt: "2026-10-25T09:00:00.000Z" }),
  ], "abbreviated");
  assert.match(feed, /DTSTART:20260329T080000Z/);
  assert.match(feed, /DTEND:20260329T084500Z/);
  assert.match(feed, /DTSTART:20261025T090000Z/);
  assert.doesNotMatch(feed, /TZID|VTIMEZONE/);
});

test("finestra parte dalla mezzanotte di Roma di 90 giorni prima", () => {
  assert.equal(calendarFeedWindowStart(new Date("2026-07-01T12:00:00Z")).toISOString(), "2026-04-01T22:00:00.000Z");
});

test("cancelled è escluso e ogni occorrenza resta un VEVENT autonomo", () => {
  const feed = buildCalendarFeed([
    appointment({ id: "one" }),
    appointment({ id: "two", type: "cancelled" }),
    appointment({ id: "three" }),
  ], "private");
  assert.equal((feed.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.doesNotMatch(feed, /appointment-two@armonia/);
  assert.doesNotMatch(feed, /RRULE/);
});

test("feed non contiene dati clinici o campi non necessari", () => {
  const feed = buildCalendarFeed([{ ...appointment(), notes: "dato clinico segreto", diagnosis: "diagnosi" }], "abbreviated");
  assert.doesNotMatch(feed, /dato clinico|diagnosi|DESCRIPTION|LOCATION/i);
  assert.match(feed, /CLASS:PRIVATE\r\nTRANSP:OPAQUE/);
  assert.ok(feed.endsWith("\r\n"));
  const appointmentSelect = repository.match(/\.from\("appointments"\)([\s\S]*?)\.order\("starts_at"/)?.[1] || "";
  assert.match(appointmentSelect, /id,starts_at,duration_minutes,type,updated_at,patients!inner\(first_name,last_name,user_id\)/);
  assert.match(appointmentSelect, /\.eq\("patients\.user_id", userId\)/);
  assert.doesNotMatch(appointmentSelect, /notes|phone|email|diagnosis|assessment|session/i);
});

test("ETag è stabile e If-None-Match produce 304", async () => {
  const content = buildCalendarFeed([appointment()], "private");
  const etag = calendarFeedEtag(content);
  assert.equal(etag, calendarFeedEtag(content));
  const fresh = calendarFeedHttpResponse(content);
  assert.equal(fresh.status, 200);
  assert.equal(fresh.headers.get("content-type"), "text/calendar; charset=utf-8");
  assert.equal(fresh.headers.get("cache-control"), "private, max-age=300, must-revalidate");
  const unchanged = calendarFeedHttpResponse(content, etag);
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");
});
