"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { AppointmentForm } from "@/components/appointment-form";
import { Modal } from "@/components/modal";
import { CalendarSettingsPanel } from "@/components/calendar-settings-panel";
import type { Appointment } from "@/lib/types";
import { fullName, today } from "@/lib/types";
import { formatEuroCents } from "@/lib/calendar-v2";
import { MonthView as CalendarMonthView, WeekView as CalendarWeekView, addDays, weekStart } from "@/components/calendar-views";
import { appointmentLocationColor, calendarEventColors } from "@/lib/calendar-visual";
import { cancelAppointment, canRegisterAppointmentSession, sessionForAppointment } from "@/lib/appointment-actions";

type View = "month" | "week" | "agenda";
type Editor = {
  appointment?: Appointment;
  date?: string;
  time?: string;
} | null;
const VIEW_KEY = "armonia-calendar-view";
const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const labels = {
  regular: "Seduta",
  assessment: "Prima valutazione",
  checkup: "Controllo",
  cancelled: "Annullato",
};
const atNoon = (s: string) => new Date(s + "T12:00:00");
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const patientName = (
  a: Appointment,
  patients: ReturnType<typeof useData>["data"]["patients"],
) => {
  const p = patients.find((x) => x.id === a.patientId);
  return p ? fullName(p) : "Paziente eliminato";
};

export default function Calendar() {
  const { data, saveAppointment } = useData();
  const [view, setView] = useState<View>("agenda"),
    [cursor, setCursor] = useState(() => atNoon(today())),
    [editor, setEditor] = useState<Editor>(null),
    [cancelCandidate, setCancelCandidate] = useState<Appointment | null>(null),
    [showPast, setShowPast] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as View | null;
    setView(
      saved && ["month", "week", "agenda"].includes(saved)
        ? saved
        : window.matchMedia("(min-width: 768px)").matches
          ? "week"
          : "agenda",
    );
  }, []);
  const choose = (v: View) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };
  const move = (n: number) =>
    setCursor((d) =>
      view === "month"
        ? new Date(d.getFullYear(), d.getMonth() + n, 1, 12)
        : addDays(d, n * 7),
    );
  const title =
    view === "month"
      ? cursor.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
      : view === "week"
        ? `${weekStart(cursor).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${addDays(weekStart(cursor), 6).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
        : "Agenda";
  return (
    <AppShell>
      <header className="page-header mb-3 sm:mb-5">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Calendario</h1>
          <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">
            Organizza appuntamenti e giornate di lavoro.
          </p>
        </div>
        <div className="grid w-full grid-cols-[1fr_44px_44px] gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <button
            onClick={() => setEditor({ date: today() })}
            disabled={!data.patients.length}
            title={!data.patients.length ? "Crea prima un paziente" : undefined}
            className="btn btn-primary order-first min-h-11 disabled:cursor-not-allowed disabled:opacity-50 sm:order-none sm:!min-h-9 sm:!px-3 sm:!py-1.5 sm:text-sm"
          >
            <span className="sm:hidden">+ Nuovo</span><span className="hidden sm:inline">+ Nuovo appuntamento</span>
          </button>
          <Link href="/sedute/nuova" aria-label="Registra seduta" aria-disabled={!data.patients.length} title={!data.patients.length ? "Crea prima un paziente" : "Registra seduta"} className={`btn btn-quiet grid min-h-11 place-items-center px-0 sm:!min-h-9 sm:!px-3 sm:!py-1.5 sm:bg-transparent sm:text-sm sm:text-slate-600 sm:hover:bg-sage-50 ${!data.patients.length ? "pointer-events-none opacity-50" : ""}`}><span aria-hidden="true" className="sm:hidden">✎</span><span className="hidden sm:inline">Registra seduta</span></Link>
          <button type="button" onClick={() => setSettingsOpen(true)} className="btn btn-quiet grid min-h-11 place-items-center px-0 sm:!min-h-9 sm:!px-3 sm:!py-1.5 sm:bg-transparent sm:text-sm sm:text-slate-600 sm:hover:bg-sage-50" aria-label="Apri impostazioni calendario" title="Impostazioni calendario"><span aria-hidden="true">⚙</span><span className="ml-1 hidden sm:inline">Impostazioni calendario</span></button>
        </div>
      </header>
      <div className="mb-3 flex flex-row items-center justify-between gap-2 sm:mb-5 sm:flex-wrap">
        <div
          aria-label="Vista calendario"
          className="grid min-w-0 flex-1 grid-cols-3 rounded-xl bg-sage-100 p-1 sm:flex-none"
        >
          {(
            [
              ["month", "Mese"],
              ["week", "Settimana"],
              ["agenda", "Agenda"],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              aria-pressed={view === key}
              onClick={() => choose(key)}
              className={`min-h-9 rounded-lg px-1.5 py-1.5 text-xs font-bold sm:min-h-11 sm:px-4 sm:py-2 sm:text-sm ${view === key ? "bg-white text-sage-700 shadow-sm" : "text-slate-500"}`}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        {view !== "agenda" && (
          <div className="grid shrink-0 grid-cols-[34px_42px_34px] items-center gap-1 sm:flex sm:gap-2">
            <button
              aria-label="Periodo precedente"
              onClick={() => move(-1)}
              className="btn btn-quiet !min-h-9 !px-2 !py-1"
            >
              ‹
            </button>
            <button
              onClick={() => setCursor(atNoon(today()))}
              className="btn btn-quiet !min-h-9 !px-2 !py-1 text-xs sm:text-sm"
            >
              Oggi
            </button>
            <button
              aria-label="Periodo successivo"
              onClick={() => move(1)}
              className="btn btn-quiet !min-h-9 !px-2 !py-1"
            >
              ›
            </button>
          </div>
        )}
      </div>
      {view !== "agenda" && (
        <h2 className="mb-2 text-base font-bold capitalize sm:mb-4 sm:text-xl">{title}</h2>
      )}
      {view === "month" ? (
        <CalendarMonthView
          cursor={cursor}
          appointments={data.appointments}
          patients={data.patients}
          locations={data.locations}
          onCreate={(date) => setEditor({ date })}
          onEdit={(appointment) => setEditor({ appointment })}
        />
      ) : view === "week" ? (
        <CalendarWeekView
          cursor={cursor}
          appointments={data.appointments}
          patients={data.patients}
          locations={data.locations}
          onCreate={(date, time) => setEditor({ date, time })}
          onEdit={(appointment) => setEditor({ appointment })}
        />
      ) : (
        <Agenda
          appointments={data.appointments}
          sessions={data.sessions}
          patients={data.patients}
          locations={data.locations}
          showPast={showPast}
          setShowPast={setShowPast}
          onEdit={(appointment) => setEditor({ appointment })}
        />
      )}{" "}
      <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" />
      {editor && (
        <Modal
          title={
            editor.appointment ? "Dettaglio appuntamento" : "Nuovo appuntamento"
          }
          onClose={() => setEditor(null)}
        >
          {editor.appointment && <AppointmentSummary appointment={editor.appointment}/>}
          <AppointmentForm
            appointment={editor.appointment}
            initialDate={editor.date}
            initialTime={editor.time}
            onDone={() => setEditor(null)}
          />
          {editor.appointment && (() => {
            const linkedSession = sessionForAppointment(editor.appointment.id, data.sessions);
            return (
            <div className="mt-4 border-t border-sage-100 pt-4">
              {linkedSession ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sage-50 p-3 text-sm"><b>Seduta registrata</b><Link href={`/pazienti/${editor.appointment.patientId}?tab=activity`} className="font-bold text-sage-700">Apri seduta →</Link></div>
              ) : canRegisterAppointmentSession(editor.appointment, data.sessions) ? (
                <Link href={`/sedute/nuova?a=${editor.appointment.id}`} className="btn btn-primary mb-3 inline-block">Registra seduta</Link>
              ) : (
                <p className="mb-3 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-600">Appuntamento annullato</p>
              )}
              {editor.appointment.type !== "cancelled" && <button type="button" onClick={() => setCancelCandidate(editor.appointment!)} className="btn text-red-600">Annulla appuntamento</button>}
            </div>
          )})()}
        </Modal>
      )}
      {cancelCandidate && <Modal title="Annullare questo appuntamento?" onClose={() => setCancelCandidate(null)}><p className="text-sm leading-6 text-slate-600">Sei sicuro di voler annullare l’appuntamento con {patientName(cancelCandidate,data.patients)} del {atNoon(cancelCandidate.date).toLocaleDateString("it-IT")} alle {cancelCandidate.time}?</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCancelCandidate(null)} className="btn btn-quiet">Indietro</button><button type="button" onClick={async () => { await saveAppointment(cancelAppointment(cancelCandidate)); setCancelCandidate(null); setEditor(null); }} className="btn text-red-700">Annulla appuntamento</button></div></Modal>}
      {settingsOpen && <CalendarSettingsPanel onClose={() => setSettingsOpen(false)}/>}
    </AppShell>
  );
}

function AppointmentSummary({appointment}:{appointment:Appointment}) {
  return <dl className="mb-5 grid gap-3 rounded-xl border border-sage-100 bg-sage-50/60 p-4 text-sm sm:grid-cols-2">
    {appointment.locationNameSnapshot&&<div><dt className="text-slate-500">Sede</dt><dd className="font-bold">{appointment.locationNameSnapshot}</dd></div>}
    {appointment.serviceNameSnapshot&&<div><dt className="text-slate-500">Prestazione</dt><dd className="font-bold">{appointment.serviceNameSnapshot}</dd></div>}
    <div><dt className="text-slate-500">Durata</dt><dd className="font-bold">{appointment.duration} minuti</dd></div>
    {appointment.effectivePriceCents!==undefined&&<div><dt className="text-slate-500">Prezzo</dt><dd className="font-bold">{appointment.effectivePriceCents===0?"Gratuito":formatEuroCents(appointment.effectivePriceCents)}</dd></div>}
  </dl>;
}

function LegacyMonthView({
  cursor,
  appointments,
  patients,
  onCreate,
  onEdit,
}: {
  cursor: Date;
  appointments: Appointment[];
  patients: ReturnType<typeof useData>["data"]["patients"];
  onCreate: (d: string) => void;
  onEdit: (a: Appointment) => void;
}) {
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12),
      start = addDays(first, -((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);
  return (
    <div className="card overflow-x-auto">
      <div className="min-w-[680px]">
      <div className="grid grid-cols-7 border-b border-sage-100 bg-sage-50">
        {days.map((d) => (
          <div
            className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
            key={d}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const date = iso(d),
            items = appointments
              .filter((a) => a.date === date)
              .sort((a, b) => a.time.localeCompare(b.time)),
            current = d.getMonth() === cursor.getMonth(),
            isToday = date === today();
          return (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Nuovo appuntamento il ${d.toLocaleDateString("it-IT")}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onCreate(date);
              }}
              onClick={() => onCreate(date)}
              className={`min-h-28 cursor-pointer border-b border-r border-sage-100 p-1.5 text-left transition hover:bg-sage-50 sm:min-h-32 sm:p-2 ${current ? "bg-white" : "bg-slate-50/60 text-slate-400"}`}
              key={date}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${isToday ? "bg-sage-700 text-white" : ""}`}
              >
                {d.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {items.slice(0, 3).map((a) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(a);
                    }}
                    className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold ${a.type === "cancelled" ? "bg-slate-100 text-slate-400 line-through" : "bg-sage-100 text-sage-700 hover:bg-sage-500 hover:text-white"}`}
                    key={a.id}
                  >
                    {a.time} {patientName(a, patients)}
                  </button>
                ))}
                {items.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreate(date);
                    }}
                    className="text-xs font-bold text-sage-700"
                  >
                    +{items.length - 3} altri
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function LegacyWeekView({
  cursor,
  appointments,
  patients,
  onCreate,
  onEdit,
}: {
  cursor: Date;
  appointments: Appointment[];
  patients: ReturnType<typeof useData>["data"]["patients"];
  onCreate: (d: string, t: string) => void;
  onEdit: (a: Appointment) => void;
}) {
  const start = weekStart(cursor),
    week = Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    hourHeight = 60,
    hours = Array.from({ length: 13 }, (_, i) => i + 8);
  return (
    <div className="card overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-sage-100">
          <div />
          <>
            {week.map((d, i) => (
              <div
                className={`p-3 text-center ${iso(d) === today() ? "bg-sage-50" : ""}`}
                key={i}
              >
                <p className="text-xs font-bold uppercase text-slate-500">
                  {days[i]}
                </p>
                <p
                  className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full font-bold ${iso(d) === today() ? "bg-sage-700 text-white" : ""}`}
                >
                  {d.getDate()}
                </p>
              </div>
            ))}
          </>
        </div>
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          <div
            className="relative border-r border-sage-100"
            style={{ height: 12 * hourHeight }}
          >
            {hours.slice(0, -1).map((h, i) => (
              <span
                className="absolute right-2 -translate-y-2 text-xs text-slate-400"
                style={{ top: i * hourHeight }}
                key={h}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>
          {week.map((d) => {
            const date = iso(d),
              items = appointments.filter((a) => a.date === date);
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label={`Nuovo appuntamento ${d.toLocaleDateString("it-IT")}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onCreate(date, "09:00");
                }}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect(),
                    mins = Math.max(
                      0,
                      Math.min(
                        719,
                        Math.round(
                          (((e.clientY - r.top) / hourHeight) * 60) / 15,
                        ) * 15,
                      ),
                    );
                  onCreate(
                    date,
                    `${String(8 + Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`,
                  );
                }}
                className={`relative cursor-crosshair border-r border-sage-100 ${date === today() ? "bg-sage-50/40" : ""}`}
                style={{
                  height: 12 * hourHeight,
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0, transparent 59px, #e5efe3 60px)",
                }}
                key={date}
              >
                {items.map((a) => {
                  const [h, m] = a.time.split(":").map(Number),
                    top = (((h - 8) * 60 + m) / 60) * hourHeight;
                  if (top < 0 || top >= 12 * hourHeight) return null;
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(a);
                      }}
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg px-2 py-1 text-left text-xs shadow-sm ${a.type === "cancelled" ? "bg-slate-200 text-slate-500 line-through" : "bg-sage-500 text-white hover:bg-sage-700"}`}
                      style={{
                        top,
                        height: Math.max(28, (a.duration / 60) * hourHeight),
                      }}
                      key={a.id}
                    >
                      <b className="block truncate">
                        {patientName(a, patients)}
                      </b>
                      <span>{a.time}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Agenda({
  appointments,
  sessions,
  patients,
  locations,
  showPast,
  setShowPast,
  onEdit,
}: {
  appointments: Appointment[];
  sessions: ReturnType<typeof useData>["data"]["sessions"];
  patients: ReturnType<typeof useData>["data"]["patients"];
  locations: ReturnType<typeof useData>["data"]["locations"];
  showPast: boolean;
  setShowPast: (v: boolean) => void;
  onEdit: (a: Appointment) => void;
}) {
  const sessionsByAppointmentId = useMemo(
    () => new Map(sessions.filter((session) => session.appointmentId).map((session) => [session.appointmentId!, session])),
    [sessions],
  );
  const currentTime = new Date().toLocaleTimeString("it-IT", {hour:"2-digit", minute:"2-digit", hour12:false});
  const list = [...appointments]
    .filter((a) => showPast || a.date > today() || (a.date === today() && a.time >= currentTime))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const groups = list.reduce<Record<string, Appointment[]>>((g, a) => {
    (g[a.date] ??= []).push(a);
    return g;
  }, {});
  return (
    <>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-bold">Agenda</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
          />{" "}
          Mostra appuntamenti passati
        </label>
      </div>
      {list.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Nessun appuntamento da mostrare.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, items]) => (
            <section key={date}>
              <h3 className="mb-2 text-sm font-bold capitalize text-sage-700">
                {atNoon(date).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="space-y-2">
                {items.map((a) => {
                  const location=locations.find(item=>item.id===a.locationId);
                  const colors=calendarEventColors(appointmentLocationColor(a,locations));
                  return (
                  <article
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Apri ${patientName(a,patients)}, ${a.time}`}
                    onClick={()=>onEdit(a)}
                    onKeyDown={event=>{if(event.key==="Enter"||event.key===" ")onEdit(a);}}
                    className={`card flex cursor-pointer items-center gap-3 border-l-[3px] p-3 outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-sage-600 sm:p-3.5 ${a.type==="cancelled"?"opacity-70":""}`}
                    style={{borderLeftColor:a.type==="cancelled"?"#94A3B8":colors.accent,backgroundColor:a.type==="cancelled"?"#F8FAFC":colors.background}}
                  >
                    <div className="min-w-20 self-start sm:min-w-24">
                      <b className="text-sm sm:text-base">{a.time}</b>
                      <p className="text-xs text-sage-700 sm:text-sm">{a.duration} min</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h4 className={`min-w-0 font-bold ${a.type==="cancelled"?"line-through":""}`}>{patientName(a, patients)}</h4>
                        {a.type === "cancelled" ? (
                          <span className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-500">Annullato</span>
                        ) : sessionsByAppointmentId.has(a.id) ? (
                          <Link href={`/pazienti/${a.patientId}?tab=activity`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} className="inline-flex min-h-11 items-center rounded-full bg-sage-100 px-3 text-xs font-bold text-sage-800 hover:bg-sage-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">✓ Seduta registrata</Link>
                        ) : (
                          <Link href={`/sedute/nuova?a=${a.id}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} className="inline-flex min-h-11 items-center rounded-full border border-sage-300 bg-white px-3 text-xs font-bold text-sage-800 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Registra seduta</Link>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500 sm:text-sm">{a.serviceNameSnapshot||labels[a.type]}{location?` · ${location.name}`:""}</p>
                    </div>
                    <button
                      aria-label={`Apri azioni appuntamento di ${patientName(a,patients)}`}
                      title="Azioni appuntamento"
                      className="ml-auto min-h-11 min-w-11 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-sage-50 hover:text-sage-700 focus-visible:ring-2 focus-visible:ring-sage-500"
                      onClick={event=>{event.stopPropagation();onEdit(a);}}
                    >
                      <span aria-hidden="true">⋯</span>
                    </button>
                  </article>
                );})}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
