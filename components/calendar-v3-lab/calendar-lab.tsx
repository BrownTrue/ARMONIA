"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./calendar-v3-lab.module.css";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { MobileCalendar } from "./mobile-calendar";
import { MobileCalendarDialogHost } from "./mobile-dialog-host";
import { MobileCalendarFilters, MobileCalendarSettings } from "./mobile-calendar-tools";
import { AppointmentDrawer } from "./appointment-drawer";
import { AppointmentDetailPanel } from "./appointment-detail-panel";
import { AppointmentCancelDialog } from "./appointment-cancel-dialog";
import { SessionRegistrationPanel } from "./session-registration-panel";
import { CalendarSidebarCatalog } from "./calendar-sidebar-catalog";
import { GoogleCalendarStatus } from "./google-calendar-status";
import { ContextMenu } from "./context-menu";
import { CommandPalette } from "./command-palette";
import { RecurrenceScopeDialog } from "./recurrence-scope-dialog";
import {
  CALENDAR_LAB_CONFIG,
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
  contextMenuItemsForRealAppointment,
  duplicateCalendarLabEvent,
  type CalendarContextMenuAction,
} from "@/lib/calendar-v3-lab/context-menu";
import {
  getCalendarV3RealAppointmentActions,
  type CalendarV3RealAppointmentActionId,
} from "@/lib/calendar-v3-lab/real-appointment-actions";
import { cancelAppointment } from "@/lib/appointment-actions";
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
  calendarLabPeriodLabel,
  calendarLabVisibleDates,
  navigateCalendarLabDate,
  type CalendarLabView,
} from "@/lib/calendar-v3-lab/view";
import {
  CALENDAR_MONTH_VISIBLE_EVENT_LIMIT,
  calendarMonthDays,
  calendarMonthEventSlice,
  calendarMonthEventsByDate,
  isCalendarDateInMonth,
} from "@/lib/calendar-v3-lab/month-view";
import {
  IDLE_CALENDAR_MONTH_EVENT_MOVE,
  beginCalendarMonthEventMove,
  calendarMonthDateFromClientPoint,
  cancelCalendarMonthEventMove,
  completeCalendarMonthEventMove,
  moveCalendarMonthEvent,
  type CalendarMonthEventMoveState,
} from "@/lib/calendar-v3-lab/month-event-move";
import { adaptCalendarV3RealData } from "@/lib/calendar-v3-lab/real-data-adapter";
import {
  buildCalendarV3AppointmentSavePlan,
  calendarV3RealAppointmentDraftFromAppointment,
  createCalendarV3RealAppointmentDraft,
  isCalendarV3RealAppointmentDraft,
} from "@/lib/calendar-v3-lab/real-appointment-editor";
import {
  appointmentAfterCalendarV3RealGesture,
  executeCalendarV3RealGesture,
  getCalendarV3GestureBlockReason,
  isCalendarV3RealGestureEligible,
  type CalendarV3RealGesture,
} from "@/lib/calendar-v3-lab/real-appointment-gesture";
import {
  IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT,
  beginCalendarBlockedGestureAttempt,
  cancelCalendarBlockedGestureAttempt,
  completeCalendarBlockedGestureAttempt,
  moveCalendarBlockedGestureAttempt,
  type CalendarBlockedGestureAttempt,
} from "@/lib/calendar-v3-lab/blocked-gesture-attempt";
import {
  buildCalendarV3RecurrencePlan,
  calendarV3RecurrencePlanSummary,
  executeCalendarV3RecurrencePlan,
  hasCalendarV3AppointmentChanges,
  type CalendarV3RecurrenceScope,
  type CalendarV3RecurringMutation,
} from "@/lib/calendar-v3-lab/recurrence-scope";
import { uid, type Appointment } from "@/lib/types";
import {
  fixtureLocationFilterKey,
  fixtureServiceFilterKey,
  locationFilterKey,
  serviceFilterKey,
  type CalendarSidebarMode,
} from "@/lib/calendar-v3-lab/sidebar-settings";
import {
  CALENDAR_CREATE_DRAFT_PREVIEW_ID,
  calendarCreateDraftPreview,
} from "@/lib/calendar-v3-lab/create-draft-preview";

const LAB_NOW = new Date("2026-10-05T08:00:00.000Z");
const DAY_LABELS = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GRID_HEIGHT = (CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour) * CALENDAR_LAB_PIXELS_PER_HOUR;
const PIXELS_PER_MINUTE = CALENDAR_LAB_PIXELS_PER_HOUR / 60;

type CalendarContextMenuState =
  | { kind: "empty"; anchorPoint: { x: number; y: number }; origin: HTMLElement; selection: CalendarSelection }
  | { kind: "event"; anchorPoint: { x: number; y: number }; origin: HTMLElement; eventId: string };

type CalendarRealMutation = {
  appointmentId: string;
  gesture: CalendarV3RecurringMutation;
};

type CalendarRecurrenceRequest = {
  selectedBefore: Appointment;
  selectedAfter: Appointment;
  mutation: CalendarV3RecurringMutation;
  source: "gesture" | "drawer";
  origin: HTMLElement | null;
};

type CalendarGestureFeedback = {
  tone: "info" | "error";
  message: string;
};

type CalendarPanelMode = "closed" | "appointment-create" | "appointment-detail" | "appointment-edit" | "session-create";
type MobileCalendarSurface = "calendar" | "filters" | "settings";

export function CalendarLab({ dataMode = "fixture", canonicalHref = "/calendar-v3-lab", showModeNotice = false }: {
  dataMode?: "fixture" | "real";
  canonicalHref?: string;
  showModeNotice?: boolean;
}) {
  const { data, ready, saveAppointment: saveRealAppointment, saveAppointments: saveRealAppointments } = useData();
  const router = useRouter();
  const realMode = dataMode === "real";
  const [state, dispatch] = useReducer(calendarLabReducer, CALENDAR_LAB_EVENTS, createCalendarLabState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekHeaderRef = useRef<HTMLDivElement>(null);
  const daysGridRef = useRef<HTMLDivElement>(null);
  const commandButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<CalendarSelection | null>(null);
  const [dragSelection, setDragSelection] = useState<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const [eventMove, setEventMove] = useState<CalendarEventMoveState>(IDLE_CALENDAR_EVENT_MOVE);
  const [monthEventMove, setMonthEventMove] = useState<CalendarMonthEventMoveState>(IDLE_CALENDAR_MONTH_EVENT_MOVE);
  const [eventResize, setEventResize] = useState<CalendarEventResizeState>(IDLE_CALENDAR_EVENT_RESIZE);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenuState | null>(null);
  const [commandPaletteOrigin, setCommandPaletteOrigin] = useState<HTMLElement | null>(null);
  const [expandedMonthDate, setExpandedMonthDate] = useState<CalendarDate | null>(null);
  const [realMutation, setRealMutation] = useState<CalendarRealMutation | null>(null);
  const [gestureFeedback, setGestureFeedback] = useState<CalendarGestureFeedback | null>(null);
  const [recurrenceRequest, setRecurrenceRequest] = useState<CalendarRecurrenceRequest | null>(null);
  const [recurrenceError, setRecurrenceError] = useState("");
  const [cancelCandidate, setCancelCandidate] = useState<Appointment | null>(null);
  const [appointmentActionBusy, setAppointmentActionBusy] = useState<CalendarV3RealAppointmentActionId | null>(null);
  const [appointmentActionError, setAppointmentActionError] = useState("");
  const [panelMode, setPanelMode] = useState<CalendarPanelMode>("closed");
  const [sidebarMode, setSidebarMode] = useState<CalendarSidebarMode>({ kind: "main" });
  const [mobileSurface, setMobileSurface] = useState<MobileCalendarSurface>("calendar");
  const [createDraft, setCreateDraft] = useState<CalendarAppointmentDraft | null>(null);
  const dragSelectionRef = useRef<CalendarDragSelectionState>(IDLE_CALENDAR_DRAG_SELECTION);
  const dragOriginRef = useRef<HTMLDivElement | null>(null);
  const eventMoveRef = useRef<CalendarEventMoveState>(IDLE_CALENDAR_EVENT_MOVE);
  const eventMoveOriginRef = useRef<HTMLButtonElement | null>(null);
  const monthGridRef = useRef<HTMLDivElement | null>(null);
  const monthEventMoveRef = useRef<CalendarMonthEventMoveState>(IDLE_CALENDAR_MONTH_EVENT_MOVE);
  const monthEventMoveOriginRef = useRef<HTMLButtonElement | null>(null);
  const eventResizeRef = useRef<CalendarEventResizeState>(IDLE_CALENDAR_EVENT_RESIZE);
  const eventResizeOriginRef = useRef<HTMLSpanElement | null>(null);
  const pointerClientYRef = useRef(0);
  const movePointerClientXRef = useRef(0);
  const movePointerClientYRef = useRef(0);
  const resizePointerClientYRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const suppressNextEventClickRef = useRef(false);
  const realModeInitializedRef = useRef(false);
  const realMutationRef = useRef<CalendarRealMutation | null>(null);
  const blockedGestureAttemptRef = useRef<CalendarBlockedGestureAttempt>(IDLE_CALENDAR_BLOCKED_GESTURE_ATTEMPT);
  const blockedGestureMessageRef = useRef<string | null>(null);
  const gestureFeedbackTimeoutRef = useRef<number | null>(null);
  const appointmentActionOriginRef = useRef<HTMLElement | null>(null);
  const realData = useMemo(() => adaptCalendarV3RealData({
    appointments: data.appointments,
    patients: data.patients,
    locations: data.locations,
    services: data.services,
    sessions: data.sessions,
  }), [data.appointments, data.locations, data.patients, data.services, data.sessions]);
  const activeEvents = realMode ? realData.events : state.events;
  const days = useMemo(() => calendarLabVisibleDates(state.view, state.cursorDate), [state.cursorDate, state.view]);
  const visibleEvents = activeEvents.filter((event) => {
    const locationKey = realMode && event.locationId
      ? locationFilterKey(event.locationId)
      : event.locationName ? fixtureLocationFilterKey(event.locationName) : null;
    const serviceKey = realMode && event.serviceId
      ? serviceFilterKey(event.serviceId)
      : event.serviceName ? fixtureServiceFilterKey(event.serviceName) : null;
    return (!locationKey || !state.hiddenFilters.includes(locationKey)) &&
      (!serviceKey || !state.hiddenFilters.includes(serviceKey));
  });
  const createDraftPreview = useMemo(() => panelMode === "appointment-create" && createDraft && state.view !== "month"
    ? calendarCreateDraftPreview({
        draft: createDraft,
        realMode,
        locations: data.locations,
        services: data.services,
      })
    : null, [createDraft, data.locations, data.services, panelMode, realMode, state.view]);
  const eventLayouts = useMemo(
    () => layoutCalendarLabEvents(createDraftPreview ? [...visibleEvents, createDraftPreview] : visibleEvents),
    [createDraftPreview, visibleEvents],
  );
  const periodLabel = calendarLabPeriodLabel(state.view, state.cursorDate);
  const monthEventsByDate = useMemo(() => calendarMonthEventsByDate(visibleEvents), [visibleEvents]);
  const daySummary = useMemo(
    () => calendarLabDaySummary(visibleEvents, state.cursorDate),
    [state.cursorDate, visibleEvents],
  );
  const labNow = useMemo(() => realMode ? new Date() : LAB_NOW, [realMode]);
  const labToday = calendarDateFromInstant(labNow);
  const labNowMinutes = timeToMinutes(calendarTimeFromInstant(labNow));
  const closeMobileSurface = () => {
    if (mobileSurface === "filters" || sidebarMode.kind === "main") {
      setMobileSurface("calendar");
      setSidebarMode({ kind: "main" });
      return;
    }
    if (sidebarMode.kind === "location-create" || sidebarMode.kind === "location-edit") setSidebarMode({ kind: "locations" });
    else if (sidebarMode.kind === "service-create" || sidebarMode.kind === "service-edit") setSidebarMode({ kind: "services" });
    else setSidebarMode({ kind: "main" });
  };
  const mobileSettingsTitle = sidebarMode.kind === "locations" ? "Sedi"
    : sidebarMode.kind === "services" ? "Prestazioni"
      : sidebarMode.kind === "google" ? "Google Calendar"
        : sidebarMode.kind === "location-create" ? "Nuova sede"
          : sidebarMode.kind === "location-edit" ? "Modifica sede"
            : sidebarMode.kind === "service-create" ? "Nuova prestazione"
              : sidebarMode.kind === "service-edit" ? "Modifica prestazione"
                : "Impostazioni calendario";
  const currentDayIndex = days.indexOf(labToday);
  const selectedEvent = activeEvents.find((event) => event.id === state.selectedEventId);
  const realAppointment = realMode && selectedEvent
    ? data.appointments.find((appointment) => appointment.id === selectedEvent.id)
    : undefined;
  const drawerDraft = panelMode === "appointment-edit" && selectedEvent
    ? realAppointment
      ? calendarV3RealAppointmentDraftFromAppointment(realAppointment, data.patients, data.locations, data.services)
      : appointmentDraftFromEvent(selectedEvent)
    : panelMode === "appointment-create"
      ? createDraft
      : null;
  const contextEvent = contextMenu?.kind === "event"
    ? activeEvents.find((event) => event.id === contextMenu.eventId)
    : undefined;
  const selectedAppointmentActions = realAppointment
    ? getCalendarV3RealAppointmentActions({
        appointment: realAppointment,
        sessions: data.sessions,
        patientExists: data.patients.some((patient) => patient.id === realAppointment.patientId),
      })
    : undefined;
  const contextAppointment = realMode && contextEvent
    ? data.appointments.find((appointment) => appointment.id === contextEvent.id)
    : undefined;
  const contextAppointmentActions = contextAppointment
    ? getCalendarV3RealAppointmentActions({
        appointment: contextAppointment,
        sessions: data.sessions,
        patientExists: data.patients.some((patient) => patient.id === contextAppointment.patientId),
      })
    : undefined;
  const recurrenceOptions = useMemo(() => {
    if (!recurrenceRequest) return [];
    return ([
      ["single", "Solo questo appuntamento"],
      ["following", "Questo e i successivi"],
      ["entire", "Intera serie"],
    ] as const).map(([scope, label]) => {
      const plan = buildCalendarV3RecurrencePlan({
        appointments: data.appointments,
        sessions: data.sessions,
        selectedBefore: recurrenceRequest.selectedBefore,
        selectedAfter: recurrenceRequest.selectedAfter,
        mutation: recurrenceRequest.mutation,
        scope,
      });
      return {
        scope,
        label,
        description: scope === "single"
          ? "Modifica soltanto questa data."
          : scope === "following"
            ? "Applica il nuovo orario o giorno da questo appuntamento in avanti."
            : "Applica il nuovo schema a tutta la serie.",
        summary: calendarV3RecurrencePlanSummary(plan),
        disabled: plan.appointments.length === 0,
      };
    });
  }, [data.appointments, data.sessions, recurrenceRequest]);

  useEffect(() => {
    if (!realMode || !ready || realModeInitializedRef.current) return;
    realModeInitializedRef.current = true;
    dispatch({ type: "set_cursor_date", date: calendarDateFromInstant(new Date()) });
  }, [realMode, ready]);

  useEffect(() => () => {
    if (gestureFeedbackTimeoutRef.current !== null) window.clearTimeout(gestureFeedbackTimeoutRef.current);
  }, []);

  const showGestureFeedback = (feedback: CalendarGestureFeedback) => {
    if (gestureFeedbackTimeoutRef.current !== null) window.clearTimeout(gestureFeedbackTimeoutRef.current);
    setGestureFeedback(feedback);
    gestureFeedbackTimeoutRef.current = feedback.tone === "info"
      ? window.setTimeout(() => {
        gestureFeedbackTimeoutRef.current = null;
        setGestureFeedback(null);
      }, 4800)
      : null;
  };

  const dismissGestureFeedback = () => {
    if (gestureFeedbackTimeoutRef.current !== null) window.clearTimeout(gestureFeedbackTimeoutRef.current);
    gestureFeedbackTimeoutRef.current = null;
    setGestureFeedback(null);
  };

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

  const openMonthCreate = (date: CalendarDate, origin: HTMLElement) => {
    setExpandedMonthDate(null);
    dispatch({ type: "set_cursor_date", date });
    openCreate(normalizeCalendarSelection(date, 9 * 60, 9 * 60 + 45), origin);
  };

  const openCommandPalette = (origin: HTMLElement) => {
    setContextMenu(null);
    setCommandPaletteOrigin(origin);
  };

  useEffect(() => {
    if (state.view === "month") return;
    const initialMinute = getInitialScrollMinute(days, labNow);
    const weekHeaderHeight = weekHeaderRef.current?.getBoundingClientRect().height ?? 0;
    scrollRef.current?.scrollTo({
      top: Math.max(0, weekHeaderHeight + (initialMinute - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE),
    });
  }, [days, labNow, state.view]);

  useEffect(() => {
    const cancelDrag = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const currentMonthMove = monthEventMoveRef.current;
      if (currentMonthMove.status !== "idle") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const origin = monthEventMoveOriginRef.current;
        if (origin?.hasPointerCapture(currentMonthMove.pointerId)) origin.releasePointerCapture(currentMonthMove.pointerId);
        monthEventMoveRef.current = cancelCalendarMonthEventMove();
        setMonthEventMove(IDLE_CALENDAR_MONTH_EVENT_MOVE);
        monthEventMoveOriginRef.current = null;
        return;
      }
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
      if (event.defaultPrevented || event.repeat || panelMode !== "closed" || dragSelectionRef.current.status !== "idle" || eventMoveRef.current.status !== "idle" || monthEventMoveRef.current.status !== "idle" || eventResizeRef.current.status !== "idle") return;
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
  }, [commandPaletteOrigin, panelMode, state.cursorDate]);

  const movePeriod = (direction: -1 | 1) => {
    dispatch({ type: "set_cursor_date", date: navigateCalendarLabDate(state.view, state.cursorDate, direction) });
  };

  const openCreate = (selection: CalendarSelection, origin: HTMLElement) => {
    if (realMode && data.patients.length === 0) {
      showGestureFeedback({ tone: "error", message: "Per creare un appuntamento devi prima aggiungere un paziente." });
      return;
    }
    returnFocusRef.current = origin;
    setCreateDraft(realMode
      ? createCalendarV3RealAppointmentDraft({ selection, appointmentId: uid(), createdAt: new Date().toISOString() })
      : createAppointmentDraft(selection));
    setPanelMode("appointment-create");
    dispatch({ type: "select_event", eventId: null });
    dispatch({ type: "set_selection", selection });
  };

  const openEdit = (eventId: string, origin: HTMLElement) => {
    if (realMode && realMutationRef.current?.appointmentId === eventId) return;
    returnFocusRef.current = origin;
    setCreateDraft(null);
    setPanelMode(realMode ? "appointment-detail" : "appointment-edit");
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

  const beginBlockedGestureFeedback = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLElement>) => {
    if (!realMode) return false;
    const block = getCalendarV3GestureBlockReason(event);
    if (!block) return false;
    const next = beginCalendarBlockedGestureAttempt({
      pointerId: pointerEvent.pointerId,
      pointerType: pointerEvent.pointerType,
      isPrimary: pointerEvent.isPrimary,
      button: pointerEvent.button,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "idle") return true;
    blockedGestureMessageRef.current = block.message;
    blockedGestureAttemptRef.current = next;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    return true;
  };

  const updateBlockedGestureFeedback = (pointerEvent: React.PointerEvent<HTMLElement>) => {
    const current = blockedGestureAttemptRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return false;
    const next = moveCalendarBlockedGestureAttempt(current, {
      pointerId: pointerEvent.pointerId,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    blockedGestureAttemptRef.current = next;
    if (next.status === "attempted") {
      pointerEvent.preventDefault();
      if (current.status !== "attempted" && blockedGestureMessageRef.current) {
        showGestureFeedback({ tone: "info", message: blockedGestureMessageRef.current });
      }
    }
    return true;
  };

  const finishBlockedGestureFeedback = (pointerEvent: React.PointerEvent<HTMLElement>) => {
    const current = blockedGestureAttemptRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return false;
    const completion = completeCalendarBlockedGestureAttempt(current, {
      pointerId: pointerEvent.pointerId,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    blockedGestureAttemptRef.current = completion.state;
    const message = blockedGestureMessageRef.current;
    blockedGestureMessageRef.current = null;
    if (completion.wasAttempt) {
      pointerEvent.preventDefault();
      suppressNextEventClickRef.current = true;
      if (current.status !== "attempted" && message) showGestureFeedback({ tone: "info", message });
      window.setTimeout(() => { suppressNextEventClickRef.current = false; }, 0);
    }
    return true;
  };

  const abortBlockedGestureFeedback = (pointerEvent: React.PointerEvent<HTMLElement>) => {
    const current = blockedGestureAttemptRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return false;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    blockedGestureAttemptRef.current = cancelCalendarBlockedGestureAttempt();
    blockedGestureMessageRef.current = null;
    return true;
  };

  const persistRealGesture = async (intent: CalendarLabEvent, gesture: CalendarV3RealGesture, origin: HTMLElement) => {
    if (!realMode || realMutationRef.current) return;
    const before = data.appointments.find((appointment) => appointment.id === intent.id);
    const sourceEvent = realData.events.find((event) => event.id === intent.id);
    if (!before || !sourceEvent || !isCalendarV3RealGestureEligible(sourceEvent)) {
      showGestureFeedback({ tone: "error", message: "Questo appuntamento non può essere modificato con una gesture." });
      return;
    }
    if (before.recurrenceSeriesId) {
      setRecurrenceError("");
      setRecurrenceRequest({
        selectedBefore: before,
        selectedAfter: appointmentAfterCalendarV3RealGesture(before, intent, gesture),
        mutation: gesture,
        source: "gesture",
        origin,
      });
      dismissGestureFeedback();
      return;
    }
    const mutation = { appointmentId: before.id, gesture };
    realMutationRef.current = mutation;
    setRealMutation(mutation);
    dismissGestureFeedback();
    try {
      const result = await executeCalendarV3RealGesture({ before, intent, gesture, save: saveRealAppointment });
      if (!result.ok) showGestureFeedback({ tone: "error", message: result.message });
    } finally {
      if (realMutationRef.current === mutation) {
        realMutationRef.current = null;
        setRealMutation(null);
      }
    }
  };

  const beginEventMove = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (drawerDraft || realMutationRef.current || eventResizeRef.current.status !== "idle") return;
    if (realMode && !isCalendarV3RealGestureEligible(event)) {
      beginBlockedGestureFeedback(event, pointerEvent);
      return;
    }
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
    if (updateBlockedGestureFeedback(pointerEvent)) return;
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
    if (finishBlockedGestureFeedback(pointerEvent)) return;
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
      if (realMode) void persistRealGesture(completion.event, "move", pointerEvent.currentTarget);
      else dispatch({ type: "move_event", event: completion.event });
      window.setTimeout(() => { suppressNextEventClickRef.current = false; }, 0);
    }
  };

  const abortEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (abortBlockedGestureFeedback(pointerEvent)) return;
    const current = eventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    eventMoveRef.current = cancelCalendarEventMove();
    setEventMove(IDLE_CALENDAR_EVENT_MOVE);
    eventMoveOriginRef.current = null;
  };

  const monthEventMoveTarget = (clientX: number, clientY: number) => {
    const rectangle = monthGridRef.current?.getBoundingClientRect();
    if (!rectangle) return null;
    return calendarMonthDateFromClientPoint(clientX, clientY, rectangle, days);
  };

  const beginMonthEventMove = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (drawerDraft || realMutationRef.current || eventResizeRef.current.status !== "idle" || eventMoveRef.current.status !== "idle") return;
    if (realMode && !isCalendarV3RealGestureEligible(event)) {
      beginBlockedGestureFeedback(event, pointerEvent);
      return;
    }
    const next = beginCalendarMonthEventMove({
      event,
      pointerId: pointerEvent.pointerId,
      pointerType: pointerEvent.pointerType,
      isPrimary: pointerEvent.isPrimary,
      button: pointerEvent.button,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "idle") return;
    monthEventMoveOriginRef.current = pointerEvent.currentTarget;
    monthEventMoveRef.current = next;
    setMonthEventMove(next);
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  };

  const updateMonthEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (updateBlockedGestureFeedback(pointerEvent)) return;
    const current = monthEventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const date = monthEventMoveTarget(pointerEvent.clientX, pointerEvent.clientY);
    if (!date) return;
    const next = moveCalendarMonthEvent(current, {
      pointerId: pointerEvent.pointerId,
      date,
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (next.status === "movingMonthEvent") {
      pointerEvent.preventDefault();
      setContextMenu(null);
      setCommandPaletteOrigin(null);
      setExpandedMonthDate(null);
    }
    monthEventMoveRef.current = next;
    setMonthEventMove(next);
  };

  const finishMonthEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (finishBlockedGestureFeedback(pointerEvent)) return;
    const current = monthEventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    const completion = completeCalendarMonthEventMove(current, {
      pointerId: pointerEvent.pointerId,
      date: monthEventMoveTarget(pointerEvent.clientX, pointerEvent.clientY),
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
    });
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    monthEventMoveRef.current = completion.state;
    setMonthEventMove(completion.state);
    monthEventMoveOriginRef.current = null;
    if (completion.wasMove && completion.event) {
      pointerEvent.preventDefault();
      suppressNextEventClickRef.current = true;
      if (realMode) void persistRealGesture(completion.event, "month_move", pointerEvent.currentTarget);
      else dispatch({ type: "move_event", event: completion.event });
      window.setTimeout(() => { suppressNextEventClickRef.current = false; }, 0);
    }
  };

  const abortMonthEventMove = (pointerEvent: React.PointerEvent<HTMLButtonElement>) => {
    if (abortBlockedGestureFeedback(pointerEvent)) return;
    const current = monthEventMoveRef.current;
    if (current.status === "idle" || current.pointerId !== pointerEvent.pointerId) return;
    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }
    monthEventMoveRef.current = cancelCalendarMonthEventMove();
    setMonthEventMove(IDLE_CALENDAR_MONTH_EVENT_MOVE);
    monthEventMoveOriginRef.current = null;
  };

  const eventResizeTarget = (clientY: number) => {
    const gridRectangle = daysGridRef.current?.getBoundingClientRect();
    if (!gridRectangle) return null;
    return yToSnappedMinute(clientY - gridRectangle.top, PIXELS_PER_MINUTE);
  };

  const beginEventResize = (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    if (drawerDraft || realMutationRef.current || eventMoveRef.current.status !== "idle" || dragSelectionRef.current.status !== "idle") return;
    if (realMode && !isCalendarV3RealGestureEligible(event)) {
      beginBlockedGestureFeedback(event, pointerEvent);
      return;
    }
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
    if (updateBlockedGestureFeedback(pointerEvent)) return;
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
    if (finishBlockedGestureFeedback(pointerEvent)) return;
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
      if (realMode) void persistRealGesture(completion.event, "resize", pointerEvent.currentTarget);
      else dispatch({ type: "resize_event", event: completion.event });
    }
  };

  const abortEventResize = (pointerEvent: React.PointerEvent<HTMLSpanElement>) => {
    if (abortBlockedGestureFeedback(pointerEvent)) return;
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
    monthEventMoveRef.current = IDLE_CALENDAR_MONTH_EVENT_MOVE;
    setMonthEventMove(IDLE_CALENDAR_MONTH_EVENT_MOVE);
    eventResizeRef.current = IDLE_CALENDAR_EVENT_RESIZE;
    setEventResize(IDLE_CALENDAR_EVENT_RESIZE);
    setCreateDraft(null);
    setPanelMode("closed");
    dispatch({ type: "set_selection", selection: null });
    dispatch({ type: "select_event", eventId: null });
  };

  const cancelRecurrenceScope = () => {
    if (realMutationRef.current) return;
    const origin = recurrenceRequest?.origin;
    setRecurrenceRequest(null);
    setRecurrenceError("");
    window.requestAnimationFrame(() => origin?.focus());
  };

  const confirmRecurrenceScope = async (scope: CalendarV3RecurrenceScope) => {
    if (!recurrenceRequest || realMutationRef.current) return;
    const plan = buildCalendarV3RecurrencePlan({
      appointments: data.appointments,
      sessions: data.sessions,
      selectedBefore: recurrenceRequest.selectedBefore,
      selectedAfter: recurrenceRequest.selectedAfter,
      mutation: recurrenceRequest.mutation,
      scope,
    });
    if (!plan.appointments.length) {
      setRecurrenceError(plan.consistencyError ?? "Nessun appuntamento modificabile nello scope scelto.");
      return;
    }
    const mutation = {
      appointmentId: recurrenceRequest.selectedBefore.id,
      gesture: recurrenceRequest.mutation,
    };
    realMutationRef.current = mutation;
    setRealMutation(mutation);
    setRecurrenceError("");
    try {
      const result = await executeCalendarV3RecurrencePlan(plan, saveRealAppointments);
      if (!result.ok) {
        setRecurrenceError(result.patientError ?? "Non è stato possibile aggiornare la serie. Nessuna modifica è stata applicata nell’interfaccia.");
        return;
      }
      const source = recurrenceRequest.source;
      const origin = recurrenceRequest.origin;
      setRecurrenceRequest(null);
      if (source === "drawer") setPanelMode("appointment-detail");
      else window.requestAnimationFrame(() => origin?.focus());
      showGestureFeedback({
        tone: "info",
        message: result.count === 1
          ? "Appuntamento aggiornato."
          : `${result.count} appuntamenti aggiornati.`,
      });
    } finally {
      if (realMutationRef.current === mutation) {
        realMutationRef.current = null;
        setRealMutation(null);
      }
    }
  };

  const saveAppointment = async (draft: CalendarAppointmentDraft) => {
    if (realMode) {
      if (!isCalendarV3RealAppointmentDraft(draft)) throw new Error("Bozza appuntamento reale non valida.");
      const existing = data.appointments.find((appointment) => appointment.id === draft.appointmentId);
      const plan = buildCalendarV3AppointmentSavePlan({
        draft,
        existing,
        createId: uid,
        createdAt: () => new Date().toISOString(),
      });
      if (
        existing?.recurrenceSeriesId &&
        plan.kind === "single" &&
        hasCalendarV3AppointmentChanges(existing, plan.appointment)
      ) {
        setRecurrenceError("");
        setRecurrenceRequest({
          selectedBefore: existing,
          selectedAfter: plan.appointment,
          mutation: "drawer",
          source: "drawer",
          origin: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        });
        return;
      }
      if (existing && plan.kind === "single" && !hasCalendarV3AppointmentChanges(existing, plan.appointment)) {
        setPanelMode("appointment-detail");
        return;
      }
      if (plan.kind === "single") await saveRealAppointment(plan.appointment);
      else await saveRealAppointments(plan.appointments);
      if (existing) setPanelMode("appointment-detail");
      else closeDrawer();
      return;
    }
    if (!days.includes(draft.date as CalendarDate)) {
      dispatch({ type: "set_cursor_date", date: draft.date as CalendarDate });
    }
    if (selectedEvent) {
      dispatch({ type: "update_event", event: eventFromAppointmentDraft(draft, selectedEvent.id, selectedEvent) });
      closeDrawer();
      return;
    }
    dispatch({ type: "add_event", event: eventFromAppointmentDraft(draft, nextCalendarLabEventId(state.events)) });
    closeDrawer();
  };

  const closeCancelDialog = () => {
    if (appointmentActionBusy) return;
    const origin = appointmentActionOriginRef.current;
    setCancelCandidate(null);
    setAppointmentActionError("");
    appointmentActionOriginRef.current = null;
    window.requestAnimationFrame(() => origin?.focus());
  };

  const runRealAppointmentAction = (
    action: CalendarV3RealAppointmentActionId,
    appointment: Appointment,
    origin: HTMLElement,
  ) => {
    const model = getCalendarV3RealAppointmentActions({
      appointment,
      sessions: data.sessions,
      patientExists: data.patients.some((patient) => patient.id === appointment.patientId),
    });
    const availability = model.actions.find((item) => item.id === action);
    if (!availability?.available) {
      const message = availability?.unavailableReason ?? "Questa azione non è disponibile.";
      setAppointmentActionError(message);
      showGestureFeedback({ tone: "error", message });
      return;
    }
    setAppointmentActionError("");
    if (action === "cancel_appointment") {
      appointmentActionOriginRef.current = origin;
      setCancelCandidate(appointment);
      return;
    }
    if (action === "register_session") {
      appointmentActionOriginRef.current = origin;
      returnFocusRef.current = origin;
      dispatch({ type: "set_selection", selection: null });
      dispatch({ type: "select_event", eventId: appointment.id });
      setPanelMode("session-create");
    } else if (action === "open_patient" || action === "open_session") {
      closeDrawer();
      router.push(`/pazienti/${appointment.patientId}${action === "open_session" ? "?tab=activity" : ""}`);
    }
  };

  const confirmAppointmentCancellation = async () => {
    if (!cancelCandidate || appointmentActionBusy) return;
    setAppointmentActionBusy("cancel_appointment");
    setAppointmentActionError("");
    try {
      const origin = appointmentActionOriginRef.current;
      await saveRealAppointment(cancelAppointment(cancelCandidate));
      const wasOpen = state.selectedEventId === cancelCandidate.id;
      setCancelCandidate(null);
      appointmentActionOriginRef.current = null;
      if (wasOpen) setPanelMode("appointment-detail");
      else window.requestAnimationFrame(() => origin?.focus());
      showGestureFeedback({ tone: "info", message: "Appuntamento annullato. Resta disponibile nello storico." });
    } catch {
      setAppointmentActionError("Non è stato possibile annullare l’appuntamento. Nessuna modifica è stata applicata.");
    } finally {
      setAppointmentActionBusy(null);
    }
  };

  const handleContextMenuAction = (action: CalendarContextMenuAction) => {
    if (!contextMenu) return;
    const currentMenu = contextMenu;
    setContextMenu(null);
    if (currentMenu.kind === "empty") {
      if (action === "create") openCreate(currentMenu.selection, currentMenu.origin);
      else if (action === "go_to_day") {
        dispatch({ type: "set_cursor_date", date: currentMenu.selection.date });
        if (state.view === "month") dispatch({ type: "set_view", view: "day" });
      }
      return;
    }

    const event = activeEvents.find((item) => item.id === currentMenu.eventId);
    if (!event) return;
    if (action === "open") {
      openEdit(event.id, currentMenu.origin);
    } else if (realMode) {
      const appointment = data.appointments.find((item) => item.id === event.id);
      if (appointment && ["open_patient", "register_session", "open_session", "cancel_appointment"].includes(action)) {
        runRealAppointmentAction(action as CalendarV3RealAppointmentActionId, appointment, currentMenu.origin);
      }
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
    } else if (command === "week" || command === "day" || command === "month") {
      dispatch({ type: "set_view", view: command });
      setCommandPaletteOrigin(null);
      window.requestAnimationFrame(() => origin?.focus());
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.mobileApp}>
        <AppShell mobileFullScreen mobileHeader={mobileSurface === "calendar" ? undefined : {
          variant: "detail",
          title: mobileSurface === "filters" ? "Filtri" : mobileSettingsTitle,
          backHref: canonicalHref,
          backLabel: mobileSurface === "filters" || sidebarMode.kind === "main" ? "Torna al calendario" : "Indietro",
          onBack: closeMobileSurface,
        }}>
          {mobileSurface === "calendar" ? <MobileCalendar
            events={visibleEvents}
            selectedDate={state.cursorDate}
            today={labToday}
            nowMinutes={labNowMinutes}
            realMode={realMode}
            feedback={gestureFeedback}
            activeFilterCount={state.hiddenFilters.length}
            onDismissFeedback={dismissGestureFeedback}
            onSelectDate={(date) => dispatch({ type: "set_cursor_date", date })}
            onCreate={openCreate}
            onOpenEvent={openEdit}
            onOpenFilters={() => setMobileSurface("filters")}
            onOpenSettings={() => { setSidebarMode({ kind: "main" }); setMobileSurface("settings"); }}
          /> : mobileSurface === "filters" ? <MobileCalendarFilters
            realMode={realMode}
            hidden={state.hiddenFilters}
            onToggle={(filter) => dispatch({ type: "toggle_filter", filter })}
            onReset={() => state.hiddenFilters.forEach((filter) => dispatch({ type: "toggle_filter", filter }))}
          /> : <MobileCalendarSettings
            realMode={realMode}
            mode={sidebarMode}
            hidden={state.hiddenFilters}
            onModeChange={setSidebarMode}
            onToggle={(filter) => dispatch({ type: "toggle_filter", filter })}
          />}
        </AppShell>
      </div>

      <div className={styles.desktopShell}>
        <AppShell desktopFullScreen>
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
            <IconButton label={state.view === "day" ? "Giorno precedente" : state.view === "month" ? "Mese precedente" : "Settimana precedente"} onClick={() => movePeriod(-1)}><Chevron direction="left" /></IconButton>
            <IconButton label={state.view === "day" ? "Giorno successivo" : state.view === "month" ? "Mese successivo" : "Settimana successiva"} onClick={() => movePeriod(1)}><Chevron direction="right" /></IconButton>
            <label className={styles.viewSelector}>
              <span className={styles.srOnly}>Vista calendario</span>
              <select
                aria-label={`Vista corrente: ${state.view === "day" ? "Giorno" : state.view === "month" ? "Mese" : "Settimana"}`}
                value={state.view}
                onChange={(event) => dispatch({ type: "set_view", view: event.target.value as CalendarLabView })}
              >
                <option value="day">Giorno</option>
                <option value="week">Settimana</option>
                <option value="month">Mese</option>
              </select>
              <Chevron direction="down" />
            </label>
          </div>
        </header>

        {showModeNotice && realMode ? <div className={styles.realModeNotice} role="status">
          <strong>Dati reali</strong>
          <span>Creazione, modifica e gesture sugli appuntamenti attive.</span>
        </div> : null}
        {gestureFeedback ? <div
          className={`${styles.gestureFeedback} ${gestureFeedback.tone === "error" ? styles.gestureError : styles.gestureNotice}`}
          role={gestureFeedback.tone === "error" ? "alert" : "status"}
        >
          <span>{gestureFeedback.message}</span>
          <button type="button" onClick={dismissGestureFeedback}>Chiudi</button>
        </div> : null}

        <div className={styles.workspace}>
          <aside className={`${styles.sidebar} ${state.sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`} aria-hidden={!state.sidebarOpen}>
            <div className={styles.sidebarInner}>
              {sidebarMode.kind === "main" ? <MiniCalendar cursorDate={state.cursorDate} visibleDates={days} view={state.view} today={labToday} onSelect={(date) => dispatch({ type: "set_cursor_date", date })} /> : null}
              <CalendarSidebarCatalog realMode={realMode} mode={sidebarMode} hidden={state.hiddenFilters} onModeChange={setSidebarMode} onToggle={(filter) => dispatch({ type: "toggle_filter", filter })} />
              {sidebarMode.kind === "main" ? <GoogleCalendarStatus realMode={realMode} /> : null}
            </div>
          </aside>

          <section className={`${styles.calendarPane} ${state.view === "day" ? styles.calendarPaneDay : ""} ${state.view === "month" ? styles.calendarPaneMonth : ""}`} aria-label={`Calendario ${state.view === "day" ? "giornaliero" : state.view === "month" ? "mensile" : "settimanale"}, ${periodLabel}`}>
            {state.view === "month" ? <MonthCalendar
              eventMoveEnabled={!realMutation}
              busyEventId={realMutation?.appointmentId ?? null}
              containerRef={scrollRef}
              gridRef={monthGridRef}
              days={days}
              cursorDate={state.cursorDate}
              today={labToday}
              eventsByDate={monthEventsByDate}
              expandedDate={expandedMonthDate}
              movingEvent={monthEventMove}
              onCreate={openMonthCreate}
              onOpenEvent={(eventId, date, origin) => {
                if (suppressNextEventClickRef.current) {
                  suppressNextEventClickRef.current = false;
                  return;
                }
                setExpandedMonthDate(null);
                dispatch({ type: "set_cursor_date", date });
                openEdit(eventId, origin);
              }}
              onToggleOverflow={(date) => {
                dispatch({ type: "set_cursor_date", date });
                setExpandedMonthDate((current) => current === date ? null : date);
              }}
              onCloseOverflow={() => setExpandedMonthDate(null)}
              onEmptyContextMenu={(date, anchorPoint, origin) => {
                dispatch({ type: "set_cursor_date", date });
                setExpandedMonthDate(null);
                setCommandPaletteOrigin(null);
                setContextMenu({
                  kind: "empty",
                  anchorPoint,
                  origin,
                  selection: normalizeCalendarSelection(date, 9 * 60, 9 * 60 + 45),
                });
              }}
              onEventContextMenu={(eventId, date, anchorPoint, origin) => {
                if (realMutation?.appointmentId === eventId) return;
                dispatch({ type: "set_cursor_date", date });
                setExpandedMonthDate(null);
                setCommandPaletteOrigin(null);
                setContextMenu({ kind: "event", eventId, anchorPoint, origin });
              }}
              onEventPointerDown={beginMonthEventMove}
              onEventPointerMove={updateMonthEventMove}
              onEventPointerUp={finishMonthEventMove}
              onEventPointerCancel={abortMonthEventMove}
            /> : <div ref={scrollRef} className={styles.scrollArea}>
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
                        if (event.id === CALENDAR_CREATE_DRAFT_PREVIEW_ID) {
                          return <CreateDraftPreview key={event.id} event={event} />;
                        }
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
                          busy={realMutation?.appointmentId === event.id}
                          draggable={!realMutation && isCalendarLabEventDraggable(event)}
                          resizable={!realMutation && isCalendarLabEventResizable(event)}
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
                            if (realMutation?.appointmentId === eventId) return;
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
                      aria-label={`${realMode ? "Ora corrente" : "Ora corrente demo"} ${minutesToTime(labNowMinutes)}`}
                    ><span /></div>
                  ) : null}
                </div>
              </div>
            </div>}
          </section>
        </div>
        <MobileCalendarDialogHost>
        {realMode && panelMode === "appointment-detail" && realAppointment && selectedAppointmentActions ? <AppointmentDetailPanel
          appointment={realAppointment}
          patient={data.patients.find((patient) => patient.id === realAppointment.patientId)}
          location={data.locations.find((location) => location.id === realAppointment.locationId)}
          service={data.services.find((service) => service.id === realAppointment.serviceId)}
          actions={selectedAppointmentActions}
          busyAction={appointmentActionBusy}
          error={appointmentActionError}
          returnFocus={returnFocusRef.current}
          onClose={closeDrawer}
          onEdit={() => setPanelMode("appointment-edit")}
          onAction={(action, origin) => runRealAppointmentAction(action, realAppointment, origin)}
        /> : null}
        {realMode && panelMode === "session-create" && realAppointment ? (() => {
          const patient = data.patients.find((item) => item.id === realAppointment.patientId);
          return patient ? <SessionRegistrationPanel
            appointment={realAppointment}
            patient={patient}
            returnFocus={returnFocusRef.current}
            onCancel={() => setPanelMode("appointment-detail")}
            onSaved={() => {
              appointmentActionOriginRef.current = null;
              setPanelMode("appointment-detail");
              showGestureFeedback({ tone: "info", message: "Seduta registrata. L’appuntamento è stato aggiornato." });
            }}
          /> : null;
        })() : null}
        {drawerDraft ? <AppointmentDrawer
          key={selectedEvent?.id ?? `${state.selection?.date}-${state.selection?.startMinutes}`}
          initialDraft={drawerDraft}
          event={selectedEvent}
          returnFocus={returnFocusRef.current}
          onClose={() => realMode && realAppointment ? setPanelMode("appointment-detail") : closeDrawer()}
          onSave={saveAppointment}
          onDraftChange={panelMode === "appointment-create" ? setCreateDraft : undefined}
          realMode={realMode}
          patients={data.patients}
          locations={data.locations}
          services={data.services}
          scopeDialogOpen={Boolean(recurrenceRequest)}
          actionDialogOpen={Boolean(cancelCandidate)}
        /> : null}
        {recurrenceRequest ? <RecurrenceScopeDialog
          options={recurrenceOptions}
          saving={Boolean(realMutation)}
          error={recurrenceError}
          onChoose={(scope) => { void confirmRecurrenceScope(scope); }}
          onCancel={cancelRecurrenceScope}
        /> : null}
        {cancelCandidate ? <AppointmentCancelDialog
          recurring={Boolean(cancelCandidate.recurrenceSeriesId)}
          saving={appointmentActionBusy === "cancel_appointment"}
          error={appointmentActionError}
          onConfirm={() => { void confirmAppointmentCancellation(); }}
          onCancel={closeCancelDialog}
        /> : null}
        </MobileCalendarDialogHost>
        {contextMenu && (contextMenu.kind === "empty" || contextEvent) ? <ContextMenu
          anchorPoint={contextMenu.anchorPoint}
          origin={contextMenu.origin}
          scrollElement={scrollRef.current}
          items={contextMenu.kind === "empty"
            ? EMPTY_SLOT_CONTEXT_ITEMS
            : (realMode
                ? contextAppointmentActions
                  ? contextMenuItemsForRealAppointment(contextAppointmentActions)
                  : contextMenuItemsForEvent(contextEvent!).filter((item) => item.id === "open")
                : contextMenuItemsForEvent(contextEvent!))}
          header={contextMenu.kind === "event" ? <ContextMenuEventHeader event={contextEvent!} /> : undefined}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        /> : null}
        {commandPaletteOrigin ? <CommandPalette
          origin={commandPaletteOrigin}
          activeView={state.view}
          disabledCommands={[]}
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
        </AppShell>
      </div>
    </div>
  );
}

function IconButton({ label, expanded, disabled, buttonRef, onClick, children }: { label: string; expanded?: boolean; disabled?: boolean; buttonRef?: React.Ref<HTMLButtonElement>; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }) {
  return <button ref={buttonRef} type="button" className={styles.iconButton} aria-label={label} aria-expanded={expanded} disabled={disabled} onClick={onClick}>{children}</button>;
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

function MonthCalendar({ eventMoveEnabled, busyEventId, containerRef, gridRef, days, cursorDate, today, eventsByDate, expandedDate, movingEvent, onCreate, onOpenEvent, onToggleOverflow, onCloseOverflow, onEmptyContextMenu, onEventContextMenu, onEventPointerDown, onEventPointerMove, onEventPointerUp, onEventPointerCancel }: {
  eventMoveEnabled: boolean;
  busyEventId: string | null;
  containerRef: React.Ref<HTMLDivElement>;
  gridRef: React.Ref<HTMLDivElement>;
  days: CalendarDate[];
  cursorDate: CalendarDate;
  today: CalendarDate;
  eventsByDate: Map<CalendarDate, CalendarLabEvent[]>;
  expandedDate: CalendarDate | null;
  movingEvent: CalendarMonthEventMoveState;
  onCreate: (date: CalendarDate, origin: HTMLElement) => void;
  onOpenEvent: (eventId: string, date: CalendarDate, origin: HTMLElement) => void;
  onToggleOverflow: (date: CalendarDate) => void;
  onCloseOverflow: () => void;
  onEmptyContextMenu: (date: CalendarDate, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onEventContextMenu: (eventId: string, date: CalendarDate, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onEventPointerDown: (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerMove: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerUp: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerCancel: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return <div ref={containerRef} className={styles.monthView}>
    <div className={styles.monthWeekdays} aria-hidden="true">
      {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map((label) => <span key={label}>{label}</span>)}
    </div>
    <div ref={gridRef} className={styles.monthGrid}>
      {days.map((date) => <MonthDayCell
        key={date}
        date={date}
        cursorDate={cursorDate}
        today={today}
        events={eventsByDate.get(date) ?? []}
        expanded={expandedDate === date}
        movingEvent={movingEvent}
        eventMoveEnabled={eventMoveEnabled}
        busyEventId={busyEventId}
        onCreate={onCreate}
        onOpenEvent={onOpenEvent}
        onToggleOverflow={onToggleOverflow}
        onCloseOverflow={onCloseOverflow}
        onEmptyContextMenu={onEmptyContextMenu}
        onEventContextMenu={onEventContextMenu}
        onEventPointerDown={onEventPointerDown}
        onEventPointerMove={onEventPointerMove}
        onEventPointerUp={onEventPointerUp}
        onEventPointerCancel={onEventPointerCancel}
      />)}
      {movingEvent.status === "movingMonthEvent" ? <div
        className={styles.monthMoveGhost}
        style={{
          left: movingEvent.lastClientX,
          top: movingEvent.lastClientY,
          "--event-color": calendarLabEventColor(movingEvent.preview),
          "--event-tint": colorToTint(calendarLabEventColor(movingEvent.preview)),
        } as React.CSSProperties}
        aria-hidden="true"
      >
        <strong>{movingEvent.preview.patientName}</strong>
        <span>{minutesToTime(movingEvent.preview.startMinutes)}</span>
      </div> : null}
    </div>
  </div>;
}

function MonthDayCell({ date, cursorDate, today, events, expanded, movingEvent, eventMoveEnabled, busyEventId, onCreate, onOpenEvent, onToggleOverflow, onCloseOverflow, onEmptyContextMenu, onEventContextMenu, onEventPointerDown, onEventPointerMove, onEventPointerUp, onEventPointerCancel }: {
  date: CalendarDate;
  cursorDate: CalendarDate;
  today: CalendarDate;
  events: CalendarLabEvent[];
  expanded: boolean;
  movingEvent: CalendarMonthEventMoveState;
  eventMoveEnabled: boolean;
  busyEventId: string | null;
  onCreate: (date: CalendarDate, origin: HTMLElement) => void;
  onOpenEvent: (eventId: string, date: CalendarDate, origin: HTMLElement) => void;
  onToggleOverflow: (date: CalendarDate) => void;
  onCloseOverflow: () => void;
  onEmptyContextMenu: (date: CalendarDate, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onEventContextMenu: (eventId: string, date: CalendarDate, anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onEventPointerDown: (event: CalendarLabEvent, pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerMove: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerUp: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onEventPointerCancel: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { visible, hiddenCount } = calendarMonthEventSlice(events, CALENDAR_MONTH_VISIBLE_EVENT_LIMIT);
  const outsideMonth = !isCalendarDateInMonth(date, cursorDate);

  useEffect(() => {
    if (!expanded) return;
    popoverRef.current?.querySelector<HTMLButtonElement>("[data-month-event]")?.focus();
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onCloseOverflow();
        window.requestAnimationFrame(() => overflowButtonRef.current?.focus());
        return;
      }
      if (popoverRef.current?.contains(event.target as Node) || overflowButtonRef.current?.contains(event.target as Node)) return;
      onCloseOverflow();
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [expanded, onCloseOverflow]);

  const isMoveTarget = movingEvent.status === "movingMonthEvent" && movingEvent.preview.date === date;

  return <div className={`${styles.monthDayCell} ${outsideMonth ? styles.monthDayOutside : ""} ${date === cursorDate ? styles.monthDaySelected : ""} ${date === today ? styles.monthDayToday : ""} ${isMoveTarget ? styles.monthDayMoveTarget : ""}`}>
    <button
      type="button"
      className={styles.monthDayCreate}
      aria-label={`Crea appuntamento, ${formatFullDate(date)}`}
      onClick={(event) => onCreate(date, event.currentTarget)}
      onContextMenu={(event) => {
        event.preventDefault();
        onEmptyContextMenu(date, { x: event.clientX, y: event.clientY }, event.currentTarget);
      }}
    ><span>{Number(date.slice(8))}</span></button>
    <div className={styles.monthEvents}>
      {visible.map((event) => <MonthEventButton
        key={event.id}
        event={event}
        draggable={eventMoveEnabled && isCalendarLabEventDraggable(event)}
        busy={busyEventId === event.id}
        moving={movingEvent.status === "movingMonthEvent" && movingEvent.before.id === event.id}
        onOpen={(origin) => onOpenEvent(event.id, date, origin)}
        onOpenContextMenu={(anchorPoint, origin) => onEventContextMenu(event.id, date, anchorPoint, origin)}
        onPointerDown={(pointerEvent) => onEventPointerDown(event, pointerEvent)}
        onPointerMove={onEventPointerMove}
        onPointerUp={onEventPointerUp}
        onPointerCancel={onEventPointerCancel}
      />)}
      {hiddenCount > 0 ? <button
        ref={overflowButtonRef}
        type="button"
        className={styles.monthMore}
        aria-expanded={expanded}
        aria-haspopup="dialog"
        onClick={() => onToggleOverflow(date)}
      >+ {hiddenCount} {hiddenCount === 1 ? "altro" : "altri"}</button> : null}
    </div>
    {expanded ? <div ref={popoverRef} className={styles.monthOverflow} role="dialog" aria-label={`Appuntamenti di ${formatFullDate(date)}`}>
      <div className={styles.monthOverflowHeader}>
        <strong>{formatFullDate(date)}</strong>
        <button type="button" aria-label="Chiudi elenco appuntamenti" onClick={() => {
          onCloseOverflow();
          window.requestAnimationFrame(() => overflowButtonRef.current?.focus());
        }}>×</button>
      </div>
      <div className={styles.monthOverflowList}>
        {events.map((event, index) => <MonthEventButton
          key={event.id}
          event={event}
          focusMarker={index === 0}
          busy={busyEventId === event.id}
          onOpen={(origin) => onOpenEvent(event.id, date, origin)}
          onOpenContextMenu={(anchorPoint, origin) => onEventContextMenu(event.id, date, anchorPoint, origin)}
        />)}
      </div>
    </div> : null}
  </div>;
}

function MonthEventButton({ event, focusMarker = false, draggable = false, moving = false, busy = false, onOpen, onOpenContextMenu, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: {
  event: CalendarLabEvent;
  focusMarker?: boolean;
  draggable?: boolean;
  moving?: boolean;
  busy?: boolean;
  onOpen: (origin: HTMLElement) => void;
  onOpenContextMenu: (anchorPoint: { x: number; y: number }, origin: HTMLElement) => void;
  onPointerDown?: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (pointerEvent: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const color = calendarLabEventColor(event);
  const recurring = Boolean(event.recurrenceSeriesId);
  return <button
    type="button"
    className={`${styles.monthEvent} ${event.status === "cancelled" ? styles.monthEventCancelled : ""} ${draggable ? styles.monthEventDraggable : ""} ${moving ? styles.monthEventMovingOrigin : ""} ${busy ? styles.eventBusy : ""}`}
    style={{ "--event-color": color, "--event-tint": colorToTint(color) } as React.CSSProperties}
    aria-label={`${event.patientName}, ${minutesToTime(event.startMinutes)}, ${calendarLabSessionLabel(event)}${recurring ? ", appuntamento ricorrente" : ""}`}
    aria-busy={busy || undefined}
    data-month-event={focusMarker ? "first" : ""}
    onClick={(clickEvent) => onOpen(clickEvent.currentTarget)}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerCancel}
    onContextMenu={(contextEvent) => {
      contextEvent.preventDefault();
      contextEvent.stopPropagation();
      onOpenContextMenu({ x: contextEvent.clientX, y: contextEvent.clientY }, contextEvent.currentTarget);
    }}
    onKeyDown={(keyboardEvent) => {
      if (keyboardEvent.key !== "ContextMenu" && !(keyboardEvent.shiftKey && keyboardEvent.key === "F10")) return;
      keyboardEvent.preventDefault();
      const rectangle = keyboardEvent.currentTarget.getBoundingClientRect();
      onOpenContextMenu({ x: rectangle.left + 20, y: rectangle.top + 20 }, keyboardEvent.currentTarget);
    }}
  >
    <span className={styles.monthEventColor} aria-hidden="true" />
    {recurring ? <span className={styles.monthRecurringIndicator} aria-hidden="true">↻</span> : null}
    <strong>{event.patientName}</strong>
    <small>{minutesToTime(event.startMinutes)}</small>
  </button>;
}

function TimeGutter() {
  const hours = Array.from({ length: CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour + 1 }, (_, index) => CALENDAR_LAB_CONFIG.startHour + index);
  return <div className={styles.timeGutter}>{hours.map((hour) => <span key={hour} style={{ top: (hour - CALENDAR_LAB_CONFIG.startHour) * CALENDAR_LAB_PIXELS_PER_HOUR }}>{String(hour).padStart(2, "0")}:00</span>)}</div>;
}

function CreateDraftPreview({ event }: { event: CalendarLabEventLayout }) {
  const color = calendarLabEventColor(event);
  const duration = event.endMinutes - event.startMinutes;
  const top = (event.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * PIXELS_PER_MINUTE;
  return <div
    className={styles.createDraftPreview}
    style={{
      top,
      height: Math.max(duration * PIXELS_PER_MINUTE - 2, 18),
      ...eventHorizontalStyle(event),
      "--event-color": color,
      "--event-tint": colorToTint(color),
    } as React.CSSProperties}
    role="status"
    aria-label={`Da salvare: ${event.patientName}, ${minutesToTime(event.startMinutes)}, ${duration} minuti`}
  >
    <span className={styles.createDraftBadge}>Da salvare</span>
    <strong>{event.patientName}</strong>
    {duration >= 30 ? <span>{minutesToTime(event.startMinutes)}–{minutesToTime(event.endMinutes)} · {duration} min</span> : null}
    {duration >= 60 && event.serviceName ? <span>{event.serviceName}</span> : null}
  </div>;
}

function EventChip({ event, view, selected, menuOpen, moving, resizing, busy, draggable, resizable, onSelect, onOpenContextMenu, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onResizePointerDown, onResizePointerMove, onResizePointerUp, onResizePointerCancel }: {
  event: CalendarLabEventLayout;
  view: CalendarLabView;
  selected: boolean;
  menuOpen: boolean;
  moving: boolean;
  resizing: boolean;
  busy: boolean;
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
  const showRecurringIndicator = Boolean(event.recurrenceSeriesId) && duration >= 30;
  const displayName = narrowCluster
    ? event.patientName.split(" ").map((part) => part[0]).join("")
    : event.patientName;
  return (
    <button
      type="button"
      className={`${styles.event} ${dayView ? styles.eventDay : ""} ${compact ? styles.eventCompact : ""} ${narrowCluster ? styles.eventNarrow : ""} ${showSessionIndicator ? styles.eventWithState : ""} ${event.status === "cancelled" ? styles.eventCancelled : ""} ${selected ? styles.eventSelected : ""} ${draggable ? styles.eventDraggable : ""} ${moving ? styles.eventMovingOrigin : ""} ${resizing ? styles.eventResizing : ""} ${busy ? styles.eventBusy : ""}`}
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
      aria-busy={busy || undefined}
      aria-label={`${event.patientName}, ${minutesToTime(event.startMinutes)}, ${duration} minuti, ${calendarLabSessionLabel(event)}${event.recurrenceSeriesId ? ", appuntamento ricorrente" : ""}`}
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
      {showRecurringIndicator ? <span className={styles.recurringIndicator} aria-hidden="true">↻</span> : null}
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
  const month = Number(cursorDate.slice(5, 7));
  const year = Number(cursorDate.slice(0, 4));
  const cells = calendarMonthDays(cursorDate);
  return <section className={styles.miniCalendar} aria-label="Mini calendario">
    <div className={styles.miniTitle}><strong>{MONTHS[month - 1]} {year}</strong><span>{view === "day" ? "Giorno" : view === "month" ? "Mese" : "Settimana"}</span></div>
    <div className={styles.miniWeekdays}>{["L", "M", "M", "G", "V", "S", "D"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    <div className={styles.miniDays}>{cells.map((date) => {
      const outside = date.slice(5, 7) !== cursorDate.slice(5, 7);
      const visible = view === "month" ? date === cursorDate : visibleDates.includes(date);
      return <button key={date} type="button" onClick={() => onSelect(date)} className={`${outside ? styles.outsideMonth : ""} ${visible ? styles.inWeek : ""} ${(view === "day" || view === "month") && date === cursorDate ? styles.miniSelectedDay : ""} ${date === today ? styles.miniToday : ""}`} aria-label={formatFullDate(date)} aria-current={date === cursorDate ? "date" : undefined}>{Number(date.slice(8))}</button>;
    })}</div>
  </section>;
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
