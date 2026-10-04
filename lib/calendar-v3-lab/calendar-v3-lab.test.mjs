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
  CALENDAR_LAB_DURATION_PRESETS,
  appointmentDraftFromEvent,
  calendarLabEventContentDensity,
  createAppointmentDraft,
  eventFromAppointmentDraft,
  isCalendarLabDurationPreset,
  maxCalendarLabDuration,
  nextCalendarLabEventId,
  selectionFromGridClick,
  updateDraftDuration,
  updateDraftService,
  validateAppointmentDraft,
} from "./appointment-editor.ts";
import {
  CALENDAR_DRAG_THRESHOLD_PX,
  IDLE_CALENDAR_DRAG_SELECTION,
  beginCalendarDragSelection,
  calendarDragAutoScrollVelocity,
  cancelCalendarDragSelection,
  completeCalendarDragSelection,
  moveCalendarDragSelection,
} from "./drag-selection.ts";
import {
  EMPTY_SLOT_CONTEXT_ITEMS,
  clampContextMenuPosition,
  contextMenuItemsForEvent,
  duplicateCalendarLabEvent,
  nextContextMenuIndex,
} from "./context-menu.ts";
import {
  CALENDAR_COMMANDS,
  filterCalendarCommands,
  isCalendarShortcutTypingTarget,
  isValidCalendarCommandDate,
  nextEnabledCalendarCommandIndex,
} from "./command-palette.ts";
import {
  IDLE_CALENDAR_EVENT_MOVE,
  beginCalendarEventMove,
  calendarDayFromClientX,
  cancelCalendarEventMove,
  completeCalendarEventMove,
  isCalendarLabEventDraggable,
  moveCalendarEvent,
  movedCalendarLabEvent,
} from "./event-move.ts";

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

test("durate oltre 120 minuti restano valide entro il range della giornata", () => {
  const base = {
    ...createAppointmentDraft(normalizeCalendarSelection("2026-10-06", 600, 645)),
    patientName: "Mario Rossi",
  };
  for (const durationMinutes of [120, 135, 180]) {
    assert.deepEqual(validateAppointmentDraft({ ...base, durationMinutes }), {});
  }
  const early = { ...base, startTime: "08:00", durationMinutes: 240 };
  assert.deepEqual(validateAppointmentDraft(early), {});
  assert.equal(validateAppointmentDraft({ ...base, durationMinutes: 14 }).durationMinutes, "La durata deve essere di almeno 15 minuti, a intervalli di 15.");
  assert.equal(validateAppointmentDraft({ ...base, startTime: "20:00", durationMinutes: 120 }).durationMinutes, "L’appuntamento deve terminare entro le 21:00.");
  assert.equal(maxCalendarLabDuration("08:00"), 780);
});

test("drag lungo, prefill custom ed edit oltre 120 preservano la durata reale", () => {
  const candidate = beginCalendarDragSelection({
    pointerId: 9, pointerType: "mouse", isPrimary: true, button: 0,
    date: "2026-10-06", minute: 600, clientY: 100,
  });
  const dragged = completeCalendarDragSelection(candidate, { pointerId: 9, minute: 780, clientY: 268 });
  assert.deepEqual(dragged.selection, {
    date: "2026-10-06", startMinutes: 600, endMinutes: 780, durationMinutes: 180,
  });
  const draft = createAppointmentDraft(dragged.selection);
  assert.equal(draft.durationMinutes, 180);
  assert.equal(isCalendarLabDurationPreset(draft.durationMinutes), false);
  assert.deepEqual(CALENDAR_LAB_DURATION_PRESETS, [15, 30, 45, 60, 75, 90, 120]);

  const longEvent = eventFromAppointmentDraft({ ...draft, patientName: "Mario Rossi" }, "lab-long");
  assert.equal(longEvent.endMinutes - longEvent.startMinutes, 180);
  const editDraft = appointmentDraftFromEvent(longEvent);
  assert.equal(editDraft.durationMinutes, 180);
  const extended = eventFromAppointmentDraft(updateDraftDuration(editDraft, 240), "lab-long", longEvent);
  assert.equal(extended.endMinutes - extended.startMinutes, 240);
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
  assert.match(drawer, /Personalizzata…/);
  assert.match(drawer, /type="number"/);
  assert.match(drawer, /max=\{maxCalendarLabDuration\(draft\.startTime\)\}/);
  assert.match(drawer, /step=\{15\}/);
  assert.match(component, /calendarLabEventContentDensity/);
  assert.match(component, /calendarLabSessionLabel\(event\)/);
  assert.match(component, /aria-label=\{event\.sessionState === "registered" \? "Seduta registrata" : "Da registrare"\}/);
  assert.match(css, /\.event \{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.sessionIndicator \{[^}]*position:\s*absolute/);
});

test("drag forward e reverse producono lo stesso intervallo normalizzato", () => {
  const forwardCandidate = beginCalendarDragSelection({
    pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0,
    date: "2026-10-06", minute: 600, clientY: 100,
  });
  const forward = moveCalendarDragSelection(forwardCandidate, { pointerId: 1, minute: 660, clientY: 156 });
  assert.equal(forward.status, "selecting");
  assert.deepEqual(forward.status === "selecting" ? forward.selection : null, {
    date: "2026-10-06", startMinutes: 600, endMinutes: 660, durationMinutes: 60,
  });

  const reverseCandidate = beginCalendarDragSelection({
    pointerId: 2, pointerType: "mouse", isPrimary: true, button: 0,
    date: "2026-10-06", minute: 660, clientY: 156,
  });
  const reverse = moveCalendarDragSelection(reverseCandidate, { pointerId: 2, minute: 600, clientY: 100 });
  assert.deepEqual(reverse.status === "selecting" ? reverse.selection : null, {
    date: "2026-10-06", startMinutes: 600, endMinutes: 660, durationMinutes: 60,
  });
});

test("soglia distingue click e drag e mantiene il giorno dell'anchor", () => {
  const candidate = beginCalendarDragSelection({
    pointerId: 7, pointerType: "mouse", isPrimary: true, button: 0,
    date: "2026-10-06", minute: 600, clientY: 100,
  });
  assert.equal(CALENDAR_DRAG_THRESHOLD_PX, 5);
  assert.equal(moveCalendarDragSelection(candidate, { pointerId: 7, minute: 615, clientY: 104 }).status, "pointerDownCandidate");
  const selecting = moveCalendarDragSelection(candidate, { pointerId: 7, minute: 615, clientY: 105 });
  assert.equal(selecting.status, "selecting");
  assert.equal(selecting.status === "selecting" ? selecting.selection.date : null, "2026-10-06");
  assert.equal(completeCalendarDragSelection(candidate, { pointerId: 7, minute: 600, clientY: 102 }).wasDrag, false);
});

test("snap, minimo e clamp restano quelli canonici durante il drag", () => {
  const pixelsPerMinute = CALENDAR_LAB_PIXELS_PER_HOUR / 60;
  assert.equal(yToSnappedMinute((607 - 420) * pixelsPerMinute, pixelsPerMinute), 600);
  const candidate = beginCalendarDragSelection({
    pointerId: 8, pointerType: "mouse", isPrimary: true, button: 0,
    date: "2026-10-06", minute: 420, clientY: 0,
  });
  const selection = moveCalendarDragSelection(candidate, { pointerId: 8, minute: 1260, clientY: 999 });
  assert.deepEqual(selection.status === "selecting" ? selection.selection : null, {
    date: "2026-10-06", startMinutes: 420, endMinutes: 1260, durationMinutes: 840,
  });
  const minimum = moveCalendarDragSelection(candidate, { pointerId: 8, minute: 420, clientY: 5 });
  assert.equal(minimum.status === "selecting" ? minimum.selection.durationMinutes : null, 15);
});

test("touch e pointer non primari non avviano il drag; cancel torna idle", () => {
  assert.deepEqual(beginCalendarDragSelection({ pointerId: 1, pointerType: "touch", isPrimary: true, button: 0, date: "2026-10-06", minute: 600, clientY: 10 }), IDLE_CALENDAR_DRAG_SELECTION);
  assert.deepEqual(beginCalendarDragSelection({ pointerId: 1, pointerType: "mouse", isPrimary: false, button: 0, date: "2026-10-06", minute: 600, clientY: 10 }), IDLE_CALENDAR_DRAG_SELECTION);
  assert.deepEqual(beginCalendarDragSelection({ pointerId: 1, pointerType: "mouse", isPrimary: true, button: 2, date: "2026-10-06", minute: 600, clientY: 10 }), IDLE_CALENDAR_DRAG_SELECTION);
  assert.deepEqual(cancelCalendarDragSelection(), IDLE_CALENDAR_DRAG_SELECTION);
});

test("autoscroll e progressivo ai bordi e nullo al centro", () => {
  assert.equal(calendarDragAutoScrollVelocity(200, 100, 500), 0);
  assert.ok(calendarDragAutoScrollVelocity(110, 100, 500) < 0);
  assert.ok(calendarDragAutoScrollVelocity(490, 100, 500) > 0);
  assert.ok(Math.abs(calendarDragAutoScrollVelocity(100, 100, 500)) <= 8);
});

test("move evento preserva durata e dati nello stesso giorno o fra giorni", () => {
  const original = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-overlap-a");
  assert.ok(original);
  const candidate = beginCalendarEventMove({
    event: original,
    pointerId: 31,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    pointerMinute: 570,
    clientX: 100,
    clientY: 100,
  });
  const sameDay = moveCalendarEvent(candidate, {
    pointerId: 31,
    date: "2026-10-05",
    pointerMinute: 750,
    clientX: 100,
    clientY: 140,
  });
  assert.equal(sameDay.status, "moving");
  assert.deepEqual(sameDay.status === "moving" ? sameDay.preview : null, {
    ...original,
    startMinutes: 720,
    endMinutes: 780,
  });

  const nextDaySameTime = moveCalendarEvent(candidate, {
    pointerId: 31,
    date: "2026-10-06",
    pointerMinute: 570,
    clientX: 220,
    clientY: 106,
  });
  assert.deepEqual(nextDaySameTime.status === "moving" ? nextDaySameTime.preview : null, {
    ...original,
    date: "2026-10-06",
  });

  const completion = completeCalendarEventMove(candidate, {
    pointerId: 31,
    date: "2026-10-07",
    pointerMinute: 885,
    clientX: 340,
    clientY: 300,
  });
  assert.equal(completion.wasMove, true);
  assert.equal(completion.event?.date, "2026-10-07");
  assert.equal(completion.event?.startMinutes, 855);
  assert.equal((completion.event?.endMinutes ?? 0) - (completion.event?.startMinutes ?? 0), 60);
  assert.equal(completion.event?.patientName, original.patientName);
  assert.equal(completion.event?.serviceName, original.serviceName);
});

test("move usa mapping X sui sette giorni, snap e clamp delle durate lunghe", () => {
  const days = calendarWeekDays("2026-10-05");
  assert.equal(calendarDayFromClientX(99, 100, 700, days), "2026-10-05");
  assert.equal(calendarDayFromClientX(350, 100, 700, days), "2026-10-07");
  assert.equal(calendarDayFromClientX(999, 100, 700, days), "2026-10-11");
  assert.equal(calendarDayFromClientX(-50, 100, 700, days), "2026-10-05");

  const original = CALENDAR_LAB_EVENTS[0];
  assert.equal(movedCalendarLabEvent(original, "2026-10-06", 14 * 60 + 7, 0).startMinutes, 14 * 60);
  assert.equal(movedCalendarLabEvent(original, "2026-10-06", 0, 0).startMinutes, 7 * 60);

  const longEvent = { ...original, startMinutes: 600, endMinutes: 780 };
  const clamped = movedCalendarLabEvent(longEvent, "2026-10-08", 20 * 60, 0);
  assert.deepEqual([clamped.startMinutes, clamped.endMinutes], [18 * 60, 21 * 60]);
  assert.equal(clamped.endMinutes - clamped.startMinutes, 180);
});

test("solo pending attivi iniziano move e click, touch, cancel non mutano il reducer", () => {
  const pending = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-forty-five");
  const registered = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-ninety");
  const cancelled = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-cancelled");
  assert.ok(pending && registered && cancelled);
  assert.equal(isCalendarLabEventDraggable(pending), true);
  assert.equal(isCalendarLabEventDraggable(registered), false);
  assert.equal(isCalendarLabEventDraggable(cancelled), false);

  const begin = (event, overrides = {}) => beginCalendarEventMove({
    event,
    pointerId: 41,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    pointerMinute: event.startMinutes,
    clientX: 100,
    clientY: 100,
    ...overrides,
  });
  assert.deepEqual(begin(registered), IDLE_CALENDAR_EVENT_MOVE);
  assert.deepEqual(begin(cancelled), IDLE_CALENDAR_EVENT_MOVE);
  assert.deepEqual(begin(pending, { pointerType: "touch" }), IDLE_CALENDAR_EVENT_MOVE);
  assert.deepEqual(begin(pending, { button: 2 }), IDLE_CALENDAR_EVENT_MOVE);

  const candidate = begin(pending);
  assert.equal(moveCalendarEvent(candidate, {
    pointerId: 41, date: pending.date, pointerMinute: pending.startMinutes, clientX: 103, clientY: 103,
  }).status, "pointerDownCandidate");
  const clickCompletion = completeCalendarEventMove(candidate, {
    pointerId: 41, date: pending.date, pointerMinute: pending.startMinutes, clientX: 103, clientY: 103,
  });
  assert.equal(clickCompletion.wasMove, false);
  assert.equal(clickCompletion.event, undefined);
  assert.deepEqual(cancelCalendarEventMove(), IDLE_CALENDAR_EVENT_MOVE);
});

test("drop committa una volta e ricalcola il cluster overlap", () => {
  const moving = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-forty-five");
  assert.ok(moving);
  const moved = movedCalendarLabEvent(moving, "2026-10-05", 570, 0);
  const before = createCalendarLabState(CALENDAR_LAB_EVENTS);
  const after = calendarLabReducer(before, { type: "move_event", event: moved });
  assert.equal(before.events.find((event) => event.id === moving.id)?.date, "2026-10-07");
  assert.equal(after.events.find((event) => event.id === moving.id)?.date, "2026-10-05");
  const cluster = layoutCalendarLabEvents(after.events).filter((event) => event.date === "2026-10-05");
  assert.equal(cluster.find((event) => event.id === moving.id)?.columnCount, 4);
});

test("context menu vuoto espone soltanto create e navigazione con slot snapped", () => {
  assert.deepEqual(EMPTY_SLOT_CONTEXT_ITEMS.map((item) => item.id), ["create", "go_to_day"]);
  const selection = selectionFromGridClick("2026-10-07", 8 * CALENDAR_LAB_PIXELS_PER_HOUR, CALENDAR_LAB_PIXELS_PER_HOUR / 60);
  assert.deepEqual(selection, {
    date: "2026-10-07", startMinutes: 900, endMinutes: 945, durationMinutes: 45,
  });
});

test("context menu evento e adattivo per pending registered e cancelled", () => {
  const pending = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-forty-five");
  const registered = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-ninety");
  const cancelled = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-cancelled");
  assert.ok(pending && registered && cancelled);
  assert.deepEqual(contextMenuItemsForEvent(pending).map((item) => item.id), ["open", "register_session", "duplicate", "cancel"]);
  assert.deepEqual(contextMenuItemsForEvent(registered).map((item) => item.id), ["open", "duplicate", "cancel"]);
  assert.deepEqual(contextMenuItemsForEvent(cancelled).map((item) => item.id), ["open", "duplicate"]);
});

test("azioni Lab registrano annullano e duplicano senza copiare stato clinico", () => {
  const registered = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-ninety");
  const cancelled = CALENDAR_LAB_EVENTS.find((event) => event.id === "lab-cancelled");
  assert.ok(registered && cancelled);

  const duplicatedRegistered = duplicateCalendarLabEvent(registered, "lab-local-1");
  assert.equal(duplicatedRegistered.status, "scheduled");
  assert.equal(duplicatedRegistered.sessionState, "to_register");
  assert.equal(duplicatedRegistered.startMinutes, registered.startMinutes);
  assert.equal(duplicatedRegistered.endMinutes, registered.endMinutes);
  assert.equal(duplicatedRegistered.patientName, registered.patientName);

  const duplicatedCancelled = duplicateCalendarLabEvent(cancelled, "lab-local-2");
  assert.equal(duplicatedCancelled.status, "scheduled");
  assert.equal(duplicatedCancelled.sessionState, "to_register");

  const registeredLocally = calendarLabReducer(createCalendarLabState(CALENDAR_LAB_EVENTS), {
    type: "update_event", event: { ...cancelled, status: "scheduled", sessionState: "registered" },
  });
  assert.equal(registeredLocally.events.find((event) => event.id === cancelled.id)?.sessionState, "registered");
  const cancelledLocally = calendarLabReducer(registeredLocally, {
    type: "update_event", event: { ...registered, status: "cancelled" },
  });
  assert.equal(cancelledLocally.events.find((event) => event.id === registered.id)?.status, "cancelled");
});

test("positioning e keyboard navigation del context menu sono deterministici", () => {
  assert.deepEqual(clampContextMenuPosition({ x: 990, y: 790 }, { width: 240, height: 220 }, { width: 1000, height: 800 }), { x: 752, y: 572 });
  assert.deepEqual(clampContextMenuPosition({ x: -20, y: -10 }, { width: 240, height: 220 }, { width: 1000, height: 800 }), { x: 8, y: 8 });
  assert.equal(nextContextMenuIndex(0, 4, "ArrowDown"), 1);
  assert.equal(nextContextMenuIndex(3, 4, "ArrowDown"), 0);
  assert.equal(nextContextMenuIndex(0, 4, "ArrowUp"), 3);
  assert.equal(nextContextMenuIndex(2, 4, "Home"), 0);
  assert.equal(nextContextMenuIndex(1, 4, "End"), 3);
});

test("command model filtra localmente e mantiene Day e Month realmente disabilitati", () => {
  assert.deepEqual(filterCalendarCommands("oggi").map((command) => command.id), ["today"]);
  assert.deepEqual(filterCalendarCommands("CREA").map((command) => command.id), ["create"]);
  assert.deepEqual(filterCalendarCommands("mese").map((command) => command.id), ["month"]);
  assert.equal(CALENDAR_COMMANDS.find((command) => command.id === "week")?.enabled, true);
  assert.equal(CALENDAR_COMMANDS.find((command) => command.id === "month")?.enabled, false);
  assert.equal(CALENDAR_COMMANDS.find((command) => command.id === "day")?.enabled, false);
});

test("command palette salta i comandi disabilitati nella navigazione", () => {
  assert.equal(nextEnabledCalendarCommandIndex(CALENDAR_COMMANDS, 0, "ArrowDown"), 1);
  assert.equal(nextEnabledCalendarCommandIndex(CALENDAR_COMMANDS, 3, "ArrowDown"), 0);
  assert.equal(nextEnabledCalendarCommandIndex(CALENDAR_COMMANDS, 0, "ArrowUp"), 3);
  assert.equal(nextEnabledCalendarCommandIndex(CALENDAR_COMMANDS, 2, "Home"), 0);
  assert.equal(nextEnabledCalendarCommandIndex(CALENDAR_COMMANDS, 1, "End"), 3);
});

test("shortcut ignorano superfici di digitazione e date invalide", () => {
  assert.equal(isCalendarShortcutTypingTarget({ tagName: "INPUT", isContentEditable: false }), true);
  assert.equal(isCalendarShortcutTypingTarget({ tagName: "TEXTAREA", isContentEditable: false }), true);
  assert.equal(isCalendarShortcutTypingTarget({ tagName: "SELECT", isContentEditable: false }), true);
  assert.equal(isCalendarShortcutTypingTarget({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isCalendarShortcutTypingTarget({ tagName: "BUTTON", isContentEditable: false }), false);
  assert.equal(isValidCalendarCommandDate("2026-10-18"), true);
  assert.equal(isValidCalendarCommandDate("2026-02-30"), false);
  assert.equal(isValidCalendarCommandDate("https://example.com"), false);
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
  const contextMenu = readFileSync("components/calendar-v3-lab/context-menu.tsx", "utf8");
  const commandPalette = readFileSync("components/calendar-v3-lab/command-palette.tsx", "utf8");
  const eventMove = readFileSync("lib/calendar-v3-lab/event-move.ts", "utf8");
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
  assert.match(component, /setPointerCapture/);
  assert.match(component, /releasePointerCapture/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /onPointerCancel/);
  assert.match(component, /completion\.wasDrag/);
  assert.match(component, /onContextMenu=\{\(event\) =>/);
  assert.match(component, /contextEvent\.stopPropagation\(\)/);
  assert.match(component, /keyboardEvent\.key !== "ContextMenu"/);
  assert.match(component, /keyboardEvent\.shiftKey && keyboardEvent\.key === "F10"/);
  assert.match(component, /aria-haspopup="menu"/);
  assert.match(component, /aria-expanded=\{menuOpen\}/);
  assert.match(component, /action === "create"\) openCreate/);
  assert.match(component, /action === "open"\) \{/);
  assert.match(component, /action === "register_session"/);
  assert.match(component, /duplicateCalendarLabEvent\(event, id\)/);
  assert.match(component, /action === "cancel"/);
  assert.match(component, /Cerca o esegui un comando, ⌘K o Ctrl\+K/);
  assert.match(component, /\(event\.metaKey \|\| event\.ctrlKey\).*key === "k"/s);
  assert.match(component, /key === "t"/);
  assert.match(component, /key === "c"/);
  assert.match(component, /isCalendarShortcutTypingTarget\(event\.target\)/);
  assert.match(component, /dragSelectionRef\.current\.status !== "idle"/);
  assert.match(component, /eventMoveRef\.current\.status !== "idle"/);
  assert.match(component, /dispatch\(\{ type: "move_event", event: completion\.event \}\)/);
  assert.match(component, /className=\{styles\.moveGhost\}/);
  assert.match(component, /onPointerDown=\{beginEventMove\}/);
  assert.match(component, /onPointerCancel=\{abortEventMove\}/);
  assert.match(component, /setContextMenu\(null\);\s*setCommandPaletteOrigin\(origin\)/);
  assert.match(component, /setCommandPaletteOrigin\(null\);\s*setContextMenu\(/);
  assert.match(component, /className=\{styles\.selectionGhost\}/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(css, /\.selectionGhost \{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.moveGhost \{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.eventDraggable \{[^}]*cursor:\s*grab/);
  assert.match(css, /\.eventMovingOrigin[^}]*opacity:\s*\.35/);
  assert.match(eventMove, /Math\.hypot/);
  assert.match(eventMove, /input\.pointerType === "touch"/);
  assert.match(eventMove, /lastStart = CALENDAR_LAB_CONFIG\.endHour \* 60 - duration/);
  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /role="combobox"/);
  assert.match(drawer, /Salva appuntamento/);
  assert.match(contextMenu, /role="menu"/);
  assert.match(contextMenu, /role="menuitem"/);
  assert.match(contextMenu, /role="separator"/);
  assert.match(contextMenu, /ArrowDown/);
  assert.match(contextMenu, /ArrowUp/);
  assert.match(contextMenu, /event\.key === "Escape"/);
  assert.match(contextMenu, /window\.addEventListener\("resize"/);
  assert.match(contextMenu, /Math\.abs\(scrollElement\.scrollTop - initialScrollTop\) >= 8/);
  assert.match(commandPalette, /role="dialog"/);
  assert.match(commandPalette, /role="combobox"/);
  assert.match(commandPalette, /role="listbox"/);
  assert.match(commandPalette, /role="option"/);
  assert.match(commandPalette, /aria-disabled=\{!command\.enabled\}/);
  assert.match(commandPalette, /nextEnabledCalendarCommandIndex/);
  assert.match(commandPalette, /event\.key === "Enter"/);
  assert.match(commandPalette, /event\.key === "Escape"/);
  assert.match(commandPalette, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(component, /onResize|onDrag|DataProvider|Supabase|google-calendar/);
});
