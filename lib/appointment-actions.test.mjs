import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cancelAppointment, canRegisterAppointmentSession, sessionForAppointment } from "./appointment-actions.ts";

const calendarPage = fs.readFileSync(new URL("../app/calendario/page.tsx", import.meta.url), "utf8");
const newSessionPage = fs.readFileSync(new URL("../app/sedute/nuova/page.tsx", import.meta.url), "utf8");
const dataProvider = fs.readFileSync(new URL("../components/data-provider.tsx", import.meta.url), "utf8");

const appointment = { id:"a1", patientId:"p1", date:"2026-10-03", time:"09:30", duration:45, type:"regular", notes:"", serviceId:"service-1", serviceNameSnapshot:"Seduta", effectivePriceCents:4500, recurrenceSeriesId:"series-1", recurrencePosition:2, createdAt:"2026-10-01T08:00:00Z" };
const session = { id:"s1", patientId:"p1", appointmentId:"a1", date:"2026-10-03", duration:45, goalIds:[], activities:"", response:"", helpLevel:"", result:"", nextPlan:"", homework:"", notes:"", materialIds:[], createdAt:"2026-10-03T10:30:00Z" };

test("un appuntamento esistente senza seduta può aprire Registra seduta", () => {
  assert.equal(canRegisterAppointmentSession(appointment, []), true);
});

test("la relazione appointmentId impedisce una seconda seduta", () => {
  assert.equal(sessionForAppointment("a1", [session])?.id, "s1");
  assert.equal(canRegisterAppointmentSession(appointment, [session]), false);
});

test("il salvataggio Session cloud aggiorna lo stato condiviso solo dopo le scritture remote", () => {
  const block = dataProvider.match(/const saveSession=async[\s\S]*?const deleteSession=/)?.[0] || "";
  assert.ok(block.indexOf('from("sessions").upsert') >= 0);
  assert.ok(block.indexOf('from("sessions").upsert') < block.indexOf("setData"));
});

test("annullare conserva l'appuntamento e tutti i suoi snapshot", () => {
  const cancelled = cancelAppointment(appointment);
  assert.equal(cancelled.type, "cancelled");
  assert.equal(cancelled.id, appointment.id);
  assert.equal(cancelled.serviceNameSnapshot, "Seduta");
  assert.equal(cancelled.effectivePriceCents, 4500);
  assert.equal(cancelled.recurrenceSeriesId, "series-1");
  assert.equal(cancelled.recurrencePosition, 2);
  assert.equal(canRegisterAppointmentSession(cancelled, []), false);
});

test("l'Agenda apre le azioni e riusa il collegamento appointment della nuova seduta", () => {
  assert.match(calendarPage, /href=\{`\/sedute\/nuova\?a=\$\{editor\.appointment\.id\}`\}/);
  assert.match(calendarPage, /href=\{`\/sedute\/nuova\?a=\$\{a\.id\}`\}/);
  assert.match(calendarPage, /Azioni appuntamento/);
  assert.doesNotMatch(calendarPage, /Eliminare questo appuntamento\?/);
});

test("l'Agenda mostra inline stato seduta e annullamento senza query aggiuntive", () => {
  assert.match(calendarPage, /sessionsByAppointmentId = useMemo/);
  assert.match(calendarPage, /sessionsByAppointmentId\.has\(a\.id\)/);
  assert.match(calendarPage, /✓ Seduta registrata/);
  assert.match(calendarPage, />Annullato<\/span>/);
  assert.match(calendarPage, /a\.type === "cancelled"[\s\S]*?Seduta registrata[\s\S]*?Registra seduta/);
});

test("la scorciatoia inline è confinata ad Agenda e Mese e Settimana restano sui componenti esistenti", () => {
  assert.match(calendarPage, /<CalendarMonthView/);
  assert.match(calendarPage, /<CalendarWeekView/);
  assert.equal((calendarPage.match(/sessionsByAppointmentId/g) || []).length, 2);
});

test("l'annullamento usa conferma dedicata e il legacy Google accoda una delete", () => {
  assert.match(calendarPage, /Annullare questo appuntamento\?/);
  assert.match(calendarPage, /Sei sicuro di voler annullare l’appuntamento con/);
  assert.match(dataProvider, /appointment\.type==="cancelled"\)\{queueGoogleDelete\(appointment\.id\)/);
});

test("Attività svolte è facoltativa ma richiede conferma esplicita quando vuota", () => {
  assert.doesNotMatch(newSessionPage, /name="activities"\s+required/);
  assert.match(newSessionPage, /Registrare senza attività svolte\?/);
  assert.match(newSessionPage, /Registra comunque/);
  assert.match(newSessionPage, /if \(!session\.activities\) \{ setPendingWithoutActivities\(session\); return; \}/);
});
