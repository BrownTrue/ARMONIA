"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import styles from "./calendar-v3-lab.module.css";
import { AppointmentDrawer } from "./appointment-drawer";
import { ContextMenu } from "./context-menu";
import {
  CALENDAR_LAB_CONFIG,
  addCalendarDays,
  calendarDateFromInstant,
  calendarTimeFromInstant,
  calendarWeekDays,
  getInitialScrollMinute,
  minutesToTime,
  timeToMinutes,
  yToSnappedMinute,
  type CalendarDate,
} from "@/lib/calendar-v3-lab/date-time";
import {
  CALENDAR_LAB_EVENTS,
  calendarLabEventColor,
  type CalendarLabEvent,
} from "@/lib/calendar-v3-lab/fixtures";
import {
  CALENDAR_LAB_PIXELS_PER_HOUR,
  eventHorizontalStyle,
  layoutCalendarLabEvents,
  type CalendarLabEventLayout,
} from "@/lib/calendar-v3-lab/layout";
import {
  calendarLabReducer,
  createCalendarLabState,
} from "@/lib/calendar-v3-lab/reducer";
import {
  appointmentDraftFromEvent,
  calendarLabEventContentDensity,
  calendarLabSessionLabel,
  createAppointmentDraft,
  eventFromAppointmentDraft,
  nextCalendarLabEventId,
  selectionFromGridClick,
  type CalendarAppointmentDraft,
} from "@/lib/calendar-v3-lab/appointment-editor";
import { normalizeCalendarSelection, type CalendarSelection } from "@/lib/calendar-v3-lab/selection";
import {
  IDLE_CALENDAR_DRAG_SELECTION,
  beginCalendarDragSelection,
  calendarDragAutoScrollVelocity,
  cancelCalendarDragSelection,
  completeCalendarDragSelection,
  moveCalendarDragSelection,
  type CalendarDragSelectionState,
} from "@/lib/calendar-v3-lab/drag-selection";
import {
  EMPTY_SLOT_CONTEXT_ITEMS,
  contextMenuItemsForEvent,
  duplicateCalendarLabEvent,
  type CalendarContextMenuAction,
} from "@/lib/calendar-v3-lab/context-menu";

const LAB_NOW = new Date("2026-10-05T08:00:00.000Z");
const DAY_LABELS = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GRID_HEIGHT = (CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour) * CALENDAR_LAB_PIXELS_PER_HOUR;
const PIXELS_PER_MINUTE = CALENDAR_LAB_PIXELS_PER_HOUR / 60;

type CalendarContextMenuState =
  | { kind: "empty"; anchorPoint: { x: number; y: number }; origin: HTMLElement; selection: CalendarSelection }
  | { kind: "event"; anchorPoint: { x: number; y: number }; origin: HTMLElement; eventId: string };

export function CalendarLab() {
  const [state, dispatch] = useReducer(calendarLabReducer, CALENDAR_LAB_EVENTS, createCalendarLabState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekHeaderRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<CalendarSelection | null>(null);
  const [dragSelection, setDragSelection] = useState<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenuState | null>(null);
  const dragSelectionRef = useRef<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const dragOriginRef = useRef<HTMLDivElement | null>(null);
  const pointerClientYRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const days = useMemo(() => calendarWeekDays(state.cursorDate), [state.cursorDate]);
  const visibleEvents = state.events.filter((event) =>
    !state.hiddenFilters.includes(event.locationName ?? "") &&
    !state.hiddenFilters.includes(event.serviceName ?? ""),
  );
  const eventLayouts = useMemo(() => layoutCalendarLabEvents(visibleEvents), [visibleEvents]);
  const periodLabel = formatPeriod(days);
  const labToday = calendarDateFromInstant(LAB_NOW);
  const labNowMinutes = timeToMinutes(calendarTimeFromInstant(LAB_NOW));
  const currentDayIndex = days.indexOf(labToday);
  const selectedEvent = state.events.find((event) => event.id === state.selectedEventId);
  const drawerDraft = selectedEvent
    ? appointmentDraftFromEvent(selectedEvent)
    : state.selection
      ? createAppointmentDraft(state.selection)
      : null;

  useEffect(() => {
    const initialMinute = getInitialScrollMinute(days, LAB_NOW);
    const weekHeaderHeight = weekHeaderRef.current?.getBoundingClientRect().height ?? 0;
    scrollRef.current?.scrollTo({
      top: Math.max(0, weekHeaderHeight + (initialMinute - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE),
    });
  }, [days]);

  useEffect(() => {
    const cancelDrag = (event: KeyboardEvent) => {
      const current = dragSelectionRef.current;
      if (event.key !== "Escape" || current.status === "idle") return;
      event.preventDefault();
      const origin = dragOriginRef.current;
      if (origin?.hasPointerCapture(current.pointerId)) origin.releasePointerCapture(current.pointerId);
      dragSelectionRef.current = cancelCalendarDragSelection();
      setDragSelection(IDLE_CALENDAR_DRAG_SELECTION);
      dragOriginRef.current = null;
      setHoveredSlot(null);
    };
    document.addEventListener("keydown", cancelDrag);
    return () => document.removeEventListener("keydown", cancelDrag);
  }, []);

  useEffect(() => {
    if (dragSelection.status !== "selecting") return;
    let frameId = 0;
    const advance = () => {
      const current = dragSelectionRef.current;
      const scrollArea = scrollRef.current;
      const origin = dragOriginRef.current;
      if (current.status !== "selecting" || !scrollArea || !origin) return;
      const scrollRectangle = scrollArea.getBoundingClientRect();
      const velocity = calendarDragAutoScrollVelocity(pointerClientYRef.current, scrollRectangle.top, scrollRectangle.bottom);
      if (velocity !== 0) {
        const previousScrollTop = scrollArea.scrollTop;
        scrollArea.scrollTop += velocity;
        if (scrollArea.scrollTop !== previousScrollTop) {
          const minute = yToSnappedMinute(pointerClientYRef.current - origin.getBoundingClientRect().top, PIXELS_PER_MINUTE);
          const next = moveCalendarDragSelection(current, {
            pointerId: current.pointerId,
            minute,
            clientY: pointerClientYRef.current,
          });
          dragSelectionRef.current = next;
          setDragSelection(next);
        }
      }
      frameId = window.requestAnimationFrame(advance);
    };
    frameId = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(frameId);
  }, [dragSelection.status]);

  const moveWeek = (amount: number) => {
    dispatch({ type: "set_cursor_date", date: addCalendarDays(state.cursorDate, amount * 7) });
  };

  const openCreate = (selection: CalendarSelection, origin: HTMLElement) => {
    returnFocusRef.current = origin;
    dispatch({ type: "select_event", eventId: null });
    dispatch({ type: "set_selection", selection });
  };

  const openEdit = (eventId: string, origin: HTMLElement) => {
    returnFocusRef.current = origin;
    dispatch({ type: "set_selection", selection: null });
    dispatch({ type: "select_event", eventId });
  };

  const closeDrawer = () => {
    dragSelectionRef.current = IDLE_CALENDAR_DRAG_SELECTION;
    setDragSelection(IDLE_CALENDAR_DRAG_SELECTION);
    dispatch({ type: "set_selection", selection: null });
    dispatch({ type: "select_event", eventId: null });
  };

  const saveAppointment = (draft: CalendarAppointmentDraft) => {
    if (!days.includes(draft.date as CalendarDate)) {
      dispatch({ type: "set_cursor_date", date: draft.date as CalendarDate });
    }
    if (selectedEvent) {
      dispatch({ type: "update_event", event: eventFromAppointmentDraft(draft, selectedEvent.id, selectedEvent) });
      return;
    }
    dispatch({ type: "add_event", event: eventFromAppointmentDraft(draft, nextCalendarLabEventId(state.events)) });
  };

  const handleContextMenuAction = (action: CalendarContextMenuAction) => {
    if (!contextMenu) return;
    const currentMenu = contextMenu;
    setContextMenu(null);
    if (currentMenu.kind === "empty") {
      if (action === "create") openCreate(currentMenu.selection, currentMenu.origin);
      else if (action === "go_to_day") dispatch({ type: "set_cursor_date", date: currentMenu.selection.date });
      return;
    }

    const event = state.events.find((item) => item.id === currentMenu.eventId);
    if (!event) return;
    if (action === "open") {
      openEdit(event.id, currentMenu.origin);
    } else if (action === "register_session" && event.status !== "cancelled") {
      dispatch({ type: "update_event", event: { ...event, sessionState: "registered" } });
    } else if (action === "duplicate") {
      const id = nextCalendarLabEventId(state.events);
      const duplicate = duplicateCalendarLabEvent(event, id);
      returnFocusRef.current = currentMenu.origin;
      dispatch({ type: "add_event", event: duplicate });
      dispatch({ type: "select_event", eventId: id });
    } else if (action === "cancel" && event.status !== "cancelled") {
      dispatch({ type: "update_event", event: { ...event, status: "cancelled" } });
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.mobileFallback}>
        <span className={styles.mobileMark}>Calendar V3 Lab</span>
        <h1>La vista mobile verrà progettata separatamente.</h1>
        <p>Questa fase valuta la Week View desktop di ARMONIA. Apri il laboratorio da uno schermo di almeno 768 px.</p>
      </div>

      <div className={styles.desktopApp}>
        <header className={styles.toolbar}>
          <div className={styles.toolbarCluster}>
            <IconButton
              label={state.sidebarOpen ? "Nascondi barra laterale" : "Mostra barra laterale"}
              expanded={state.sidebarOpen}
              onClick={() => dispatch({ type: "set_sidebar_open", open: !state.sidebarOpen })}
            ><SidebarIcon /></IconButton>
            <IconButton label="Cerca nel calendario — disponibile in una fase successiva"><SearchIcon /></IconButton>
            <IconButton label="Nuovo appuntamento" onClick={(event) => openCreate(
              normalizeCalendarSelection(state.cursorDate, 9 * 60, 9 * 60 + 45),
              event.currentTarget,
            )}><ComposeIcon /></IconButton>
          </div>

          <p className={styles.periodLabel} aria-live="polite">{periodLabel}</p>

          <div className={`${styles.toolbarCluster} ${styles.toolbarRight}`}>
            <button type="button" className={styles.textButton} onClick={() => dispatch({ type: "set_cursor_date", date: labToday })}>Oggi</button>
            <IconButton label="Settimana precedente" onClick={() => moveWeek(-1)}><Chevron direction="left" /></IconButton>
            <IconButton label="Settimana successiva" onClick={() => moveWeek(1)}><Chevron direction="right" /></IconButton>
            <button type="button" className={styles.viewButton} aria-label="Vista corrente: Settimana">Settimana <Chevron direction="down" /></button>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={`${styles.sidebar} ${state.sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`} aria-hidden={!state.sidebarOpen}>
            <div className={styles.sidebarInner}>
              <MiniCalendar cursorDate={state.cursorDate} visibleWeek={days} today={labToday} onSelect={(date) => dispatch({ type: "set_cursor_date", date })} />
              <FilterSection title="Sedi" items={[
                { label: "Studio Centro", color: "#8EA6C4" },
                { label: "Studio Nord", color: "#A88BBC" },
              ]} hidden={state.hiddenFilters} onToggle={(filter) => dispatch({ type: "toggle_filter", filter })} />
              <FilterSection title="Prestazioni" items={[
                { label: "Trattamento", color: "#77A886" },
                { label: "Valutazione", color: "#D99B7B" },
                { label: "Controllo", color: "#D6A84B" },
              ]} hidden={state.hiddenFilters} onToggle={(filter) => dispatch({ type: "toggle_filter", filter })} />
              <div className={styles.googleStatus}>
                <div><span className={styles.googleDot} aria-hidden="true" /><span>Google Calendar</span></div>
                <span>Collegato</span>
              </div>
            </div>
          </aside>

          <section className={styles.calendarPane} aria-label={`Calendario settimanale, ${periodLabel}`}>
            <div ref={scrollRef} className={styles.scrollArea}>
              <div ref={weekHeaderRef} className={styles.weekHeader}>
                <div className={styles.gutterHeader}><span>CEST</span></div>
                {days.map((day) => <DayHeader key={day} day={day} today={labToday} />)}
              </div>
              <div className={styles.timeGrid} style={{ height: GRID_HEIGHT }}>
                <TimeGutter />
                <div className={styles.daysGrid}>
                  {days.map((day) => (
                    <div
                      key={day}
                      tabIndex={-1}
                      className={`${styles.dayColumn} ${day === labToday ? styles.todayColumn : ""} ${dragSelection.status !== "idle" && dragSelection.date === day ? styles.dayColumnSelecting : ""}`}
                      aria-label={formatFullDate(day)}
                      onMouseMove={(event) => {
                        if (dragSelection.status !== "idle") return;
                        if (event.target !== event.currentTarget) return;
                        const rectangle = event.currentTarget.getBoundingClientRect();
                        setHoveredSlot(selectionFromGridClick(day, event.clientY - rectangle.top, PIXELS_PER_MINUTE, 15));
                      }}
                      onMouseLeave={() => setHoveredSlot((current) => current?.date === day ? null : current)}
                      onClick={(event) => {
                        if (suppressNextClickRef.current) {
                          suppressNextClickRef.current = false;
                          return;
                        }
                        if (event.target !== event.currentTarget) return;
                        const rectangle = event.currentTarget.getBoundingClientRect();
                        openCreate(selectionFromGridClick(day, event.clientY - rectangle.top, PIXELS_PER_MINUTE), event.currentTarget);
                      }}
                      onContextMenu={(event) => {
                        if (event.target !== event.currentTarget) return;
                        event.preventDefault();
                        const rectangle = event.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          kind: "empty",
                          anchorPoint: { x: event.clientX, y: event.clientY },
                          origin: event.currentTarget,
                          selection: selectionFromGridClick(day, event.clientY - rectangle.top, PIXELS_PER_MINUTE),
                        });
                      }}
                      onPointerDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        const rectangle = event.currentTarget.getBoundingClientRect();
                        const next = beginCalendarDragSelection({
                          pointerId: event.pointerId,
                          pointerType: event.pointerType,
                          isPrimary: event.isPrimary,
                          button: event.button,
                          date: day,
                          minute: yToSnappedMinute(event.clientY - rectangle.top, PIXELS_PER_MINUTE),
                          clientY: event.clientY,
                        });
                        if (next.status === "idle") return;
                        returnFocusRef.current = event.currentTarget;
                        dragOriginRef.current = event.currentTarget;
                        pointerClientYRef.current = event.clientY;
                        dragSelectionRef.current = next;
                        setDragSelection(next);
                        setHoveredSlot(null);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        const current = dragSelectionRef.current;
                        if (current.status === "idle" || current.pointerId !== event.pointerId) return;
                        pointerClientYRef.current = event.clientY;
                        const origin = dragOriginRef.current;
                        if (!origin) return;
                        const next = moveCalendarDragSelection(current, {
                          pointerId: event.pointerId,
                          minute: yToSnappedMinute(event.clientY - origin.getBoundingClientRect().top, PIXELS_PER_MINUTE),
                          clientY: event.clientY,
                        });
                        if (next.status === "selecting") event.preventDefault();
                        dragSelectionRef.current = next;
                        setDragSelection(next);
                      }}
                      onPointerUp={(event) => {
                        const current = dragSelectionRef.current;
                        if (current.status === "idle" || current.pointerId !== event.pointerId) return;
                        const origin = dragOriginRef.current;
                        if (!origin) return;
                        const completion = completeCalendarDragSelection(current, {
                          pointerId: event.pointerId,
                          minute: yToSnappedMinute(event.clientY - origin.getBoundingClientRect().top, PIXELS_PER_MINUTE),
                          clientY: event.clientY,
                        });
                        if (origin.hasPointerCapture(event.pointerId)) origin.releasePointerCapture(event.pointerId);
                        dragSelectionRef.current = completion.state;
                        setDragSelection(completion.state);
                        dragOriginRef.current = null;
                        if (completion.wasDrag && completion.selection) {
                          event.preventDefault();
                          suppressNextClickRef.current = true;
                          window.setTimeout(() => { suppressNextClickRef.current = false; }, 0);
                          openCreate(completion.selection, origin);
                        }
                      }}
                      onPointerCancel={(event) => {
                        const current = dragSelectionRef.current;
                        if (current.status === "idle" || current.pointerId !== event.pointerId) return;
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                        dragSelectionRef.current = cancelCalendarDragSelection();
                        setDragSelection(IDLE_CALENDAR_DRAG_SELECTION);
                        dragOriginRef.current = null;
                        setHoveredSlot(null);
                      }}
                    >
                      {hoveredSlot?.date === day ? <span
                        className={styles.slotHover}
                        style={{
                          top: (hoveredSlot.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE,
                          height: CALENDAR_LAB_CONFIG.slotMinutes * PIXELS_PER_MINUTE,
                        }}
                        aria-hidden="true"
                      /> : null}
                      {dragSelection.status === "selecting" && dragSelection.date === day ? <span
                        className={styles.selectionGhost}
                        style={{
                          top: (dragSelection.selection.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE,
                          height: Math.max(dragSelection.selection.durationMinutes * PIXELS_PER_MINUTE - 2, 14),
                        }}
                        aria-hidden="true"
                      >
                        {dragSelection.selection.durationMinutes >= 45 ? <strong>{minutesToTime(dragSelection.selection.startMinutes)} – {minutesToTime(dragSelection.selection.endMinutes)}</strong> : null}
                        {dragSelection.selection.durationMinutes >= 60 ? <span>{dragSelection.selection.durationMinutes} min</span> : null}
                      </span> : null}
                      {eventLayouts.filter((event) => event.date === day).map((event) => (
                        <EventChip
                          key={event.id}
                          event={event}
                          selected={state.selectedEventId === event.id}
                          menuOpen={contextMenu?.kind === "event" && contextMenu.eventId === event.id}
                          onSelect={openEdit}
                          onOpenContextMenu={(eventId, anchorPoint, origin) => setContextMenu({ kind: "event", eventId, anchorPoint, origin })}
                        />
                      ))}
                    </div>
                  ))}
                  {currentDayIndex >= 0 && labNowMinutes >= CALENDAR_LAB_CONFIG.startHour * 60 && labNowMinutes <= CALENDAR_LAB_CONFIG.endHour * 60 ? (
                    <div
                      className={styles.currentTime}
                      style={{
                        top: (labNowMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE,
                        left: `${currentDayIndex * (100 / 7)}%`,
                        width: `${100 / 7}%`,
                      }}
                      aria-label={`Ora corrente demo ${minutesToTime(labNowMinutes)}`}
                    ><span /></div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
        {drawerDraft ? <AppointmentDrawer
          key={selectedEvent?.id ?? `${state.selection?.date}-${state.selection?.startMinutes}`}
          initialDraft={drawerDraft}
          event={selectedEvent}
          returnFocus={returnFocusRef.current}
          onClose={closeDrawer}
          onSave={saveAppointment}
        /> : null}
        {contextMenu ? <ContextMenu
          anchorPoint={contextMenu.anchorPoint}
          origin={contextMenu.origin}
          scrollElement={scrollRef.current}
          items={contextMenu.kind === "empty"
            ? EMPTY_SLOT_CONTEXT_ITEMS
            : contextMenuItemsForEvent(state.events.find((event) => event.id === contextMenu.eventId)!)}
          header={contextMenu.kind === "event" ? <ContextMenuEventHeader event={state.events.find((event) => event.id === contextMenu.eventId)!} /> : undefined}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        /> : null}
      </div>
    </main>
  );
}

function IconButton({ label, expanded, onClick, children }: { label: string; expanded?: boolean; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }) {
  return <button type="button" className={styles.iconButton} aria-label={label} aria-expanded={expanded} onClick={onClick}>{children}</button>;
}

function DayHeader({ day, today }: { day: CalendarDate; today: CalendarDate }) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return <div className={`${styles.dayHeader} ${day === today ? styles.dayHeaderToday : ""}`}><span>{DAY_LABELS[weekday]}</span><strong>{Number(day.slice(8))}</strong></div>;
}

function TimeGutter() {
  const hours = Array.from({ length: CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour + 1 }, (_, index) => CALENDAR_LAB_CONFIG.startHour + index);
  return <div className={styles.timeGutter}>{hours.map((hour) => <span key={hour} style={{ top: (hour - CALENDAR_LAB_CONFIG.startHour) * CALENDAR_LAB_PIXELS_PER_HOUR }}>{String(hour).padStart(2, "0")}:00</span>)}</div>;
}

function EventChip({ event, selected, menuOpen, onSelect, onOpenContextMenu }: {
  event: CalendarLabEventLayout;
  selected: boolean;
  menuOpen: boolean;
  onSelect: (eventId: string, origin: HTMLElement) => void;
  onOpenContextMenu: (eventId: string, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
}) {
  const color = calendarLabEventColor(event);
  const duration = event.endMinutes - event.startMinutes;
  const top = (event.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE;
  const height = duration * PIXELS_PER_MINUTE;
  const compact = duration <= 30;
  const narrowCluster = event.columnCount >= 3;
  const contentDensity = calendarLabEventContentDensity(duration, narrowCluster);
  const showTime = contentDensity !== "name";
  const showService = contentDensity === "service" || contentDensity === "details";
  const showDetails = contentDensity === "details";
  const showSessionIndicator = showTime && event.status !== "cancelled";
  const displayName = narrowCluster
    ? event.patientName.split(" ").map((part) => part[0]).join("")
    : event.patientName;
  return (
    <button
      type="button"
      className={`${styles.event} ${compact ? styles.eventCompact : ""} ${narrowCluster ? styles.eventNarrow : ""} ${showSessionIndicator ? styles.eventWithState : ""} ${event.status === "cancelled" ? styles.eventCancelled : ""} ${selected ? styles.eventSelected : ""}`}
      style={{
        top,
        height: Math.max(height - 2, 18),
        ...eventHorizontalStyle(event),
        "--event-color": color,
        "--event-tint": colorToTint(color),
      } as React.CSSProperties}
      aria-pressed={selected}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label={`${event.patientName}, ${minutesToTime(event.startMinutes)}, ${duration} minuti, ${calendarLabSessionLabel(event)}`}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onSelect(event.id, clickEvent.currentTarget);
      }}
      onContextMenu={(contextEvent) => {
        contextEvent.preventDefault();
        contextEvent.stopPropagation();
        onOpenContextMenu(event.id, { x: contextEvent.clientX, y: contextEvent.clientY }, contextEvent.currentTarget);
      }}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key !== "ContextMenu" && !(keyboardEvent.shiftKey && keyboardEvent.key === "F10")) return;
        keyboardEvent.preventDefault();
        const rectangle = keyboardEvent.currentTarget.getBoundingClientRect();
        onOpenContextMenu(
          event.id,
          { x: rectangle.left + Math.min(24, rectangle.width / 2), y: rectangle.top + Math.min(24, rectangle.height / 2) },
          keyboardEvent.currentTarget,
        );
      }}
    >
      <strong>{displayName}</strong>
      {showTime ? <span>{minutesToTime(event.startMinutes)} · {duration} min</span> : null}
      {showService && event.serviceName ? <span>{event.serviceName}</span> : null}
      {showDetails && event.locationName ? <span className={styles.eventTertiary}>{event.locationName}</span> : null}
      {showSessionIndicator ? <span
        className={`${styles.sessionIndicator} ${event.sessionState === "registered" ? "" : styles.sessionPending}`}
        role="img"
        aria-label={event.sessionState === "registered" ? "Seduta registrata" : "Da registrare"}
      >{event.sessionState === "registered" ? "✓" : "•"}</span> : null}
    </button>
  );
}

function ContextMenuEventHeader({ event }: { event: CalendarLabEvent }) {
  const duration = event.endMinutes - event.startMinutes;
  return <>
    <strong>{event.patientName}</strong>
    {event.status === "cancelled"
      ? <span>Annullato</span>
      : <>
        <span>{minutesToTime(event.startMinutes)} · {duration} min</span>
        {event.sessionState === "registered" ? <span>✓ Seduta registrata</span> : null}
      </>}
  </>;
}

function MiniCalendar({ cursorDate, visibleWeek, today, onSelect }: { cursorDate: CalendarDate; visibleWeek: CalendarDate[]; today: CalendarDate; onSelect: (date: CalendarDate) => void }) {
  const first = `${cursorDate.slice(0, 7)}-01` as CalendarDate;
  const month = Number(cursorDate.slice(5, 7));
  const year = Number(cursorDate.slice(0, 4));
  const firstWeekday = new Date(`${first}T12:00:00Z`).getUTCDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const cells = Array.from({ length: 42 }, (_, index) => addCalendarDays(first, index - offset));
  return <section className={styles.miniCalendar} aria-label="Mini calendario">
    <div className={styles.miniTitle}><strong>{MONTHS[month - 1]} {year}</strong><span>Settimana</span></div>
    <div className={styles.miniWeekdays}>{["L", "M", "M", "G", "V", "S", "D"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    <div className={styles.miniDays}>{cells.map((date) => {
      const outside = date.slice(5, 7) !== cursorDate.slice(5, 7);
      const inWeek = visibleWeek.includes(date);
      return <button key={date} type="button" onClick={() => onSelect(date)} className={`${outside ? styles.outsideMonth : ""} ${inWeek ? styles.inWeek : ""} ${date === today ? styles.miniToday : ""}`} aria-label={formatFullDate(date)} aria-current={date === today ? "date" : undefined}>{Number(date.slice(8))}</button>;
    })}</div>
  </section>;
}

function FilterSection({ title, items, hidden, onToggle }: { title: string; items: Array<{ label: string; color: string }>; hidden: readonly string[]; onToggle: (label: string) => void }) {
  return <section className={styles.filterSection}><h2>{title}</h2><div>{items.map((item) => {
    const active = !hidden.includes(item.label);
    return <button key={item.label} type="button" aria-pressed={active} onClick={() => onToggle(item.label)}><span style={{ background: active ? item.color : "transparent", borderColor: item.color }} />{item.label}</button>;
  })}</div></section>;
}

function formatPeriod(days: CalendarDate[]) {
  const firstDay = Number(days[0].slice(8));
  const lastDay = Number(days[6].slice(8));
  const firstMonth = Number(days[0].slice(5, 7));
  const lastMonth = Number(days[6].slice(5, 7));
  const year = days[6].slice(0, 4);
  return firstMonth === lastMonth ? `${firstDay} – ${lastDay} ${MONTHS[lastMonth - 1]} ${year}` : `${firstDay} ${MONTHS[firstMonth - 1]} – ${lastDay} ${MONTHS[lastMonth - 1]} ${year}`;
}

function formatFullDate(date: CalendarDate) {
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function colorToTint(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16)) ?? [119, 168, 134];
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, 0.15)`;
}

function SidebarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>; }
function ComposeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8" /><path d="m10 14 1.5-4.5L18 3l3 3-6.5 6.5L10 14Z" /></svg>; }
function Chevron({ direction }: { direction: "left" | "right" | "down" }) { const path = direction === "left" ? "m15 18-6-6 6-6" : direction === "right" ? "m9 18 6-6-6-6" : "m6 9 6 6 6-6"; return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>; }
