"use client";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { AppointmentForm } from "@/components/appointment-form";
import { Modal } from "@/components/modal";
import type { Appointment } from "@/lib/types";
import { fullName, today } from "@/lib/types";

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
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const atNoon = (s: string) => new Date(s + "T12:00:00");
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const weekStart = (d: Date) => {
  const x = new Date(d),
    day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(12, 0, 0, 0);
  return x;
};
const patientName = (
  a: Appointment,
  patients: ReturnType<typeof useData>["data"]["patients"],
) => {
  const p = patients.find((x) => x.id === a.patientId);
  return p ? fullName(p) : "Paziente eliminato";
};

export default function Calendar() {
  const { data, deleteAppointment } = useData();
  const [view, setView] = useState<View>("agenda"),
    [cursor, setCursor] = useState(() => atNoon(today())),
    [editor, setEditor] = useState<Editor>(null),
    [showPast, setShowPast] = useState(false);
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
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="mt-2 text-slate-500">
            Organizza appuntamenti e giornate di lavoro.
          </p>
        </div>
        <button
          onClick={() => setEditor({ date: today() })}
          disabled={!data.patients.length}
          title={!data.patients.length ? "Crea prima un paziente" : undefined}
          className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Nuovo appuntamento
        </button>
      </header>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          aria-label="Vista calendario"
          className="inline-flex rounded-xl bg-sage-100 p-1"
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
              className={`rounded-lg px-4 py-2 text-sm font-bold ${view === key ? "bg-white text-sage-700 shadow-sm" : "text-slate-500"}`}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        {view !== "agenda" && (
          <div className="flex items-center gap-2">
            <button
              aria-label="Periodo precedente"
              onClick={() => move(-1)}
              className="btn btn-quiet"
            >
              ‹
            </button>
            <button
              onClick={() => setCursor(atNoon(today()))}
              className="btn btn-quiet"
            >
              Oggi
            </button>
            <button
              aria-label="Periodo successivo"
              onClick={() => move(1)}
              className="btn btn-quiet"
            >
              ›
            </button>
          </div>
        )}
      </div>
      {view !== "agenda" && (
        <h2 className="mb-4 text-xl font-bold capitalize">{title}</h2>
      )}
      {view === "month" ? (
        <MonthView
          cursor={cursor}
          appointments={data.appointments}
          patients={data.patients}
          onCreate={(date) => setEditor({ date })}
          onEdit={(appointment) => setEditor({ appointment })}
        />
      ) : view === "week" ? (
        <WeekView
          cursor={cursor}
          appointments={data.appointments}
          patients={data.patients}
          onCreate={(date, time) => setEditor({ date, time })}
          onEdit={(appointment) => setEditor({ appointment })}
        />
      ) : (
        <Agenda
          appointments={data.appointments}
          patients={data.patients}
          showPast={showPast}
          setShowPast={setShowPast}
          onEdit={(appointment) => setEditor({ appointment })}
          onDelete={deleteAppointment}
        />
      )}{" "}
      {editor && (
        <Modal
          title={
            editor.appointment ? "Dettaglio appuntamento" : "Nuovo appuntamento"
          }
          onClose={() => setEditor(null)}
        >
          <AppointmentForm
            appointment={editor.appointment}
            initialDate={editor.date}
            initialTime={editor.time}
            onDone={() => setEditor(null)}
          />
          {editor.appointment && (
            <div className="mt-4 border-t border-sage-100 pt-4">
              <button
                onClick={() => {
                  if (confirm("Eliminare questo appuntamento?")) {
                    deleteAppointment(editor.appointment!.id);
                    setEditor(null);
                  }
                }}
                className="btn text-red-600"
              >
                Elimina appuntamento
              </button>
            </div>
          )}
        </Modal>
      )}
    </AppShell>
  );
}

function MonthView({
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
    <div className="card overflow-hidden">
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
  );
}

function WeekView({
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
  patients,
  showPast,
  setShowPast,
  onEdit,
  onDelete,
}: {
  appointments: Appointment[];
  patients: ReturnType<typeof useData>["data"]["patients"];
  showPast: boolean;
  setShowPast: (v: boolean) => void;
  onEdit: (a: Appointment) => void;
  onDelete: (id: string) => void;
}) {
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
      <div className="mb-4 flex items-center justify-between">
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
                {items.map((a) => (
                  <article
                    key={a.id}
                    className="card flex flex-wrap items-center gap-4 p-4"
                  >
                    <div className="min-w-24">
                      <b>{a.time}</b>
                      <p className="text-sm text-sage-700">{a.duration} min</p>
                    </div>
                    <div className="min-w-44 flex-1">
                      <h4 className="font-bold">{patientName(a, patients)}</h4>
                      <p className="text-sm text-slate-500">
                        {labels[a.type]}
                        {a.notes ? " · " + a.notes : ""}
                      </p>
                    </div>
                    <button className="btn btn-quiet" onClick={() => onEdit(a)}>
                      Apri / modifica
                    </button>
                    <button
                      className="btn text-red-600"
                      onClick={() =>
                        confirm("Eliminare questo appuntamento?") &&
                        onDelete(a.id)
                      }
                    >
                      Elimina
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
