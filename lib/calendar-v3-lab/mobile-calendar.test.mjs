import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  mobileCalendarEventsForDate,
  mobileCalendarWeek,
  navigateMobileCalendarPeriod,
} from "./mobile-view.ts";

const [mobileSource, toolsSource, catalogSource, labSource, stylesSource] = await Promise.all([
  readFile(new URL("../../components/calendar-v3-lab/mobile-calendar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../components/calendar-v3-lab/mobile-calendar-tools.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../components/calendar-v3-lab/calendar-sidebar-catalog.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../components/calendar-v3-lab/calendar-lab.tsx", import.meta.url), "utf8"),
  readFile(new URL("../../components/calendar-v3-lab/calendar-v3-lab.module.css", import.meta.url), "utf8"),
]);

const events = [
  { id: "late", patientName: "B", date: "2026-10-07", startMinutes: 630, endMinutes: 690, status: "scheduled", sessionState: "registered" },
  { id: "early", patientName: "A", date: "2026-10-07", startMinutes: 540, endMinutes: 600, status: "scheduled", sessionState: "to_register" },
  { id: "other", patientName: "C", date: "2026-10-08", startMinutes: 480, endMinutes: 495, status: "cancelled", sessionState: "to_register" },
];

test("week strip contiene sette giorni lunedì-domenica e conserva il selected date", () => {
  assert.deepEqual(mobileCalendarWeek("2026-10-07"), [
    "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11",
  ]);
  assert.match(mobileSource, /aria-pressed=\{date === selectedDate\}/);
  assert.match(mobileSource, /date === today \? styles\.mobileWeekToday/);
  assert.match(mobileSource, /onClick=\{\(\) => onSelect\(date\)\}/);
});

test("navigazione mobile cambia settimana o mese senza stato parallelo", () => {
  assert.equal(navigateMobileCalendarPeriod("day", "2026-10-07", -1), "2026-09-30");
  assert.equal(navigateMobileCalendarPeriod("agenda", "2026-10-07", 1), "2026-10-14");
  assert.equal(navigateMobileCalendarPeriod("month", "2026-01-31", 1), "2026-02-28");
  assert.equal(navigateMobileCalendarPeriod("month", "2026-03-31", -1), "2026-02-28");
});

test("Agenda usa gli stessi eventi, li filtra per data e li ordina cronologicamente", () => {
  const input = events.slice();
  assert.deepEqual(mobileCalendarEventsForDate(input, "2026-10-07").map((event) => event.id), ["early", "late"]);
  assert.deepEqual(input, events);
  assert.match(labSource, /events=\{visibleEvents\}/);
  assert.match(mobileSource, /mobileCalendarEventsForDate\(events, selectedDate\)/);
  assert.doesNotMatch(mobileSource, /CALENDAR_LAB_EVENTS/);
});

test("Giorno conserva asse temporale overlap current time e tap create event", () => {
  assert.match(mobileSource, /layoutCalendarLabEvents\(events\)/);
  assert.match(mobileSource, /eventHorizontalStyle\(event\)/);
  assert.match(mobileSource, /mobileCurrentTime/);
  assert.match(mobileSource, /normalizeCalendarSelection\(date, start/);
  assert.match(mobileSource, /onOpen\(event\.id, click\.currentTarget\)/);
  assert.doesNotMatch(mobileSource, /onPointerDown|onPointerMove|onPointerUp|onContextMenu/);
});

test("Agenda mostra stati accessibili, empty day e creazione esplicita", () => {
  assert.match(mobileSource, /eventAccessibleLabel\(event\)/);
  assert.match(mobileSource, /mobileStateRegistered/);
  assert.match(mobileSource, /mobileStatePending/);
  assert.match(mobileSource, /Nessun appuntamento/);
  assert.match(mobileSource, /Nuovo appuntamento/);
});

test("Mese preserva griglia compatta, selected day, indicatori e azione Apri giorno", () => {
  assert.match(mobileSource, /calendarMonthDays\(date\)/);
  assert.match(mobileSource, /aria-pressed=\{day === date\}/);
  assert.match(mobileSource, /dayEvents\.slice\(0, 3\)/);
  assert.match(mobileSource, /dayEvents\.length > 3/);
  assert.match(mobileSource, />Apri giorno</);
});

test("presentazione mobile è isolata sotto 768px e desktop V3 resta presente", () => {
  assert.match(labSource, /<div className=\{styles\.mobileApp\}>/);
  assert.match(labSource, /<div className=\{styles\.desktopApp\}>/);
  assert.match(stylesSource, /\.mobileApp \{ display: none; \}/);
  assert.match(stylesSource, /@media \(max-width: 767px\)/);
  assert.match(stylesSource, /\.desktopApp \{ display: contents; \}/);
});

test("detail e form continuano a usare i pannelli V3 canonici in full-screen mobile", () => {
  assert.match(labSource, /<AppointmentDetailPanel/);
  assert.match(labSource, /<AppointmentDrawer/);
  assert.match(labSource, /<SessionRegistrationPanel/);
  assert.match(stylesSource, /\.appointmentDrawer, \.sessionDrawer \{ width: 100vw; max-width: none/);
});

test("mobile espone filtri e impostazioni senza duplicare lo stato calendario", () => {
  assert.match(mobileSource, />Filtri/);
  assert.match(mobileSource, />Impostazioni</);
  assert.match(mobileSource, /activeFilterCount/);
  assert.match(labSource, /hidden=\{state\.hiddenFilters\}/);
  assert.match(labSource, /dispatch\(\{ type: "toggle_filter", filter \}\)/);
  assert.doesNotMatch(toolsSource, /useState\([^)]*filter/i);
  assert.match(toolsSource, /calendarFilterGroups/);
});

test("filtri mobile includono sedi prestazioni reset e indicatori accessibili", () => {
  assert.match(toolsSource, /title="Sedi"/);
  assert.match(toolsSource, /title="Prestazioni"/);
  assert.match(toolsSource, /Mostra tutte/);
  assert.match(toolsSource, /role="checkbox" aria-checked=\{checked\}/);
  assert.match(stylesSource, /\.mobileCalendarControls span/);
});

test("impostazioni mobile riusano catalogo CRUD e mostrano lo stato Google", () => {
  assert.match(toolsSource, /<CalendarSidebarCatalog/);
  assert.match(toolsSource, /presentation="mobile-settings"/);
  assert.match(catalogSource, /MobileSettingsHome/);
  assert.match(catalogSource, /MobileCatalogList/);
  assert.match(catalogSource, /<GoogleCalendarStatus realMode=\{realMode\}/);
  assert.match(catalogSource, /href="\/impostazioni"/);
  assert.match(catalogSource, /saveAppointmentLocation/);
  assert.match(catalogSource, /saveAppointmentService/);
});

test("capability parity touch usa editor canonici senza gesture desktop", () => {
  assert.match(labSource, /<AppointmentDrawer/);
  assert.match(labSource, /<AppointmentDetailPanel/);
  assert.match(labSource, /<RecurrenceScopeDialog/);
  assert.match(labSource, /<AppointmentCancelDialog/);
  assert.doesNotMatch(mobileSource, /onContextMenu|onPointerDown|resize handle/i);
  assert.match(stylesSource, /\.mobileToolsSurface \.catalogField > input/);
});
