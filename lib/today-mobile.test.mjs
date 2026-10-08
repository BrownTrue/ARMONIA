import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { currentRomeTime, deriveTodayDashboard } from "./today-dashboard.ts";

const appointment = (id, time, type = "regular") => ({ id, patientId: `patient-${id}`, date: "2026-10-05", time, duration: 45, type, notes: "", createdAt: "2026-10-01T08:00:00.000Z" });
const session = (appointmentId) => ({ id: `session-${appointmentId}`, patientId: `patient-${appointmentId}`, appointmentId, date: "2026-10-05", duration: 45, goalIds: [], activities: "", response: "", helpLevel: "", result: "", nextPlan: "", homework: "", notes: "", materialIds: [], createdAt: "2026-10-05T10:00:00.000Z" });

test("dashboard Oggi deriva next, pending, registered, cancelled e overdue una sola volta", () => {
  const appointments = [appointment("past", "09:00"), appointment("done", "10:00"), appointment("next", "11:00"), appointment("later", "15:00"), appointment("cancelled", "16:00", "cancelled")];
  const result = deriveTodayDashboard(appointments, [session("done")], "2026-10-05", "10:30");
  assert.equal(result.next?.id, "next");
  assert.deepEqual(result.pending.map((item) => item.id), ["past", "next", "later"]);
  assert.deepEqual(result.completed.map((item) => item.id), ["done"]);
  assert.deepEqual(result.overdue.map((item) => item.id), ["past"]);
  assert.deepEqual(result.upcoming.map((item) => item.id), ["next", "later"]);
  assert.deepEqual(result.cancelled.map((item) => item.id), ["cancelled"]);
  assert.deepEqual(result.all.map((item) => item.id), ["past", "done", "next", "later"]);
});

test("dashboard Oggi gestisce giornata vuota e ora civile Europe Rome", () => {
  const result = deriveTodayDashboard([], [], "2026-10-05", "12:00");
  assert.equal(result.next, undefined);
  assert.deepEqual(result.all, []);
  assert.deepEqual(result.overdue, []);
  assert.equal(currentRomeTime(new Date("2026-10-05T08:30:00.000Z")), "10:30");
});

test("presentazione mobile preserva azioni canoniche e desktop strutturalmente separato", () => {
  const page = readFileSync(new URL("../app/oggi/page.tsx", import.meta.url), "utf8");
  const mobile = readFileSync(new URL("../components/today/mobile-today.tsx", import.meta.url), "utf8");
  const appShell = readFileSync(new URL("../components/app-shell.tsx", import.meta.url), "utf8");
  const shellCss = readFileSync(new URL("../components/app-shell/desktop-editorial-shell.module.css", import.meta.url), "utf8");
  assert.match(page, /MobileToday[\s\S]*hidden md:contents/);
  assert.match(page, /<AppShell desktopWide>/);
  assert.match(page, /const dateLabel = new Date\(\)\.toLocaleDateString\("it-IT", \{ weekday: "long", day: "numeric", month: "long" \}\)/);
  assert.match(page, /<MobileToday data=\{data\} ready=\{ready\} dashboard=\{dashboard\} dateLabel=\{dateLabel\}\/?>/);
  assert.match(page, /appointments\.map\(\(appointment\) => <AppointmentRow/);
  assert.match(page, /appointment\.duration/);
  assert.match(page, /appointment\.notes/);
  assert.match(page, /Pazienti attivi · attuali/);
  assert.match(page, /Sedute registrate · totale/);
  assert.match(page, /overdue=\{overdue\.some/);
  assert.match(page, /PremiumAction href="\/calendario"/);
  assert.match(page, /href="\/sedute\/nuova"/);
  assert.match(page, /href="\/calendario" className=\{styles\.calendarLink\}/);
  assert.match(page, /href=\{`\/sedute\/nuova\?a=\$\{appointment\.id\}`\}/);
  assert.match(page, /href=\{`\/pazienti\/\$\{patient\.id\}`\}/);
  assert.match(page, /Da ricordare: \{appointment\.notes\}/);
  const editorialStyles = readFileSync(new URL("../app/oggi/oggi-editorial.module.css", import.meta.url), "utf8");
  assert.match(editorialStyles, /\.timeBlock small\s*\{[^}]*font-size:\s*12px/);
  assert.match(editorialStyles, /\.appointmentDetails \.notes\s*\{[^}]*font-size:\s*13px/);
  assert.match(editorialStyles, /\.rowAction,\.patientLink\s*\{[^}]*font-size:\s*12px/);
  assert.match(appShell, /desktopWide = false/);
  assert.match(appShell, /desktopWide \? editorialStyles\.wideMain/);
  assert.match(shellCss, /@media screen and \(min-width: 768px\)[\s\S]*?\.wideMain\s*\{[^}]*max-width:\s*none;[^}]*margin-inline:\s*0/s);
  assert.match(page, /useData\(\)/);
  assert.doesNotMatch(page, /fetch\(|createClient|supabase/);
  assert.match(mobile, /href="\/calendario"/);
  assert.match(mobile, /CalendarPlusIcon[\s\S]*Nuovo appuntamento/);
  assert.match(mobile, /SessionIcon[\s\S]*Registra seduta/);
  assert.match(mobile, /Calendario<ChevronRightIcon/);
  assert.match(mobile, /href=\{`\/pazienti\/\$\{patient\.id\}`\}/);
  assert.match(mobile, /aria-label=\{`Apri \$\{fullName\(patient\)\}`\}/);
  assert.match(mobile, /hover:bg-\[#f0f3ed\][\s\S]*active:bg-\[#e5ebe1\]/);
  assert.match(mobile, /href=\{`\/sedute\/nuova\?a=\$\{appointment\.id\}`\}/);
  assert.match(mobile, /bg-\[#776a58\][\s\S]*>Registra<\/Link>/);
  assert.match(mobile, /Nessun appuntamento oggi\./);
  assert.match(mobile, /✓ Seduta registrata/);
  assert.doesNotMatch(mobile, /dashboard\.cancelled\.map/);
});
