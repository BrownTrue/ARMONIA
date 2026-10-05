"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./calendar-v3-lab.module.css";
import {
  CALENDAR_LAB_CONFIG,
  calendarWeekDays,
  minutesToTime,
  type CalendarDate,
} from "@/lib/calendar-v3-lab/date-time";
import { calendarLabEventColor, type CalendarLabEvent } from "@/lib/calendar-v3-lab/fixtures";
import { eventHorizontalStyle, layoutCalendarLabEvents } from "@/lib/calendar-v3-lab/layout";
import { calendarMonthDays } from "@/lib/calendar-v3-lab/month-view";
import { normalizeCalendarSelection, type CalendarSelection } from "@/lib/calendar-v3-lab/selection";
import {
  mobileCalendarEventsForDate,
  mobileCalendarWeek,
  navigateMobileCalendarPeriod,
  type MobileCalendarLabView,
} from "@/lib/calendar-v3-lab/mobile-view";

const MOBILE_PIXELS_PER_HOUR = 64;
const MOBILE_PIXELS_PER_MINUTE = MOBILE_PIXELS_PER_HOUR / 60;
const MOBILE_GRID_HEIGHT = (CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour) * MOBILE_PIXELS_PER_HOUR;
const WEEKDAY_SHORT = ["D", "L", "M", "M", "G", "V", "S"];
const WEEKDAY_LONG = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

export function MobileCalendar({ events, selectedDate, today, nowMinutes, realMode, feedback, activeFilterCount, onDismissFeedback, onSelectDate, onCreate, onOpenEvent, onOpenFilters, onOpenSettings }: {
  events: readonly CalendarLabEvent[];
  selectedDate: CalendarDate;
  today: CalendarDate;
  nowMinutes: number;
  realMode: boolean;
  feedback?: { tone: "info" | "error"; message: string } | null;
  activeFilterCount: number;
  onDismissFeedback: () => void;
  onSelectDate: (date: CalendarDate) => void;
  onCreate: (selection: CalendarSelection, origin: HTMLElement) => void;
  onOpenEvent: (eventId: string, origin: HTMLElement) => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
}) {
  const [view, setView] = useState<MobileCalendarLabView>("day");
  const selectedEvents = useMemo(() => mobileCalendarEventsForDate(events, selectedDate), [events, selectedDate]);
  const periodLabel = mobilePeriodLabel(view, selectedDate);
  const movePeriod = (direction: -1 | 1) => onSelectDate(navigateMobileCalendarPeriod(view, selectedDate, direction));
  const createDefault = (origin: HTMLElement) => onCreate(normalizeCalendarSelection(selectedDate, 9 * 60, 9 * 60 + 45), origin);

  return <div className={styles.mobileCalendar}>
    <div className={styles.mobileCalendarTop}>
      <div className={styles.mobilePeriodRow}>
        <div><span>{realMode ? "Dati reali" : "Dati dimostrativi"}</span><strong>{periodLabel}</strong></div>
        <div>
          <button type="button" onClick={() => onSelectDate(today)}>Oggi</button>
          <button type="button" aria-label={view === "month" ? "Mese precedente" : "Settimana precedente"} onClick={() => movePeriod(-1)}>‹</button>
          <button type="button" aria-label={view === "month" ? "Mese successivo" : "Settimana successiva"} onClick={() => movePeriod(1)}>›</button>
        </div>
      </div>
      <MobileWeekStrip selectedDate={selectedDate} today={today} onSelect={onSelectDate} />
      <div className={styles.mobileViewSelector} role="tablist" aria-label="Vista mobile di confronto">
        {(["day", "agenda", "month"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)}>{item === "day" ? "Giorno" : item === "agenda" ? "Agenda" : "Mese"}</button>)}
      </div>
      <div className={styles.mobileCalendarControls} aria-label="Strumenti calendario">
        <button type="button" onClick={onOpenFilters}>Filtri{activeFilterCount ? <span aria-label={`${activeFilterCount} filtri attivi`}>{activeFilterCount}</span> : null}</button>
        <button type="button" onClick={onOpenSettings}>Impostazioni</button>
      </div>
    </div>

    {feedback ? <div className={`${styles.mobileFeedback} ${feedback.tone === "error" ? styles.mobileFeedbackError : ""}`} role={feedback.tone === "error" ? "alert" : "status"}><span>{feedback.message}</span><button type="button" onClick={onDismissFeedback}>Chiudi</button></div> : null}

    {view === "day" ? <MobileDayView date={selectedDate} today={today} nowMinutes={nowMinutes} events={selectedEvents} onCreate={onCreate} onOpenEvent={onOpenEvent} /> : null}
    {view === "agenda" ? <MobileAgenda date={selectedDate} events={selectedEvents} onCreate={createDefault} onOpenEvent={onOpenEvent} /> : null}
    {view === "month" ? <MobileMonth date={selectedDate} today={today} events={events} onSelectDate={onSelectDate} onOpenDay={() => setView("day")} onCreate={createDefault} onOpenEvent={onOpenEvent} /> : null}
  </div>;
}

function MobileWeekStrip({ selectedDate, today, onSelect }: { selectedDate: CalendarDate; today: CalendarDate; onSelect: (date: CalendarDate) => void }) {
  return <div className={styles.mobileWeekStrip} aria-label="Settimana">
    {mobileCalendarWeek(selectedDate).map((date) => {
      const day = new Date(`${date}T12:00:00Z`).getUTCDay();
      return <button key={date} type="button" aria-label={formatFullDate(date)} aria-pressed={date === selectedDate} className={`${date === selectedDate ? styles.mobileWeekSelected : ""} ${date === today ? styles.mobileWeekToday : ""}`} onClick={() => onSelect(date)}><span>{WEEKDAY_SHORT[day]}</span><strong>{Number(date.slice(8))}</strong></button>;
    })}
  </div>;
}

function MobileDayView({ date, today, nowMinutes, events, onCreate, onOpenEvent }: { date: CalendarDate; today: CalendarDate; nowMinutes: number; events: readonly CalendarLabEvent[]; onCreate: (selection: CalendarSelection, origin: HTMLElement) => void; onOpenEvent: (eventId: string, origin: HTMLElement) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const layouts = useMemo(() => layoutCalendarLabEvents(events), [events]);
  useEffect(() => {
    const targetMinute = date === today ? Math.max(CALENDAR_LAB_CONFIG.startHour * 60, nowMinutes - 60) : 8 * 60;
    scrollRef.current?.scrollTo({ top: Math.max(0, (targetMinute - CALENDAR_LAB_CONFIG.startHour * 60) * MOBILE_PIXELS_PER_MINUTE) });
  }, [date, nowMinutes, today]);
  return <section className={styles.mobileDay} aria-label={`Vista giorno, ${formatFullDate(date)}`}>
    <div ref={scrollRef} className={styles.mobileDayScroll}>
      <div className={styles.mobileDayGrid} style={{ height: MOBILE_GRID_HEIGHT }}>
        <MobileTimeGutter />
        <div className={styles.mobileDayColumn} onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const raw = CALENDAR_LAB_CONFIG.startHour * 60 + ((event.clientY - rect.top) / MOBILE_PIXELS_PER_MINUTE);
          const start = Math.max(CALENDAR_LAB_CONFIG.startHour * 60, Math.min(CALENDAR_LAB_CONFIG.endHour * 60 - 15, Math.round(raw / 15) * 15));
          onCreate(normalizeCalendarSelection(date, start, Math.min(start + 45, CALENDAR_LAB_CONFIG.endHour * 60)), event.currentTarget);
        }}>
          {layouts.map((event) => <MobileTimedEvent key={event.id} event={event} onOpen={onOpenEvent} />)}
          {date === today && nowMinutes >= CALENDAR_LAB_CONFIG.startHour * 60 && nowMinutes <= CALENDAR_LAB_CONFIG.endHour * 60 ? <div className={styles.mobileCurrentTime} style={{ top: (nowMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * MOBILE_PIXELS_PER_MINUTE }} aria-label={`Ora corrente ${minutesToTime(nowMinutes)}`}><span /></div> : null}
        </div>
      </div>
    </div>
  </section>;
}

function MobileTimedEvent({ event, onOpen }: { event: ReturnType<typeof layoutCalendarLabEvents>[number]; onOpen: (eventId: string, origin: HTMLElement) => void }) {
  const duration = event.endMinutes - event.startMinutes;
  const color = calendarLabEventColor(event);
  return <button type="button" className={`${styles.mobileTimedEvent} ${event.status === "cancelled" ? styles.mobileEventCancelled : ""}`} style={{ top: (event.startMinutes - CALENDAR_LAB_CONFIG.startHour * 60) * MOBILE_PIXELS_PER_MINUTE, height: Math.max(duration * MOBILE_PIXELS_PER_MINUTE - 2, 20), ...eventHorizontalStyle(event), "--mobile-event-color": color, "--mobile-event-tint": colorToTint(color) } as React.CSSProperties} aria-label={eventAccessibleLabel(event)} onClick={(click) => { click.stopPropagation(); onOpen(event.id, click.currentTarget); }}><strong>{event.patientName}</strong>{duration >= 30 ? <span>{minutesToTime(event.startMinutes)} · {duration} min</span> : null}{duration >= 60 && event.serviceName ? <small>{event.serviceName}</small> : null}<i aria-hidden="true" className={event.sessionState === "registered" ? styles.mobileStateRegistered : styles.mobileStatePending} /></button>;
}

function MobileAgenda({ date, events, onCreate, onOpenEvent }: { date: CalendarDate; events: readonly CalendarLabEvent[]; onCreate: (origin: HTMLElement) => void; onOpenEvent: (eventId: string, origin: HTMLElement) => void }) {
  return <section className={styles.mobileAgenda} aria-labelledby="mobile-agenda-heading"><div className={styles.mobileSectionHeading}><div><h2 id="mobile-agenda-heading">{formatFullDate(date)}</h2><p>{events.length ? `${events.length} ${events.length === 1 ? "appuntamento" : "appuntamenti"}` : "Giornata libera"}</p></div><button type="button" onClick={(event) => onCreate(event.currentTarget)}>+ Nuovo</button></div>{events.length ? <div className={styles.mobileAgendaList}>{events.map((event) => <MobileAgendaRow key={event.id} event={event} onOpen={onOpenEvent} />)}</div> : <div className={styles.mobileEmpty}><strong>Nessun appuntamento</strong><p>La giornata non contiene ancora appuntamenti.</p><button type="button" onClick={(event) => onCreate(event.currentTarget)}>Nuovo appuntamento</button></div>}</section>;
}

function MobileAgendaRow({ event, onOpen }: { event: CalendarLabEvent; onOpen: (eventId: string, origin: HTMLElement) => void }) {
  const color = calendarLabEventColor(event);
  return <button type="button" className={`${styles.mobileAgendaRow} ${event.status === "cancelled" ? styles.mobileAgendaCancelled : ""}`} style={{ "--mobile-event-color": color } as React.CSSProperties} aria-label={eventAccessibleLabel(event)} onClick={(click) => onOpen(event.id, click.currentTarget)}><time>{minutesToTime(event.startMinutes)}</time><span><strong>{event.patientName}</strong><small>{[event.serviceName, event.locationName].filter(Boolean).join(" · ") || `${event.endMinutes - event.startMinutes} min`}</small></span><i className={event.sessionState === "registered" ? styles.mobileStateRegistered : styles.mobileStatePending} aria-hidden="true" /><b aria-hidden="true">›</b></button>;
}

function MobileMonth({ date, today, events, onSelectDate, onOpenDay, onCreate, onOpenEvent }: { date: CalendarDate; today: CalendarDate; events: readonly CalendarLabEvent[]; onSelectDate: (date: CalendarDate) => void; onOpenDay: () => void; onCreate: (origin: HTMLElement) => void; onOpenEvent: (eventId: string, origin: HTMLElement) => void }) {
  const days = calendarMonthDays(date);
  const month = date.slice(0, 7);
  const selected = mobileCalendarEventsForDate(events, date);
  const byDate = useMemo(() => new Map(days.map((day) => [day, mobileCalendarEventsForDate(events, day)])), [days, events]);
  return <section className={styles.mobileMonth} aria-label={`Vista mese, ${mobilePeriodLabel("month", date)}`}>
    <div className={styles.mobileMonthWeekdays}>{calendarWeekDays("2026-10-05").map((day) => <span key={day}>{WEEKDAY_SHORT[new Date(`${day}T12:00:00Z`).getUTCDay()]}</span>)}</div>
    <div className={styles.mobileMonthGrid}>{days.map((day) => { const dayEvents = byDate.get(day) ?? []; return <button key={day} type="button" aria-label={`${formatFullDate(day)}, ${dayEvents.length} appuntamenti`} aria-pressed={day === date} className={`${day.slice(0, 7) === month ? "" : styles.mobileMonthOutside} ${day === date ? styles.mobileMonthSelected : ""}`} onClick={() => onSelectDate(day)}><span className={day === today ? styles.mobileMonthToday : ""}>{Number(day.slice(8))}</span><small>{dayEvents.slice(0, 3).map((event) => <i key={event.id} style={{ background: calendarLabEventColor(event) }} />)}{dayEvents.length > 3 ? <b>+{dayEvents.length - 3}</b> : null}</small></button>; })}</div>
    <div className={styles.mobileMonthSelectedDay}><div className={styles.mobileSectionHeading}><div><h2>{formatFullDate(date)}</h2><p>{selected.length ? `${selected.length} ${selected.length === 1 ? "appuntamento" : "appuntamenti"}` : "Nessun appuntamento"}</p></div><div><button type="button" onClick={onOpenDay}>Apri giorno</button><button type="button" onClick={(event) => onCreate(event.currentTarget)}>+ Nuovo</button></div></div>{selected.length ? <div className={styles.mobileAgendaList}>{selected.map((event) => <MobileAgendaRow key={event.id} event={event} onOpen={onOpenEvent} />)}</div> : null}</div>
  </section>;
}

function MobileTimeGutter() {
  const hours = Array.from({ length: CALENDAR_LAB_CONFIG.endHour - CALENDAR_LAB_CONFIG.startHour + 1 }, (_, index) => CALENDAR_LAB_CONFIG.startHour + index);
  return <div className={styles.mobileTimeGutter}>{hours.map((hour) => <span key={hour} style={{ top: (hour - CALENDAR_LAB_CONFIG.startHour) * MOBILE_PIXELS_PER_HOUR }}>{String(hour).padStart(2, "0")}:00</span>)}</div>;
}

function mobilePeriodLabel(view: MobileCalendarLabView, date: CalendarDate) {
  const value = new Date(`${date}T12:00:00Z`);
  if (view === "month") return capitalize(new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" }).format(value));
  const week = mobileCalendarWeek(date);
  const start = new Date(`${week[0]}T12:00:00Z`);
  const end = new Date(`${week[6]}T12:00:00Z`);
  return `${start.getUTCDate()} ${start.toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" })} – ${end.getUTCDate()} ${end.toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" })}`;
}

function formatFullDate(date: CalendarDate) {
  return capitalize(new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)));
}

function eventAccessibleLabel(event: CalendarLabEvent) {
  const status = event.status === "cancelled" ? "annullato" : event.sessionState === "registered" ? "seduta registrata" : "seduta da registrare";
  return `${event.patientName}, ${minutesToTime(event.startMinutes)}–${minutesToTime(event.endMinutes)}, ${status}`;
}

function colorToTint(color: string) {
  const value = color.replace("#", "");
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return `rgb(${channels.map((channel) => Math.round(channel + (255 - channel) * .78)).join(" ")})`;
}

function capitalize(value: string) { return value.charAt(0).toLocaleUpperCase("it") + value.slice(1); }
