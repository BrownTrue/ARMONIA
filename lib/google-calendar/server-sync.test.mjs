import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  classifyGoogleSyncFailure,
  deterministicGoogleEventId,
  googleServerSyncConfiguration,
  googleSyncRetryDelayMs,
  runIfGoogleServerSyncEnabled,
} from "./server-sync-policy.ts";

const migrationUrl = new URL("../../supabase/migrations/011_google_calendar_server_outbox.sql", import.meta.url);
const migration = await readFile(migrationUrl, "utf8");
const legacyRoute = await readFile(new URL("../../app/api/google-calendar/events/route.ts", import.meta.url), "utf8");
const dataProvider = await readFile(new URL("../../components/data-provider.tsx", import.meta.url), "utf8");

test("migration 011 aggiunge soltanto infrastruttura outbox Google", () => {
  for (const field of [
    "operation_version bigint not null default 1",
    "next_attempt_at timestamptz",
    "last_attempt_at timestamptz",
    "lease_token uuid",
    "lease_expires_at timestamptz",
    "last_error_code text",
    "is_retryable boolean not null default true",
  ]) assert.match(migration, new RegExp(field));
  assert.doesNotMatch(migration, /drop table|truncate|alter table public\.(patients|sessions|goals|materials|clinical_)/i);
});

test("migration 011 è passiva e non attiva trigger sugli appointments", () => {
  assert.doesNotMatch(migration, /create\s+trigger/i);
  assert.doesNotMatch(migration, /enqueue_google_calendar_appointment_change/i);
  assert.doesNotMatch(migration, /\b(insert|update|delete)\s+on\s+public\.appointments/i);
});

test("claim usa SKIP LOCKED, lease e filtro utente", () => {
  assert.match(migration, /for update of link skip locked/i);
  assert.match(migration, /lease_token = p_lease_token/i);
  assert.match(migration, /lease_expires_at = now\(\) \+ make_interval/i);
  assert.match(migration, /p_user_id is null or link\.user_id = p_user_id/i);
});

test("lease scaduti sono nuovamente reclamabili", () => {
  assert.match(migration, /sync_status = 'syncing'[\s\S]*?lease_expires_at[\s\S]*?<= now\(\)/i);
});

test("complete stale non può marcare synced una versione più recente", () => {
  assert.match(migration, /when link\.operation_version = p_operation_version then 'synced'[\s\S]*?else 'pending'/i);
  assert.match(migration, /link\.lease_token = p_lease_token/i);
});

test("remove link richiede delete, versione e lease correnti", () => {
  const removeBranch = migration.match(/if p_remove_link then([\s\S]*?)if found then return true; end if;/i)?.[1];
  assert.ok(removeBranch);
  assert.match(removeBranch, /link\.desired_action = 'delete'/i);
  assert.match(removeBranch, /link\.operation_version = p_operation_version/i);
  assert.match(removeBranch, /link\.lease_token = p_lease_token/i);

  const removable = (row, request) =>
    row.desiredAction === "delete" &&
    row.operationVersion === request.operationVersion &&
    row.leaseToken === request.leaseToken;
  const request = { operationVersion: 4, leaseToken: "lease-current" };
  assert.equal(removable({ desiredAction: "delete", operationVersion: 4, leaseToken: "lease-current" }, request), true);
  assert.equal(removable({ desiredAction: "upsert", operationVersion: 4, leaseToken: "lease-current" }, request), false);
  assert.equal(removable({ desiredAction: "delete", operationVersion: 3, leaseToken: "lease-current" }, request), false);
});

test("primitive outbox restano revocate ai ruoli browser", () => {
  assert.match(migration, /revoke all on function public\.claim_google_calendar_sync_batch[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.claim_google_calendar_sync_batch[\s\S]*?to service_role/i);
});

test("feature flag OFF non esegue il processore", async () => {
  let called = false;
  const result = await runIfGoogleServerSyncEnabled({}, async () => { called = true; });
  assert.deepEqual(result, { enabled: false });
  assert.equal(called, false);
});

test("flag senza singolo account di test resta disabilitata", () => {
  assert.deepEqual(googleServerSyncConfiguration({ GOOGLE_CALENDAR_SERVER_SYNC_ENABLED: "true" }), {
    enabled: false,
    testUserId: undefined,
  });
});

test("flag e account di test abilitano soltanto il blocco dormiente", () => {
  assert.deepEqual(googleServerSyncConfiguration({
    GOOGLE_CALENDAR_SERVER_SYNC_ENABLED: "true",
    GOOGLE_CALENDAR_SERVER_SYNC_TEST_USER_ID: "test-user",
  }), { enabled: true, testUserId: "test-user" });
});

test("ID Google deterministico è stabile e usa solo base32hex", () => {
  const input = { namespace: "test", userId: "user-1", appointmentId: "appointment-1" };
  const first = deterministicGoogleEventId(input);
  assert.equal(first, deterministicGoogleEventId(input));
  assert.match(first, /^[a-v0-9]{5,1024}$/);
  assert.notEqual(first, deterministicGoogleEventId({ ...input, appointmentId: "appointment-2" }));
});

test("backoff è limitato a dieci livelli", () => {
  assert.equal(googleSyncRetryDelayMs(1), 60_000);
  assert.equal(googleSyncRetryDelayMs(10), 86_400_000);
  assert.equal(googleSyncRetryDelayMs(99), 86_400_000);
});

test("classificazione distingue rate limit e autorizzazione", () => {
  const rateLimit = Object.assign(new Error("usageLimits quota"), { status: 403 });
  const unauthorized = Object.assign(new Error("unauthorized"), { status: 401 });
  assert.equal(classifyGoogleSyncFailure(rateLimit).retryable, true);
  assert.equal(classifyGoogleSyncFailure(unauthorized).retryable, false);
});

test("il sistema legacy non viene rimosso dalla migration", () => {
  assert.doesNotMatch(migration, /armonia-google-calendar-queue-v1|client-sync|queue-lock/i);
});

test("documenta il race legacy che giustifica il rinvio dei trigger", () => {
  const finalLegacyWrite = legacyRoute.match(/update\(\{google_event_id:event\.id,sync_status:"synced"([\s\S]*?)\.eq\("appointment_id",payload\.appointmentId\)/)?.[0];
  assert.ok(finalLegacyWrite);
  assert.doesNotMatch(finalLegacyWrite, /operation_version|lease_token/);
});

test("la route legacy continua a chiudere upsert e delete sull'event link", () => {
  assert.match(legacyRoute, /sync_status:"syncing"/);
  assert.match(legacyRoute, /google_event_id:event\.id,sync_status:"synced"/);
  assert.match(legacyRoute, /removeLinkedGoogleEvent/);
  assert.match(legacyRoute, /from\("google_calendar_event_links"\)\.delete\(\)/);
});

test("create update delete e ricorrenze continuano ad accodare il legacy browser", () => {
  assert.match(dataProvider, /appointments\.forEach\(appointment=>[\s\S]*?queueGoogleUpsert/);
  assert.match(dataProvider, /const saveAppointment=async\(a:Appointment\)=>saveAppointments\(\[a\]\)/);
  assert.match(dataProvider, /const deleteAppointment=async\(id:string\)=>\{queueGoogleDelete\(id\)/);
});
