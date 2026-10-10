import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  assertAppointmentPatientIntegrity,
  AppointmentPatientIntegrityError,
  isAppointmentPatientForeignKeyError,
} from "./appointment-patient-integrity.ts";
import { buildCalendarV3RecurrencePlan, executeCalendarV3RecurrencePlan } from "./calendar-v3-lab/recurrence-scope.ts";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/034_owner_fk_isolation.sql");

test("DDL contract: owner FKs on all three patient links; validation precedes dropping legacy FKs", () => {
  assert.match(migration, /begin;[\s\S]*commit;\s*$/i);
  for (const table of ["appointments", "goals", "sessions"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table}\\s+add constraint ${table}_patient_owner_fk\\s+foreign key \\(user_id, patient_id\\) references public\\.patients \\(user_id, id\\)\\s+on update no action on delete cascade not valid[;,]`, "i"));
    assert.match(migration, new RegExp(`validate constraint ${table}_patient_owner_fk`, "i"));
    assert.match(migration, new RegExp(`drop constraint ${table}_patient_id_fkey`, "i"));
  }
  assert.ok(migration.lastIndexOf("validate constraint") < migration.indexOf("drop constraint"));
  assert.doesNotMatch(migration, /create\s+(?:or replace\s+)?(?:trigger|policy|function)|\b(?:delete from|truncate|update public\.)/i);
});

test("DDL contract: nullable appointment links preserve session, owner and patient on deletion", () => {
  assert.match(migration, /unique \(user_id, patient_id, id\)/);
  assert.match(migration, /foreign key \(user_id, patient_id, appointment_id\)\s+references public\.appointments \(user_id, patient_id, id\)\s+match simple on update no action on delete set null \(appointment_id\) not valid/);
  assert.doesNotMatch(migration, /on delete set null(?! \(appointment_id\))/i);
  assert.doesNotMatch(migration, /appointment_id\s+set not null|match full/i);
  assert.match(migration, /validate constraint sessions_appointment_owner_patient_fk/);
});

const appointment = (id = "a1", patientId = "p1", position = 0) => ({ id, patientId, date: "2026-10-12", time: "10:00", duration: 45, type: "regular", notes: "", createdAt: "2026-10-01", recurrenceSeriesId: "series", recurrencePosition: position });
const sessions = [{ appointmentId: "a1", patientId: "p1" }];

test("linked sessions allow ordinary edits, cancellation and unrelated/null links", () => {
  assert.doesNotThrow(() => assertAppointmentPatientIntegrity([appointment()], sessions));
  assert.doesNotThrow(() => assertAppointmentPatientIntegrity([{ ...appointment(), type: "cancelled", time: "11:00" }], sessions));
  assert.doesNotThrow(() => assertAppointmentPatientIntegrity([appointment("a2", "p2")], [...sessions, { patientId: "p1" }]));
});

test("patient change on linked appointment rejects entire batch before save; reverting allows retry", () => {
  const changed = appointment("a1", "p2");
  assert.throws(() => assertAppointmentPatientIntegrity([appointment("a2"), changed], sessions), AppointmentPatientIntegrityError);
  assert.doesNotThrow(() => assertAppointmentPatientIntegrity([{ ...changed, patientId: "p1" }], sessions));
});

test("only the new FK's 23503 error maps to the patient feedback (stale-session race)", () => {
  assert.equal(isAppointmentPatientForeignKeyError({ code: "23503", message: 'violates foreign key constraint "sessions_appointment_owner_patient_fk"' }), true);
  assert.equal(isAppointmentPatientForeignKeyError({ code: "23503", message: "another_constraint" }), false);
  assert.equal(isAppointmentPatientForeignKeyError({ code: "42501", message: "sessions_appointment_owner_patient_fk" }), false);
  assert.equal(isAppointmentPatientForeignKeyError(null), false);
});

test("recurrence single scope reports patient error; multi scope keeps registered/cancelled occurrences unchanged", async () => {
  const original = appointment(), changed = { ...original, patientId: "p2" };
  const all = [original, appointment("a2", "p1", 1), { ...appointment("a3", "p1", 2), type: "cancelled" }];
  const input = { appointments: all, sessions, selectedBefore: original, selectedAfter: changed, mutation: "drawer" };
  const single = buildCalendarV3RecurrencePlan({ ...input, scope: "single" });
  const failure = await executeCalendarV3RecurrencePlan(single, async rows => assertAppointmentPatientIntegrity(rows, sessions));
  assert.equal(failure.ok, false);
  assert.match(failure.patientError, /Mantieni il paziente originale/);
  for (const scope of ["following", "entire"]) {
    const plan = buildCalendarV3RecurrencePlan({ ...input, scope });
    assert.deepEqual(plan.appointments.map(row => row.id), ["a2"]);
    assert.equal(plan.appointments[0].patientId, "p2");
    assert.doesNotThrow(() => assertAppointmentPatientIntegrity(plan.appointments, sessions));
  }
});

test("provider guards before remote/state mutations; drawer and recurrence display specific safe feedback", () => {
  const provider = read("components/data-provider.tsx");
  const start = provider.indexOf("const saveAppointments=");
  const end = provider.indexOf("const saveAppointment=", start);
  const save = provider.slice(start, end);
  assert.ok(save.indexOf("assertAppointmentPatientIntegrity") < save.indexOf('client.from("appointments")'));
  assert.ok(save.indexOf("assertAppointmentPatientIntegrity") < save.indexOf("setData"));
  assert.match(save, /isAppointmentPatientForeignKeyError\(e\)/);
  assert.match(read("components/calendar-v3-lab/appointment-drawer.tsx"), /cause instanceof AppointmentPatientIntegrityError \? cause.message/);
  assert.match(read("components/calendar-v3-lab/calendar-lab.tsx"), /result.patientError \?\?/);
});
