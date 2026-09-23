import assert from "node:assert/strict";
import test from "node:test";
import { mergeAppointments, removeAppointment } from "./appointments.ts";
import { generateWeeklyDates } from "./recurrence.ts";
import { partitionTodayAppointments } from "./today-dashboard.ts";

test("genera quattro occorrenze settimanali e include la data finale", () => {
  assert.deepEqual(generateWeeklyDates("2026-10-01", "2026-10-22"), [
    "2026-10-01",
    "2026-10-08",
    "2026-10-15",
    "2026-10-22",
  ]);
});

test("attraversa correttamente il cambio mese", () => {
  assert.deepEqual(generateWeeklyDates("2026-10-22", "2026-11-12"), [
    "2026-10-22",
    "2026-10-29",
    "2026-11-05",
    "2026-11-12",
  ]);
});

test("attraversa correttamente il cambio anno", () => {
  assert.deepEqual(generateWeeklyDates("2026-12-24", "2027-01-14"), [
    "2026-12-24",
    "2026-12-31",
    "2027-01-07",
    "2027-01-14",
  ]);
});

test("non include una data finale che non coincide con la ricorrenza", () => {
  assert.deepEqual(generateWeeklyDates("2026-10-01", "2026-10-20"), [
    "2026-10-01",
    "2026-10-08",
    "2026-10-15",
  ]);
});

test("rifiuta una data finale precedente alla data iniziale", () => {
  assert.throws(
    () => generateWeeklyDates("2026-10-08", "2026-10-01"),
    /non può precedere/,
  );
});

const occurrence = (id, date, seriesId = "series-1") => ({
  id,
  patientId: "patient-1",
  date,
  time: "16:00",
  duration: 45,
  type: "regular",
  notes: "",
  recurrenceSeriesId: seriesId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

test("modifica una sola occorrenza mantenendo la serie", () => {
  const first = occurrence("appointment-1", "2026-10-01");
  const second = occurrence("appointment-2", "2026-10-08");
  const result = mergeAppointments([first, second], [{ ...first, time: "17:00" }]);
  assert.equal(result.find((item) => item.id === first.id)?.time, "17:00");
  assert.equal(result.find((item) => item.id === second.id)?.time, "16:00");
  assert.equal(result[0].recurrenceSeriesId, result[1].recurrenceSeriesId);
});

test("elimina una sola occorrenza mantenendo le altre", () => {
  const first = occurrence("appointment-1", "2026-10-01");
  const second = occurrence("appointment-2", "2026-10-08");
  assert.deepEqual(removeAppointment([first, second], first.id), [second]);
});

test("una seduta completa soltanto l'occorrenza collegata", () => {
  const first = occurrence("appointment-1", "2026-10-01");
  const second = occurrence("appointment-2", "2026-10-01");
  const session = {
    id: "session-1",
    patientId: "patient-1",
    appointmentId: first.id,
    date: "2026-10-01",
    duration: 45,
    goalIds: [],
    activities: "Test sintetico",
    response: "",
    helpLevel: "",
    result: "",
    nextPlan: "",
    homework: "",
    notes: "",
    materialIds: [],
    createdAt: "2026-10-01T16:45:00.000Z",
  };
  const result = partitionTodayAppointments([first, second], [session], "2026-10-01");
  assert.deepEqual(result.completed.map((item) => item.id), [first.id]);
  assert.deepEqual(result.pending.map((item) => item.id), [second.id]);
});
