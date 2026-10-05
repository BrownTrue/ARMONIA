import assert from "node:assert/strict";
import test from "node:test";
import { buildPatientTimeline } from "./clinical/timeline.ts";
import { buildMobilePatientActivity, filterMobilePatientActivity, groupMobilePatientActivity } from "./patient-mobile-activity.ts";

const patientId = "patient-1";
const createdAt = "2026-10-01T08:00:00.000Z";
const appointment = (id, date, time, overrides = {}) => ({ id, patientId, date, time, duration: 45, type: "regular", notes: "", serviceNameSnapshot: "Trattamento", locationNameSnapshot: "Studio", createdAt, ...overrides });
const session = (overrides = {}) => ({ id: "session-1", patientId, appointmentId: "linked", date: "2026-10-04", duration: 45, serviceNameSnapshot: "Trattamento", goalIds: [], activities: "Denominazione", response: "", helpLevel: "", result: "Buona risposta", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt, ...overrides });
const now = new Date("2026-10-05T10:00:00.000Z"); // 12:00 Europe/Rome

test("proietta Session e Appointment senza duplicare quello già registrato", () => {
  const appointments = [appointment("linked", "2026-10-04", "09:00"), appointment("pending", "2026-10-05", "09:00")];
  const sessions = [session()];
  const timeline = buildPatientTimeline(patientId, sessions, [], [], [], appointments);
  const items = buildMobilePatientActivity(patientId, timeline, appointments, sessions, now);
  assert.deepEqual(items.map((item) => item.id).sort(), ["appointment:pending", "session:session-1"]);
  assert.equal(items.find((item) => item.kind === "session")?.time, "09:00");
});

test("distingue Appointment da registrare, futuro e annullato", () => {
  const appointments = [
    appointment("pending", "2026-10-05", "09:00"),
    appointment("future", "2026-10-05", "15:00"),
    appointment("cancelled", "2026-10-06", "10:00", { type: "cancelled" }),
  ];
  const items = buildMobilePatientActivity(patientId, [], appointments, [], now);
  assert.equal(items.find((item) => item.id === "appointment:pending")?.state, "pending");
  assert.equal(items.find((item) => item.id === "appointment:future")?.state, "future");
  assert.equal(items.find((item) => item.id === "appointment:cancelled")?.state, "cancelled");
});

test("mantiene le valutazioni reali nella cronologia mobile", () => {
  const assessment = { id: "assessment-1", patientId, clinicalPathwayId: "path", assessmentType: "initial", status: "completed", schemaVersion: 2, clinicalDate: "2026-10-03", data: { modules: [] }, createdAt, updatedAt: createdAt };
  const timeline = buildPatientTimeline(patientId, [], [assessment]);
  const items = buildMobilePatientActivity(patientId, timeline, [], [], now);
  assert.equal(items[0].kind, "assessment");
});

test("filtro Sedute include il workflow Appointment mentre Valutazioni resta separato", () => {
  const assessment = { id: "assessment-1", patientId, clinicalPathwayId: "path", assessmentType: "initial", status: "completed", schemaVersion: 2, clinicalDate: "2026-10-03", data: { modules: [] }, createdAt, updatedAt: createdAt };
  const timeline = buildPatientTimeline(patientId, [session({ appointmentId: undefined })], [assessment]);
  const items = buildMobilePatientActivity(patientId, timeline, [appointment("pending", "2026-10-05", "09:00")], [session({ appointmentId: undefined })], now);
  assert.deepEqual(filterMobilePatientActivity(items, "sessions").map((item) => item.kind).sort(), ["appointment", "session"]);
  assert.deepEqual(filterMobilePatientActivity(items, "assessments").map((item) => item.kind), ["assessment"]);
  assert.equal(filterMobilePatientActivity(items, "all", "studio")[0].kind, "appointment");
});

test("raggruppa in Oggi, Ieri e date precedenti", () => {
  const appointments = [appointment("today", "2026-10-05", "09:00"), appointment("yesterday", "2026-10-04", "09:00"), appointment("older", "2026-09-30", "09:00")];
  const groups = groupMobilePatientActivity(buildMobilePatientActivity(patientId, [], appointments, [], now), now);
  assert.deepEqual(groups.map((group) => group.label), ["Oggi", "Ieri", "30 settembre"]);
});

test("derivazione e filtri non mutano gli input", () => {
  const appointments = [appointment("pending", "2026-10-05", "09:00")];
  const sessions = [session({ appointmentId: undefined })];
  const before = structuredClone({ appointments, sessions });
  const items = buildMobilePatientActivity(patientId, buildPatientTimeline(patientId, sessions, []), appointments, sessions, now);
  filterMobilePatientActivity(items, "all", "trattamento");
  assert.deepEqual({ appointments, sessions }, before);
});
