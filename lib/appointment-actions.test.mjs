import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cancelAppointment, canRegisterAppointmentSession, sessionForAppointment } from "./appointment-actions.ts";

const calendarPage = fs.readFileSync(new URL("../components/calendar-v3-lab/calendar-lab.tsx", import.meta.url), "utf8");
const appointmentDetail = fs.readFileSync(new URL("../components/calendar-v3-lab/appointment-detail-panel.tsx", import.meta.url), "utf8");
const appointmentCancel = fs.readFileSync(new URL("../components/calendar-v3-lab/appointment-cancel-dialog.tsx", import.meta.url), "utf8");
const mobileCalendar = fs.readFileSync(new URL("../components/calendar-v3-lab/mobile-calendar.tsx", import.meta.url), "utf8");
const newSessionPage = fs.readFileSync(new URL("../app/sedute/nuova/page.tsx", import.meta.url), "utf8");
const sessionEditor = fs.readFileSync(new URL("../components/session-editor.tsx", import.meta.url), "utf8");
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

test("Calendar V3 apre le azioni cliniche e registra la seduta inline sull'appuntamento", () => {
  assert.match(calendarPage, /action === "register_session"/);
  assert.match(calendarPage, /setPanelMode\("session-create"\)/);
  assert.match(calendarPage, /<SessionRegistrationPanel/);
  assert.match(appointmentDetail, /Azioni appuntamento|APPUNTAMENTO/);
  assert.doesNotMatch(calendarPage, /Eliminare questo appuntamento\?/);
});

test("Calendar V3 mostra stato seduta e annullamento dai dati adattati", () => {
  assert.match(appointmentDetail, /linkedSession \? "✓ Seduta registrata" : "Seduta da registrare"/);
  assert.match(appointmentDetail, /appointment\.type === "cancelled" \? "Annullato"/);
  assert.match(mobileCalendar, /event\.sessionState === "registered"/);
  assert.match(mobileCalendar, /seduta registrata/);
});

test("Calendar V3 mantiene Mese, Settimana e Giorno nello stesso motore", () => {
  assert.match(calendarPage, /<MonthCalendar/);
  assert.match(calendarPage, /state\.view === "day"/);
  assert.match(calendarPage, /<option value="week">Settimana<\/option>/);
});

test("l'annullamento usa conferma dedicata e Google continua ad accodare una delete", () => {
  assert.match(calendarPage, /<AppointmentCancelDialog/);
  assert.match(appointmentCancel, /Annullare questo appuntamento\?/);
  assert.match(appointmentCancel, /L’appuntamento resterà nello storico/);
  assert.match(dataProvider, /appointment\.type==="cancelled"\)\{queueGoogleDelete\(appointment\.id\)/);
});

test("Attività svolte è facoltativa ma richiede conferma esplicita quando vuota", () => {
  assert.match(newSessionPage, /<SessionEditor/);
  assert.doesNotMatch(sessionEditor, /name="activities"\s+required/);
  assert.match(sessionEditor, /Registrare senza attività svolte\?/);
  assert.match(sessionEditor, /Registra comunque/);
  assert.match(sessionEditor, /if \(!value\.activities\) \{ setPendingWithoutActivities\(value\); return; \}/);
});

test("l'editor Session condiviso preserva errori e blocca il doppio salvataggio", () => {
  assert.match(sessionEditor, /if \(savingRef\.current\) return/);
  assert.match(sessionEditor, /await saveSession\(value\); onSaved\(value\)/);
  assert.match(sessionEditor, /Non è stato possibile salvare la seduta\. Riprova\./);
  assert.match(sessionEditor, /savingRef\.current = false/);
});
