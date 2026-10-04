import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALENDAR_LAB_CONFIG,
  CALENDAR_TIME_ZONE,
  addMinutes,
  calendarDateFromInstant,
  calendarTimeFromInstant,
  calendarWeekDays,
  clampMinute,
  compareCalendarDates,
  getInitialScrollMinute,
  minuteToY,
  minutesToTime,
  startOfCalendarWeek,
  timeRange,
  timeToMinutes,
  yToSnappedMinute,
} from "./date-time.ts";
import { CALENDAR_LAB_EVENTS, calendarLabEventColor } from "./fixtures.ts";
import { CALENDAR_LAB_PIXELS_PER_HOUR, layoutCalendarLabEvents } from "./layout.ts";
import { calendarLabReducer, createCalendarLabState } from "./reducer.ts";
import { normalizeCalendarSelection } from "./selection.ts";
import {
  appointmentDraftFromEvent,
  calendarLabEventContentDensity,
  createAppointmentDraft,
  eventFromAppointmentDraft,
  nextCalendarLabEventId,
  selectionFromGridClick,
  updateDraftDuration,
  updateDraftService,
  validateAppointmentDraft,
} from "./appointment-editor.ts";

test("il time model usa Europe/Rome e converte orari e durata", () => {
  assert.equal(CALENDAR_TIME_ZONE, "Europe/Rome");
  assert.equal(CALENDAR_LAB_CONFIG.timeZone, "Europe/Rome");
  assert.equal(calendarDateFromInstant("2026-10-04T22:30:00.000Z"), "2026-10-05");
  assert.equal(calendarTimeFromInstant("2026-10-05T08:45:00.000Z"), "10:45");
  assert.equal(timeToMinutes("09:45"), 585);
  assert.equal(minutesToTime(585), "09:45");
  assert.equal(addMinutes("09:45", 45), "10:30");
  assert.deepEqual(timeRange("09:45", 45), { startMinutes: 585, endMinutes: 630 });
});

test("lo scroll iniziale anticipa l'ora corrente nella settimana visibile e altrimenti usa le 08:00", () => {
  const week = calendarWeekDays("2026-10-05");
  assert.equal(getInitialScrollMinute(week, "2026-10-05T08:45:00.000Z"), 585);
  assert.equal(getInitialScrollMinute(week, "2026-10-18T08:45:00.000Z"), 480);
});

test("calcola settimana civile lunedi-domenica senza timezone runtime", () => {
  assert.equal(startOfCalendarWeek("2026-10-08"), "2026-10-05");
  assert.deepEqual(calendarWeekDays("2026-10-08"), [
    "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08",
    "2026-10-09", "2026-10-10", "2026-10-11",
  ]);
  assert.equal(compareCalendarDates("2026-10-05", "2026-10-06"), -1);
});

test("snap, clamp e coordinate rispettano il range 07-21", () => {
  assert.equal(clampMinute(300), 420);
  assert.equal(clampMinute(1500), 1260);
  assert.equal(yToSnappedMinute(17, 2), 435);
  assert.equal(minuteToY(435, 2), 30);
  assert.equal(yToSnappedMinute(9999, 2), 1260);
});

test("normalizza selezioni avanti, inverse, minime e fuori range", () => {
  assert.deepEqual(normalizeCalendarSelection("2026-10-05", 600, 660), {
    date: "2026-10-05", startMinutes: 600, endMinutes: 660, durationMinutes: 60,
  });
  assert.deepEqual(normalizeCalendarSelection("2026-10-05", 660, 600), {
    date: "2026-10-05", startMinutes: 600, endMinutes: 660, durationMinutes: 60,
  });
  assert.equal(normalizeCalendarSelection("2026-10-05", 600, 600).durationMinutes, 15);
  assert.deepEqual(normalizeCalendarSelection("2026-10-05", 0, 1600), {
    date: "2026-10-05", startMinutes: 420, endMinutes: 1260, durationMinutes: 840,
  });
});

test("risolve i colori cancelled, service, location e fallback", () => {
  const base = CALENDAR_LAB_EVENTS[0];
  assert.equal(calendarLabEventColor({ ...base, status: "cancelled" }), "#9CA3AF");
  assert.equal(calendarLabEventColor({ ...base, serviceColor: "#123456" }), "#123456");
  assert.equal(calendarLabEventColor({ ...base, serviceColor: undefined, locationColor: "#654321" }), "#654321");
  assert.equal(calendarLabEventColor({ ...base, serviceColor: undefined, locationColor: undefined }), "#77A886");
});

test("le fixture hanno ID unici, tutte le durate e il cluster overlap richiesto", () => {
  assert.equal(new Set(CALENDAR_LAB_EVENTS.map((event) => event.id)).size, CALENDAR_LAB_EVENTS.length);
  assert.deepEqual(new Set(CALENDAR_LAB_EVENTS.map((event) => event.endMinutes - event.startMinutes)), new Set([60, 30, 15, 45, 90]));
  const overlap = CALENDAR_LAB_EVENTS.filter((event) => event.id.startsWith("lab-overlap"));
  assert.deepEqual(overlap.map(({ startMinutes, endMinutes }) => [startMinutes, endMinutes]), [[540, 600], [570, 630], [585, 615]]);
  assert.deepEqual(new Set(CALENDAR_LAB_EVENTS.map((event) => event.patientName)), new Set(["Mario Rossi", "Giulia Bianchi", "Luca Verdi", "Anna Conti"]));
});

test("il layout overlap dispone il cluster in tre colonne deterministiche", () => {
  const cluster = CALENDAR_LAB_EVENTS.filter((event) => event.id.startsWith("lab-overlap"));
  const layout = layoutCalendarLabEvents(cluster);
  assert.equal(CALENDAR_LAB_PIXELS_PER_HOUR, 56);
  assert.deepEqual(layout.map(({ id, column, columnCount }) => ({ id, column, columnCount })), [
    { id: "lab-overlap-a", column: 0, columnCount: 3 },
    { id: "lab-overlap-b", column: 1, columnCount: 3 },
    { id: "lab-overlap-c", column: 2, columnCount: 3 },
  ]);
});

test("il reducer e locale e resetta interamente lo stato fixture", () => {
  const initial = createCalendarLabState(CALENDAR_LAB_EVENTS);
  const changed = calendarLabReducer(initial, { type: "select_event", eventId: "lab-short" });
  assert.equal(changed.selectedEventId, "lab-short");
  assert.deepEqual(calendarLabReducer(changed, { type: "reset", events: CALENDAR_LAB_EVENTS }), initial);
});

test("click su una colonna risolve giorno e slot a 15 minuti con le primitive canoniche", () => {
  const pixelsPerMinute = CALENDAR_LAB_PIXELS_PER_HOUR / 60;
  const selection = selectionFromGridClick("2026-10-06", 6 * CALENDAR_LAB_PIXELS_PER_HOUR + 53 * pixelsPerMinute, pixelsPerMinute);
  assert.deepEqual(selection, {
    date: "2026-10-06",
    startMinutes: 840,
    endMinutes: 885,
    durationMinutes: 45,
  });
});

test("nuovo appuntamento locale genera ID, evento renderizzabile e reducer add/update", () => {
  const selection = normalizeCalendarSelection("2026-10-06", 840, 885);
  const draft = {
    ...createAppointmentDraft(selection),
    patientName: "Mario Rossi",
    serviceName: "Trattamento",
    locationName: "Studio Centro",
  };
  const id = nextCalendarLabEventId(CALENDAR_LAB_EVENTS);
  const created = eventFromAppointmentDraft(draft, id);
  assert.equal(id, "lab-local-1");
  assert.deepEqual(created, {
    id: "lab-local-1",
    patientName: "Mario Rossi",
    date: "2026-10-06",
    startMinutes: 840,
    endMinutes: 885,
    status: "scheduled",
    sessionState: "to_register",
    serviceName: "Trattamento",
    serviceColor: "#77A886",
    locationName: "Studio Centro",
    locationColor: "#8EA6C4",
  });
  const added = calendarLabReducer(createCalendarLabState(CALENDAR_LAB_EVENTS), { type: "add_event", event: created });
  assert.equal(added.events.at(-1)?.id, id);
  const editedDraft = { ...appointmentDraftFromEvent(created), date: "2026-10-07", startTime: "15:15", durationMinutes: 60 };
  const updated = eventFromAppointmentDraft(editedDraft, id, created);
  const edited = calendarLabReducer(added, { type: "update_event", event: updated });
  assert.deepEqual(edited.events.find((event) => event.id === id), { ...updated, date: "2026-10-07", startMinutes: 915, endMinutes: 975 });
});

test("prestazione applica la durata default finche l'utente non la modifica", () => {
  const draft = createAppointmentDraft(normalizeCalendarSelection("2026-10-06", 540, 585));
  const assessment = updateDraftService(draft, "Valutazione");
  assert.equal(assessment.durationMinutes, 60);
  const manual = updateDraftDuration(assessment, 75);
  assert.equal(updateDraftService(manual, "Controllo").durationMinutes, 75);
});

test("validazione richiede paziente e rifiuta durata invalida senza perdere errori", () => {
  const draft = createAppointmentDraft(normalizeCalendarSelection("2026-10-06", 540, 585));
  assert.equal(validateAppointmentDraft(draft).patientName, "Seleziona un paziente dall’elenco.");
  assert.equal(validateAppointmentDraft({ ...draft, patientName: "Mario Rossi", durationMinutes: 0 }).durationMinutes, "La durata deve essere di almeno 15 minuti, a intervalli di 15.");
  assert.deepEqual(validateAppointmentDraft({ ...draft, patientName: "Mario Rossi" }), {});
});

test("contenuto evento cresce solo quando l'altezza disponibile lo consente", () => {
  assert.equal(calendarLabEventContentDensity(15), "name");
  assert.equal(calendarLabEventContentDensity(30), "name");
  assert.equal(calendarLabEventContentDensity(45), "time");
  assert.equal(calendarLabEventContentDensity(60), "time");
  assert.equal(calendarLabEventContentDensity(75), "service");
  assert.equal(calendarLabEventContentDensity(90), "service");
  assert.equal(calendarLabEventContentDensity(105), "details");
  assert.equal(calendarLabEventContentDensity(90, true), "name");
});

test("picker parte chiuso e chip conserva overflow e stato accessibile", () => {
  const component = readFileSync("components/calendar-v3-lab/calendar-lab.tsx", "utf8");
  const drawer = readFileSync("components/calendar-v3-lab/appointment-drawer.tsx", "utf8");
  const css = readFileSync("components/calendar-v3-lab/calendar-v3-lab.module.css", "utf8");
  assert.match(drawer, /const \[open, setOpen\] = useState\(false\)/);
  assert.doesNotMatch(drawer, /onFocus=\{\(\) => setOpen\(true\)\}/);
  assert.match(drawer, /onClick=\{\(\) => setOpen\(true\)\}/);
  assert.match(drawer, /onChange=\{\(changeEvent\) => \{ onChange\(changeEvent\.target\.value\); setOpen\(true\)/);
  assert.match(drawer, /ArrowDown/);
  assert.match(drawer, /ArrowUp/);
  assert.match(drawer, /keyboardEvent\.key === "Enter"/);
  assert.match(component, /calendarLabEventContentDensity/);
  assert.match(component, /calendarLabSessionLabel\(event\)/);
  assert.match(component, /aria-label=\{event\.sessionState === "registered" \? "Seduta registrata" : "Da registrare"\}/);
  assert.match(css, /\.event \{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.sessionIndicator \{[^}]*position:\s*absolute/);
});

test("la route lab e isolata e il calendario reale non importa il lab", () => {
  const labPage = readFileSync("app/calendar-v3-lab/page.tsx", "utf8");
  const realCalendar = readFileSync("app/calendario/page.tsx", "utf8");
  assert.match(labPage, /CalendarLab/);
  assert.doesNotMatch(labPage, /DataProvider|Supabase|google-calendar|Appointment|Session/);
  assert.doesNotMatch(realCalendar, /calendar-v3-lab/);
});

test("la Week View preserva geometria e regressioni visuali mentre il drawer resta isolato", () => {
  const component = readFileSync("components/calendar-v3-lab/calendar-lab.tsx", "utf8");
  const drawer = readFileSync("components/calendar-v3-lab/appointment-drawer.tsx", "utf8");
  const css = readFileSync("components/calendar-v3-lab/calendar-v3-lab.module.css", "utf8");
  assert.match(component, /aria-expanded=\{expanded\}/);
  assert.match(component, /Settimana precedente/);
  assert.match(component, /Settimana successiva/);
  assert.match(component, /MiniCalendar/);
  assert.match(component, /Google Calendar/);
  assert.match(component, /aria-pressed=\{selected\}/);
  assert.match(css, /--calendar-time-gutter:\s*58px/);
  assert.match(css, /--calendar-day-columns:\s*repeat\(7/);
  assert.match(css, /grid-template-columns:\s*var\(--calendar-grid-template\)/);
  assert.match(css, /grid-template-columns:\s*var\(--calendar-time-gutter\) minmax\(0, 1fr\)/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /focus-visible/);
  assert.match(css, /max-width:\s*767px/);
  assert.match(component, /selectionFromGridClick/);
  assert.match(component, /clickEvent\.stopPropagation\(\)/);
  assert.match(component, /AppointmentDrawer/);
  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /role="combobox"/);
  assert.match(drawer, /Salva appuntamento/);
  assert.doesNotMatch(component, /onResize|onDrag|DataProvider|Supabase|google-calendar/);
});
