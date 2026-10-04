"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import styles from "./calendar-v3-lab.module.css";
import { AppointmentDrawer } from "./appointment-drawer";
import { ContextMenu } from "./context-menu";
import { CommandPalette } from "./command-palette";
import {
  CALENDAR_LAB_CONFIG,
  addCalendarDays,
  calendarDateFromInstant,
  calendarTimeFromInstant,
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
import {
  isCalendarShortcutTypingTarget,
  type CalendarCommandId,
} from "@/lib/calendar-v3-lab/command-palette";
import {
  IDLE_CALENDAR_EVENT_MOVE,
  beginCalendarEventMove,
  calendarDayFromClientX,
  cancelCalendarEventMove,
  completeCalendarEventMove,
  isCalendarLabEventDraggable,
  moveCalendarEvent,
  type CalendarEventMoveState,
} from "@/lib/calendar-v3-lab/event-move";
import {
  IDLE_CALENDAR_EVENT_RESIZE,
  beginCalendarEventResize,
  cancelCalendarEventResize,
  completeCalendarEventResize,
  isCalendarLabEventResizable,
  resizeCalendarEvent,
  type CalendarEventResizeState,
} from "@/lib/calendar-v3-lab/event-resize";
import {
  calendarLabDaySummary,
  calendarLabVisibleDates,
  navigateCalendarLabDate,
  type CalendarLabView,
} from "@/lib/calendar-v3-lab/view";

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
  const daysGridRef = useRef<HTMLDivElement>(null);
  const commandButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<CalendarSelection | null>(null);
  const [dragSelection, setDragSelection] = useState<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const [eventMove, setEventMove] = useState<CalendarEventMoveState>(IDLE_CALENDAR_EVENT_MOVE);
  const [eventResize, setEventResize] = useState<CalendarEventResizeState>(IDLE_CALENDAR_EVENT_RESIZE);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenuState | null>(null);
  const [commandPaletteOrigin, setCommandPaletteOrigin] = useState<HTMLElement | null>(null);
  const dragSelectionRef = useRef<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const dragOriginRef = useRef<HTMLDivElement | null>(null);
  const eventMoveRef = useRef<CalendarEventMoveState>(IDLE_CALENDAR_EVENT_MOVE);
  const eventMoveOriginRef = useRef<HTMLButtonElement | null>(null);
  const eventResizeRef = useRef<CalendarEventResizeState>(IDLE_CALENDAR_EVENT_RESIZE);
  const eventResizeOriginRef = useRef<HTMLSpanElement | null>(null);
  const pointerClientYRef = useRef(0);
  const movePointerClientXRef = useRef(0);
  const movePointerClientYRef = useRef(0);
  const resizePointerClientYRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const suppressNextEventClickRef = useRef(false);
  const days = useMemo(() => calendarLabVisibleDates(state.view, state.cursorDate), [state.cursorDate, state.view]);
  const visibleEvents = state.events.filter((event) =>
    !state.hiddenFilters.includes(event.locationName ?? "") &&
    !state.hiddenFilters.includes(event.serviceName ?? ""),
  );
  const eventLayouts = useMemo(() => layoutCalendarLabEvents(visibleEvents), [visibleEvents]);
  const periodLabel = state.view === "day" ? formatFullDate(state.cursorDate) : formatPeriod(days);
  const daySummary = useMemo(
    () => calendarLabDaySummary(visibleEvents, state.cursorDate),
    [state.cursorDate, visibleEvents],
  );
  const labToday = calendarDateFromInstant(LAB_NOW);
  const labNowMinutes = timeToMinutes(calendarTimeFromInstant(LAB_NOW));
  const currentDayIndex = days.indexOf(labToday);
  const selectedEvent = state.events.find((event) => event.id === state.selectedEventId);
  const drawerDraft = selectedEvent
    ? appointmentDraftFromEvent(selectedEvent)
    : state.selection
      ? createAppointmentDraft(state.selection)
      : null;

  const goToToday = () => {
    setContextMenu(null);
    setCommandPaletteOrigin(null);
    dispatch({ type: "set_cursor_date", date: labToday });
  };

  const openDefaultCreate = (origin: HTMLElement) => {
    setContextMenu(null);
    setCommandPaletteOrigin(null);
    openCreate(normalizeCalendarSelection(state.cursorDate, 9 * 60, 9 * 60 + 45), origin);
  };

  const openCommandPalette = (origin: HTMLElement) => {
    setContextMenu(null);
    setCommandPaletteOrigin(origin);
  };

  useEffect(() => {
    const initialMinute = getInitialScrollMinute(days, LAB_NOW);
    const weekHeaderHeight = weekHeaderRef.current?.getBoundingClientRect().height ?? 0;
    scrollRef.current?.scrollTo({
      top: Math.max(0, weekHeaderHeight + (initialMinute - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE),
    });
  }, [days]);

  useEffect(() => {
    const cancelDrag = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const currentResize = eventResizeRef.current;
      if (currentResize.status !== "idle") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const origin = eventResizeOriginRef.current;
        if (origin?.hasPointerCapture(currentResize.pointerId)) origin.releasePointerCapture(currentResize.pointerId);
        eventResizeRef.current = cancelCalendarEventResize();
        setEventResize(IDLE_CALENDAR_EVENT_RESIZE);
        eventResizeOriginRef.current = null;
        return;
      }
      const currentMove = eventMoveRef.current;
      if (currentMove.status !== "idle") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const origin = eventMoveOriginRef.current;
        if (origin?.hasPointerCapture(currentMove.pointerId)) origin.releasePointerCapture(currentMove.pointerId);
        eventMoveRef.current = cancelCalendarEventMove();
        setEventMove(IDLE_CALENDAR_EVENT_MOVE);
        eventMoveOriginRef.current = null;
        return;
      }
      const current = dragSelectionRef.current;
      if (current.status === "idle") return;
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

  useEffect(() => {
    if (eventMove.status !== "moving") return;
    let frameId = 0;
    const advance = () => {
      const current = eventMoveRef.current;
      const scrollArea = scrollRef.current;
      const grid = daysGridRef.current;
      if (current.status !== "moving" || !scrollArea || !grid) return;
      const scrollRectangle = scrollArea.getBoundingClientRect();
      const velocity = calendarDragAutoScrollVelocity(movePointerClientYRef.current, scrollRectangle.top, scrollRectangle.bottom);
      if (velocity !== 0) {
        const previousScrollTop = scrollArea.scrollTop;
        scrollArea.scrollTop += velocity;
        if (scrollArea.scrollTop !== previousScrollTop) {
          const gridRectangle = grid.getBoundingClientRect();
          const next = moveCalendarEvent(current, {
            pointerId: current.pointerId,
            date: calendarDayFromClientX(movePointerClientXRef.current, gridRectangle.left, gridRectangle.width, days),
            pointerMinute: yToSnappedMinute(movePointerClientYRef.current - gridRectangle.top, PIXELS_PER_MINUTE),
            clientX: movePointerClientXRef.current,
            clientY: movePointerClientYRef.current,
          });
          eventMoveRef.current = next;
          setEventMove(next);
        }
      }
      frameId = window.requestAnimationFrame(advance);
    };
    frameId = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(frameId);
  }, [days, eventMove.status]);

  useEffect(() => {
    if (eventResize.status !== "resizing") return;
    let frameId = 0;
    const advance = () => {
      const current = eventResizeRef.current;
      const scrollArea = scrollRef.current;
      const grid = daysGridRef.current;
      if (current.status !== "resizing" || !scrollArea || !grid) return;
      const scrollRectangle = scrollArea.getBoundingClientRect();
      const velocity = calendarDragAutoScrollVelocity(resizePointerClientYRef.current, scrollRectangle.top, scrollRectangle.bottom);
      if (velocity !== 0) {
        const previousScrollTop = scrollArea.scrollTop;
        scrollArea.scrollTop += velocity;
        if (scrollArea.scrollTop !== previousScrollTop) {
          const gridRectangle = grid.getBoundingClientRect();
          const next = resizeCalendarEvent(current, {
            pointerId: current.pointerId,
            pointerEndMinute: yToSnappedMinute(resizePointerClientYRef.current - gridRectangle.top, PIXELS_PER_MINUTE),
            clientY: resizePointerClientYRef.current,
          });
          eventResizeRef.current = next;
          setEventResize(next);
        }
      }
      frameId = window.requestAnimationFrame(advance);
    };
    frameId = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(frameId);
  }, [eventResize.status]);

  useEffect(() => {
    const handleCalendarShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || drawerDraft || dragSelectionRef.current.status !== "idle" || eventMoveRef.current.status !== "idle" || eventResizeRef.current.status !== "idle") return;
      if (isCalendarShortcutTypingTarget(event.target)) return;
      const key = event.key.toLocaleLowerCase("it");
      if ((event.metaKey || event.ctrlKey) && !event.altKey && key === "k") {
        event.preventDefault();
        if (!commandPaletteOrigin) {
          const origin = document.activeElement instanceof HTMLElement ? document.activeElement : commandButtonRef.current;
          if (origin) openCommandPalette(origin);
        }
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (key === "t") {
        event.preventDefault();
        goToToday();
      } else if (key === "c") {
        event.preventDefault();
        const origin = document.activeElement instanceof HTMLElement ? document.activeElement : commandButtonRef.current;
        if (origin) openDefaultCreate(origin);
      }
    };
    document.addEventListener("keydown", handleCalendarShortcut);
    return () => document.removeEventListener("keydown", handleCalendarShortcut);
  }, [commandPaletteOrigin, drawerDraft, state.cursorDate]);

  const movePeriod = (direction: -1 | 1) => {
    dispatch({ type: "set_cursor_date", date: navigateCalendarLabDate(state.view, state.cursorDate, direction) });
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

  const eventMoveTarget = (clientX: number, clientY: number) => {
    const gridRectangle = daysGridRef.current?.getBoundingClientRect();
    if (!gridRectangle) return null;
    return {
      date: calendarDayFromClientX(clientX, gridRectangle.left, gridRectangle.width, days),
      pointerMinute: yToSnappedMinute(clientY - gridRectangle.top, PIXELS_PER_MINUTE),
    };
  };

  const beginEventMove = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (drawerDraft || eventResizeRef.current.status !== "idle") return;
    const target = eventMoveTarget(pointerEvent.clientX, pointerEvent.clientY);
    if (!target) return;
    const next = beginCalendarEventMove({
      event,
      pointerId: pointerEvent.pointerId,
      pointerType: pointerEvent.pointerType,
      isPrimary: pointerEvent.isPrimary,
      button: pointerEvent.button,
      pointerMinute: target.pointerMinute,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "idle") return;
    setContextMenu(null);
    setCommandPaletteOrigin(null);
    setHoveredSlot(null);
    movePointerClientXRef.current = pointerEvent.clientX;
    movePointerClientYRef.current = pointerEvent.clientY;
    eventMoveOriginRef.current = pointerEvent.currentTarget;
    eventMoveRef.current = next;
    setEventMove(next);
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  };

  const updateEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    const current = eventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const target = eventMoveTarget(pointerEvent.clientX, pointerEvent.clientY);
    if (!target) return;
    movePointerClientXRef.current = pointerEvent.clientX;
    movePointerClientYRef.current = pointerEvent.clientY;
    const next = moveCalendarEvent(current, {
      pointerId: pointerEvent.pointerId,
      ...target,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "moving") pointerEvent.preventDefault();
    eventMoveRef.current = next;
    setEventMove(next);
  };

  const finishEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    const current = eventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const target = eventMoveTarget(pointerEvent.clientX, pointerEvent.clientY);
    if (!target) return;
    const completion = completeCalendarEventMove(current, {
      pointerId: pointerEvent.pointerId,
      ...target,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    eventMoveRef.current = completion.state;
    setEventMove(completion.state);
    eventMoveOriginRef.current = null;
    if (completion.wasMove && completion.event) {
      pointerEvent.preventDefault();
      suppressNextEventClickRef.current = true;
      dispatch({ type: "move_event", event: completion.event });
      window.setTimeout(() => { suppressNextEventClickRef.current = false; }, 0);
    }
  };

  const abortEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    const current = eventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    eventMoveRef.current = cancelCalendarEventMove();
    setEventMove(IDLE_CALENDAR_EVENT_MOVE);
    eventMoveOriginRef.current = null;
  };

  const eventResizeTarget = (clientY: number) => {
    const gridRectangle = daysGridRef.current?.getBoundingClientRect();
    if (!gridRectangle) return null;
    return yToSnappedMinute(clientY - gridRectangle.top, PIXELS_PER_MINUTE);
  };

  const beginEventResize = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    if (drawerDraft || eventMoveRef.current.status !== "idle" || dragSelectionRef.current.status !== "idle") return;
    const next = beginCalendarEventResize({
      event,
      pointerId: pointerEvent.pointerId,
      pointerType: pointerEvent.pointerType,
      isPrimary: pointerEvent.isPrimary,
      button: pointerEvent.button,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "idle") return;
    setContextMenu(null);
    setCommandPaletteOrigin(null);
    setHoveredSlot(null);
    resizePointerClientYRef.current = pointerEvent.clientY;
    eventResizeOriginRef.current = pointerEvent.currentTarget;
    eventResizeRef.current = next;
    setEventResize(next);
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  };

  const updateEventResize = (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    const current = eventResizeRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const pointerEndMinute = eventResizeTarget(pointerEvent.clientY);
    if (pointerEndMinute === null) return;
    resizePointerClientYRef.current = pointerEvent.clientY;
    const next = resizeCalendarEvent(current, {
      pointerId: pointerEvent.pointerId,
      pointerEndMinute,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "resizing") pointerEvent.preventDefault();
    eventResizeRef.current = next;
    setEventResize(next);
  };

  const finishEventResize = (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    const current = eventResizeRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const pointerEndMinute = eventResizeTarget(pointerEvent.clientY);
    if (pointerEndMinute === null) return;
    const completion = completeCalendarEventResize(current, {
      pointerId: pointerEvent.pointerId,
      pointerEndMinute,
      clientY: pointerEvent.clientY,
    });
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    eventResizeRef.current = completion.state;
    setEventResize(completion.state);
    eventResizeOriginRef.current = null;
    if (completion.wasResize && completion.event) {
      pointerEvent.preventDefault();
      dispatch({ type: "resize_event", event: completion.event });
    }
  };

  const abortEventResize = (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    const current = eventResizeRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    eventResizeRef.current = cancelCalendarEventResize();
    setEventResize(IDLE_CALENDAR_EVENT_RESIZE);
    eventResizeOriginRef.current = null;
  };

  const closeDrawer = () => {
    dragSelectionRef.current = IDLE_CALENDAR_DRAG_SELECTION;
    setDragSelection(IDLE_CALENDAR_DRAG_SELECTION);
    eventMoveRef.current = IDLE_CALENDAR_EVENT_MOVE;
    setEventMove(IDLE_CALENDAR_EVENT_MOVE);
    eventResizeRef.current = IDLE_CALENDAR_EVENT_RESIZE;
    setEventResize(IDLE_CALENDAR_EVENT_RESIZE);
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

  const handleCalendarCommand = (command: Exclude<CalendarCommandId, "go_to_date">) => {
    const origin = commandPaletteOrigin ?? commandButtonRef.current;
    if (command === "create" && origin) openDefaultCreate(origin);
    else if (command === "today") {
      goToToday();
      window.requestAnimationFrame(() => origin?.focus());
    } else if (command === "week" || command === "day") {
      dispatch({ type: "set_view", view: command });
      setCommandPaletteOrigin(null);
      window.requestAnimationFrame(() => origin?.focus());
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.mobileFallback}>
        <span className={styles.mobileMark}>Calendar V3 Lab</span>
        <h1>La vista mobile verrà progettata separatamente.</h1>
        <p>Questa fase valuta le viste desktop Giorno e Settimana di ARMONIA. Apri il laboratorio da uno schermo di almeno 768 px.</p>
      </div>

      <div className={styles.desktopApp}>
        <header className={styles.toolbar}>
          <div className={styles.toolbarCluster}>
            <IconButton
              label={state.sidebarOpen ? "Nascondi barra laterale" : "Mostra barra laterale"}
              expanded={state.sidebarOpen}
              onClick={() => dispatch({ type: "set_sidebar_open", open: !state.sidebarOpen })}
            ><SidebarIcon /></IconButton>
            <IconButton buttonRef={commandButtonRef} label="Cerca o esegui un comando, ⌘K o Ctrl+K" onClick={(event) => openCommandPalette(event.currentTarget)}><SearchIcon /></IconButton>
            <IconButton label="Nuovo appuntamento" onClick={(event) => openDefaultCreate(event.currentTarget)}><ComposeIcon /></IconButton>
          </div>

          <p className={styles.periodLabel} aria-live="polite">{periodLabel}</p>

          <div className={`${styles.toolbarCluster} ${styles.toolbarRight}`}>
            <button type="button" className={styles.textButton} onClick={goToToday}>Oggi</button>
            <IconButton label={state.view === "day" ? "Giorno precedente" : "Settimana precedente"} onClick={() => movePeriod(-1)}><Chevron direction="left" /></IconButton>
            <IconButton label={state.view === "day" ? "Giorno successivo" : "Settimana successiva"} onClick={() => movePeriod(1)}><Chevron direction="right" /></IconButton>
            <label className={styles.viewSelector}>
              <span className={styles.srOnly}>Vista calendario</span>
              <select
                aria-label={`Vista corrente: ${state.view === "day" ? "Giorno" : "Settimana"}`}
                value={state.view}
                onChange={(event) => dispatch({ type: "set_view", view: event.target.value as CalendarLabView })}
              >
                <option value="day">Giorno</option>
                <option value="week">Settimana</option>
                <option value="month" disabled>Mese · Prossimamente</option>
              </select>
              <Chevron direction="down" />
            </label>
          </div>
        </header>

        <div className={styles.workspace}>
          <aside className={`${styles.sidebar} ${state.sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`} aria-hidden={!state.sidebarOpen}>
            <div className={styles.sidebarInner}>
              <MiniCalendar cursorDate={state.cursorDate} visibleDates={days} view={state.view} today={labToday} onSelect={(date) => dispatch({ type: "set_cursor_date", date })} />
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

          <section className={`${styles.calendarPane} ${state.view === "day" ? styles.calendarPaneDay : ""}`} aria-label={`Calendario ${state.view === "day" ? "giornaliero" : "settimanale"}, ${periodLabel}`}>
            <div ref={scrollRef} className={styles.scrollArea}>
              <div ref={weekHeaderRef} className={`${styles.weekHeader} ${state.view === "day" ? styles.dayViewHeader : ""}`}>
                <div className={styles.gutterHeader}><span>CEST</span></div>
                {state.view === "day"
                  ? <DayViewHeading date={state.cursorDate} summary={daySummary} />
                  : days.map((day) => <DayHeader key={day} day={day} today={labToday} />)}
              </div>
              <div className={styles.timeGrid} style={{ height: GRID_HEIGHT }}>
                <TimeGutter />
                <div ref={daysGridRef} className={styles.daysGrid}>
                  {days.map((day) => (
                    <div
                      key={day}
                      tabIndex={-1}
                      className={`${styles.dayColumn} ${day === labToday ? styles.todayColumn : ""} ${dragSelection.status !== "idle" && dragSelection.date === day ? styles.dayColumnSelecting : ""} ${eventMove.status === "moving" && eventMove.preview.date === day ? styles.dayColumnSelecting : ""} ${eventResize.status === "resizing" && eventResize.preview.date === day ? styles.dayColumnSelecting : ""}`}
                      aria-label={formatFullDate(day)}
                      onMouseMove={(event) => {
                        if (dragSelection.status !== "idle" || eventMove.status !== "idle" || eventResize.status !== "idle") return;
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
                        setCommandPaletteOrigin(null);
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
                      {eventMove.status === "moving" && eventMove.preview.date === day ? <span
                        className={styles.moveGhost}
                        style={{
                          top: (eventMove.preview.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE,
                          height: Math.max((eventMove.preview.endMinutes - eventMove.preview.startMinutes) * PIXELS_PER_MINUTE - 2, 18),
                          "--event-color": calendarLabEventColor(eventMove.preview),
                          "--event-tint": colorToTint(calendarLabEventColor(eventMove.preview)),
                        } as React.CSSProperties}
                        aria-hidden="true"
                      >
                        <strong>{eventMove.preview.patientName}</strong>
                        <span>{minutesToTime(eventMove.preview.startMinutes)} – {minutesToTime(eventMove.preview.endMinutes)}</span>
                      </span> : null}
                      {eventLayouts.filter((event) => event.date === day).map((event) => {
                        const resizing = eventResize.status === "resizing" && eventResize.before.id === event.id;
                        const renderedEvent = resizing
                          ? { ...event, endMinutes: eventResize.preview.endMinutes }
                          : event;
                        return <EventChip
                          key={renderedEvent.id}
                          event={renderedEvent}
                          view={state.view}
                          selected={state.selectedEventId === event.id}
                          menuOpen={contextMenu?.kind === "event" && contextMenu.eventId === event.id}
                          moving={eventMove.status === "moving" && eventMove.before.id === event.id}
                          resizing={resizing}
                          draggable={isCalendarLabEventDraggable(event)}
                          resizable={isCalendarLabEventResizable(event)}
                          onSelect={(eventId, origin) => {
                            if (suppressNextEventClickRef.current) {
                              suppressNextEventClickRef.current = false;
                              return;
                            }
                            openEdit(eventId, origin);
                          }}
                          onPointerDown={beginEventMove}
                          onPointerMove={updateEventMove}
                          onPointerUp={finishEventMove}
                          onPointerCancel={abortEventMove}
                          onResizePointerDown={beginEventResize}
                          onResizePointerMove={updateEventResize}
                          onResizePointerUp={finishEventResize}
                          onResizePointerCancel={abortEventResize}
                          onOpenContextMenu={(eventId, anchorPoint, origin) => {
                            setCommandPaletteOrigin(null);
                            setContextMenu({ kind: "event", eventId, anchorPoint, origin });
                          }}
                        />;
                      })}
                    </div>
                  ))}
                  {currentDayIndex >= 0 && labNowMinutes >= CALENDAR_LAB_CONFIG.startHour * 60 && labNowMinutes <= CALENDAR_LAB_CONFIG.endHour * 60 ? (
                    <div
                      className={styles.currentTime}
                      style={{
                        top: (labNowMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE,
                        left: `${currentDayIndex * (100 / days.length)}%`,
                        width: `${100 / days.length}%`,
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
        {commandPaletteOrigin ? <CommandPalette
          origin={commandPaletteOrigin}
          activeView={state.view}
          onCommand={handleCalendarCommand}
          onGoToDate={(date) => {
            const origin = commandPaletteOrigin;
            setCommandPaletteOrigin(null);
            dispatch({ type: "set_cursor_date", date });
            window.requestAnimationFrame(() => origin?.focus());
          }}
          onClose={() => setCommandPaletteOrigin(null)}
        /> : null}
      </div>
    </main>
  );
}

function IconButton({ label, expanded, buttonRef, onClick, children }: { label: string; expanded?: boolean; buttonRef?: React.Ref<HTMLButtonElement>; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }) {
  return <button ref={buttonRef} type="button" className={styles.iconButton} aria-label={label} aria-expanded={expanded} onClick={onClick}>{children}</button>;
}

function DayHeader({ day, today }: { day: CalendarDate; today: CalendarDate }) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return <div className={`${styles.dayHeader} ${day === today ? styles.dayHeaderToday : ""}`}><span>{DAY_LABELS[weekday]}</span><strong>{Number(day.slice(8))}</strong></div>;
}

function DayViewHeading({ date, summary }: { date: CalendarDate; summary: { appointmentCount: number; occupiedMinutes: number } }) {
  const heading = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  const summaryLabel = summary.appointmentCount === 0
    ? "Nessun appuntamento"
    : `${summary.appointmentCount} ${summary.appointmentCount === 1 ? "appuntamento" : "appuntamenti"} · ${formatOccupiedTime(summary.occupiedMinutes)}`;
  return <div className={styles.dayViewHeading}>
    <h1>{heading}</h1>
    <p>{summaryLabel}</p>
  </div>;
}

function TimeGutter() {
  const hours = Array.from({ length: CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour + 1 }, (_, index) => CALENDAR_LAB_CONFIG.startHour + index);
  return <div className={styles.timeGutter}>{hours.map((hour) => <span key={hour} style={{ top: (hour - CALENDAR_LAB_CONFIG.startHour) * CALENDAR_LAB_PIXELS_PER_HOUR }}>{String(hour).padStart(2, "0")}:00</span>)}</div>;
}

function EventChip({ event, view, selected, menuOpen, moving, resizing, draggable, resizable, onSelect, onOpenContextMenu, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onResizePointerDown, onResizePointerMove, onResizePointerUp, onResizePointerCancel }: {
  event: CalendarLabEventLayout;
  view: CalendarLabView;
  selected: boolean;
  menuOpen: boolean;
  moving: boolean;
  resizing: boolean;
  draggable: boolean;
  resizable: boolean;
  onSelect: (eventId: string, origin: HTMLElement) => void;
  onOpenContextMenu: (eventId: string, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onPointerDown: (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLSpanElement>) => void;
  onResizePointerMove: (pointerEvent: React.PointerEvent<HTMLSpanElement>) => void;
  onResizePointerUp: (pointerEvent: React.PointerEvent<HTMLSpanElement>) => void;
  onResizePointerCancel: (pointerEvent: React.PointerEvent<HTMLSpanElement>) => void;
}) {
  const allowTouchHandleClickRef = useRef(false);
  const color = calendarLabEventColor(event);
  const duration = event.endMinutes - event.startMinutes;
  const top = (event.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE;
  const height = duration * PIXELS_PER_MINUTE;
  const compact = duration <= 30;
  const narrowCluster = event.columnCount >= 3;
  const contentDensity = calendarLabEventContentDensity(duration, narrowCluster);
  const dayView = view === "day";
  const showTime = dayView ? duration >= 30 : contentDensity !== "name";
  const showService = dayView ? duration >= 45 : contentDensity === "service" || contentDensity === "details";
  const showDetails = dayView ? duration >= 60 : contentDensity === "details";
  const showSessionIndicator = showTime && event.status !== "cancelled";
  const displayName = narrowCluster
    ? event.patientName.split(" ").map((part) => part[0]).join("")
    : event.patientName;
  return (
    <button
      type="button"
      className={`${styles.event} ${dayView ? styles.eventDay : ""} ${compact ? styles.eventCompact : ""} ${narrowCluster ? styles.eventNarrow : ""} ${showSessionIndicator ? styles.eventWithState : ""} ${event.status === "cancelled" ? styles.eventCancelled : ""} ${selected ? styles.eventSelected : ""} ${draggable ? styles.eventDraggable : ""} ${moving ? styles.eventMovingOrigin : ""} ${resizing ? styles.eventResizing : ""}`}
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
      onPointerDown={(pointerEvent) => onPointerDown(event, pointerEvent)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
      {dayView ? <>
        <span className={styles.eventDayPrimary}>
          <strong>{displayName}</strong>
          {showTime ? <span>{minutesToTime(event.startMinutes)}–{minutesToTime(event.endMinutes)} · {duration} min</span> : null}
        </span>
        {showService || showDetails ? <span className={styles.eventDaySecondary}>
          {showService && event.serviceName ? <span>{event.serviceName}</span> : null}
          {showDetails && event.locationName ? <span className={styles.eventTertiary}>{event.locationName}</span> : null}
        </span> : null}
      </> : <>
        <strong>{displayName}</strong>
        {showTime ? <span>{minutesToTime(event.startMinutes)} · {duration} min</span> : null}
        {showService && event.serviceName ? <span>{event.serviceName}</span> : null}
        {showDetails && event.locationName ? <span className={styles.eventTertiary}>{event.locationName}</span> : null}
      </>}
      {showSessionIndicator ? <span
        className={`${styles.sessionIndicator} ${event.sessionState === "registered" ? "" : styles.sessionPending}`}
        role="img"
        aria-label={event.sessionState === "registered" ? "Seduta registrata" : "Da registrare"}
      >{event.sessionState === "registered" ? "✓" : "•"}</span> : null}
      {resizable ? <span
        className={`${styles.resizeHandle} ${resizing ? styles.resizeHandleActive : ""}`}
        aria-hidden="true"
        onPointerDown={(pointerEvent) => {
          if (pointerEvent.pointerType === "touch") {
            allowTouchHandleClickRef.current = true;
            return;
          }
          pointerEvent.preventDefault();
          pointerEvent.stopPropagation();
          onResizePointerDown(event, pointerEvent);
        }}
        onPointerMove={(pointerEvent) => {
          if (pointerEvent.pointerType === "touch") return;
          pointerEvent.stopPropagation();
          onResizePointerMove(pointerEvent);
        }}
        onPointerUp={(pointerEvent) => {
          if (pointerEvent.pointerType === "touch") return;
          pointerEvent.stopPropagation();
          onResizePointerUp(pointerEvent);
        }}
        onPointerCancel={(pointerEvent) => {
          if (pointerEvent.pointerType === "touch") {
            allowTouchHandleClickRef.current = false;
            return;
          }
          pointerEvent.stopPropagation();
          onResizePointerCancel(pointerEvent);
        }}
        onClick={(clickEvent) => {
          if (allowTouchHandleClickRef.current) {
            allowTouchHandleClickRef.current = false;
            return;
          }
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        }}
      /> : null}
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

function MiniCalendar({ cursorDate, visibleDates, view, today, onSelect }: { cursorDate: CalendarDate; visibleDates: CalendarDate[]; view: CalendarLabView; today: CalendarDate; onSelect: (date: CalendarDate) => void }) {
  const first = `${cursorDate.slice(0, 7)}-01` as CalendarDate;
  const month = Number(cursorDate.slice(5, 7));
  const year = Number(cursorDate.slice(0, 4));
  const firstWeekday = new Date(`${first}T12:00:00Z`).getUTCDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const cells = Array.from({ length: 42 }, (_, index) => addCalendarDays(first, index - offset));
  return <section className={styles.miniCalendar} aria-label="Mini calendario">
    <div className={styles.miniTitle}><strong>{MONTHS[month - 1]} {year}</strong><span>{view === "day" ? "Giorno" : "Settimana"}</span></div>
    <div className={styles.miniWeekdays}>{["L", "M", "M", "G", "V", "S", "D"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    <div className={styles.miniDays}>{cells.map((date) => {
      const outside = date.slice(5, 7) !== cursorDate.slice(5, 7);
      const visible = visibleDates.includes(date);
      return <button key={date} type="button" onClick={() => onSelect(date)} className={`${outside ? styles.outsideMonth : ""} ${visible ? styles.inWeek : ""} ${view === "day" && date === cursorDate ? styles.miniSelectedDay : ""} ${date === today ? styles.miniToday : ""}`} aria-label={formatFullDate(date)} aria-current={date === cursorDate ? "date" : undefined}>{Number(date.slice(8))}</button>;
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

function formatOccupiedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} h`;
  return `${hours} h ${remainder} min`;
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
