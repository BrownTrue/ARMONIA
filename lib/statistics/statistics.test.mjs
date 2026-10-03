import assert from "node:assert/strict";
import test from "node:test";
import { activitySeries, appointmentStatistics, coreStatistics, economyStatistics, patientStatistics, serviceStatistics } from "./metrics.ts";
import { romeToday, statisticsPeriod } from "./periods.ts";

const dataset = (overrides = {}) => ({
  sessions: [], appointments: [], patients: [], payments: [], services: [], ...overrides,
});
const session = (id, date, overrides = {}) => ({ id, patientId: "p1", date, duration: 60, ...overrides });
const appointment = (id, date, time, overrides = {}) => ({ id, date, time, duration: 60, type: "regular", ...overrides });

test("costruisce mese corrente month-to-date e mese scorso", () => {
  assert.deepEqual(statisticsPeriod("current_month", "2026-10-03"), { preset: "current_month", from: "2026-10-01", to: "2026-10-03", granularity: "day", label: "1 ott 2026 – 3 ott 2026" });
  const previous = statisticsPeriod("previous_month", "2026-10-03");
  assert.equal(previous.from, "2026-09-01");
  assert.equal(previous.to, "2026-09-30");
});

test("costruisce anno e custom ordinato, limitato a oggi", () => {
  assert.equal(statisticsPeriod("current_year", "2026-10-03").from, "2026-01-01");
  const custom = statisticsPeriod("custom", "2026-10-03", { from: "2026-12-01", to: "2026-09-01" });
  assert.equal(custom.from, "2026-09-01");
  assert.equal(custom.to, "2026-10-03");
});

test("Europe/Rome determina il giorno anche vicino alla mezzanotte UTC", () => {
  assert.equal(romeToday(new Date("2026-03-28T23:30:00.000Z")), "2026-03-29");
});

test("KPI escludono sessioni future e calcolano distinti, ore e frequenza", () => {
  const period = statisticsPeriod("current_month", "2026-10-03");
  const data = dataset({ sessions: [session("s1", "2026-10-01"), session("s2", "2026-10-01", { patientId: "p2", duration: 30 }), session("future", "2026-10-04")] });
  const core = coreStatistics(data, period, "2026-10-03");
  assert.deepEqual([core.sessionCount, core.minutes, core.patientCount, core.workDays, core.averageFrequency], [2, 90, 2, 1, 1]);
});

test("frequenza senza pazienti usa valore assente", () => {
  assert.equal(patientStatistics(dataset(), statisticsPeriod("current_month", "2026-10-03"), "2026-10-03").averageFrequency, undefined);
});

test("Agenda distingue registrati, annullati, conclusi da registrare e manuali", () => {
  const period = statisticsPeriod("current_month", "2026-10-03");
  const data = dataset({ appointments: [appointment("done", "2026-10-01", "10:00"), appointment("missing", "2026-10-02", "10:00"), appointment("cancelled", "2026-10-02", "11:00", { type: "cancelled" }), appointment("future", "2026-10-04", "10:00")], sessions: [session("linked", "2026-10-01", { appointmentId: "done" }), session("manual", "2026-10-02")] });
  assert.deepEqual(appointmentStatistics(data, period, new Date("2026-10-03T12:00:00Z")), { registered: 1, cancelled: 1, toRegister: 1, manualSessions: 1 });
});

test("Prestazioni preferiscono snapshot e usano catalogo e fallback", () => {
  const period = statisticsPeriod("current_month", "2026-10-03");
  const rows = serviceStatistics(dataset({ services: [{ id: "svc", name: "Catalogo" }], sessions: [session("1", "2026-10-01", { serviceId: "svc", serviceNameSnapshot: "Snapshot" }), session("2", "2026-10-02", { serviceId: "svc" }), session("3", "2026-10-03")] }), period, "2026-10-03");
  assert.deepEqual(rows.map((row) => row.name).sort(), ["Catalogo", "Prestazione non specificata", "Snapshot"]);
});

test("Valore erogato e incassato restano metriche distinte", () => {
  const period = statisticsPeriod("current_month", "2026-10-03");
  const result = economyStatistics(dataset({ sessions: [session("1", "2026-10-01", { effectivePriceCents: 7000 })], payments: [{ id: "pay", amountCents: 3000, paidAt: "2026-10-02", status: "active" }] }), period, "2026-10-03");
  assert.deepEqual(result, { deliveredCents: 7000, receivedCents: 3000 });
});

test("serie attività usa granularità mensile e non include future", () => {
  const period = statisticsPeriod("current_year", "2026-10-03");
  const series = activitySeries(dataset({ sessions: [session("1", "2026-01-02"), session("future", "2026-11-01")] }), period, "2026-10-03");
  assert.equal(series.length, 10);
  assert.equal(series.reduce((sum, point) => sum + point.sessions, 0), 1);
});
