import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("API e feed calendario dichiarano una policy privata no-store", async () => {
  const [config, ics] = await Promise.all([
    read("next.config.ts"),
    read("lib/calendar-feed/ics.ts"),
  ]);

  assert.match(config, /source:\s*"\/api\/:path\*"/);
  assert.match(config, /source:\s*"\/calendar\/:path\*"/);
  assert.match(config, /value:\s*"private, no-store"/);
  assert.match(ics, /"Cache-Control":\s*"private, no-store"/);
  assert.doesNotMatch(ics, /max-age|must-revalidate/);
});

test("le route sensibili non inviano errori grezzi ai log server", async () => {
  const paths = [
    "app/api/google-calendar/callback/route.ts",
    "app/api/google-calendar/disconnect/route.ts",
    "app/api/google-calendar/events/route.ts",
    "app/api/google-calendar/process/route.ts",
    "app/api/materials/[id]/route.ts",
    "lib/google-calendar/server-sync.ts",
  ];

  for (const path of paths) {
    const source = await read(path);
    assert.doesNotMatch(source, /console\.(?:log|info|warn|error)\s*\(/, path);
  }
});

test("la diagnostica server registra soltanto stage, code e retryable", async () => {
  const source = await read("lib/privacy/server-diagnostics.ts");

  assert.match(source, /stage:\s*safeValue/);
  assert.match(source, /code:\s*safeValue/);
  assert.match(source, /retryable:\s*diagnostic\.retryable/);
  assert.doesNotMatch(source, /\.message|JSON\.stringify|request|token|appointmentId|patientId|eventId|storagePath|filename|url/i);
});

test("il warning sui mapping Google duplicati non include identificatori", async () => {
  const source = await read("lib/google-calendar/server-sync.ts");
  const warning = source.slice(source.indexOf('stage: "legacy_event_lookup"') - 120, source.indexOf('stage: "legacy_event_lookup"') + 220);

  assert.match(warning, /duplicate_event_mapping/);
  assert.doesNotMatch(warning, /appointment_id|appointmentId|google_event_id|eventId/);
});
