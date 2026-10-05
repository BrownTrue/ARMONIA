import Link from "next/link";
import { CalendarPlusIcon, ChevronRightIcon, SessionIcon } from "@/components/app-shell/navigation-icons";
import { calendarEventColors, getAppointmentDisplayColor } from "@/lib/calendar-visual";
import type { AppData, Appointment, Patient } from "@/lib/types";
import { fullName } from "@/lib/types";
import type { deriveTodayDashboard } from "@/lib/today-dashboard";

type TodayDashboard = ReturnType<typeof deriveTodayDashboard>;

export function MobileToday({ data, ready, dashboard, dateLabel }: { data: AppData; ready: boolean; dashboard: TodayDashboard; dateLabel: string }) {
  const overdueIds = new Set(dashboard.overdue.map((appointment) => appointment.id));
  const agenda = dashboard.all.filter((appointment) => appointment.id !== dashboard.next?.id && !overdueIds.has(appointment.id));
  return <div className="md:hidden">
    <header className="pb-7 pt-1">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-[#75857b] capitalize">{dateLabel}</p>
      <h1 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.035em] text-[#24352f]">Buongiorno, {data.profile.firstName}</h1>
    </header>

    <div className="mb-8 flex flex-wrap gap-2 text-sm font-medium">
      <Link href="/calendario" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#46654c] px-3.5 text-white transition-colors hover:bg-[#385840] active:bg-[#2f4c37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"><CalendarPlusIcon/>Nuovo appuntamento</Link>
      <Link href="/sedute/nuova" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#edf1e9] px-3.5 text-[#52645a] transition-colors hover:bg-[#e3e9df] active:bg-[#d8e1d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"><SessionIcon/>Registra seduta</Link>
    </div>

    {!ready ? <p className="py-8 text-sm text-[#738078]">Caricamento…</p> : dashboard.all.length === 0 ? <MobileEmptyState/> : <>
      {dashboard.next && <NextAppointment appointment={dashboard.next} data={data}/>} 
      {agenda.length > 0 && <section className={dashboard.next ? "mt-9" : ""} aria-labelledby="mobile-today-agenda">
        <SectionHeading id="mobile-today-agenda" label="Agenda di oggi" action={<Link href="/calendario" className="inline-flex items-center gap-1 rounded-lg px-2 transition-colors hover:bg-[#edf1e9] active:bg-[#dfe7dc]">Calendario<ChevronRightIcon className="h-3.5 w-3.5"/></Link>}/>
        <div className="divide-y divide-[#dde5db]">{agenda.map((appointment) => <AgendaRow key={appointment.id} appointment={appointment} data={data} completed={dashboard.completed.some((item) => item.id === appointment.id)}/>)}</div>
      </section>}
      {dashboard.overdue.length > 0 && <section className="mt-9" aria-labelledby="mobile-today-pending">
        <SectionHeading id="mobile-today-pending" label="Da completare" count={dashboard.overdue.length}/>
        <p className="mb-1 text-sm leading-6 text-[#6c776f]">Appuntamenti trascorsi per cui la seduta non è ancora stata registrata.</p>
        <div className="divide-y divide-[#e4ded3]">{dashboard.overdue.map((appointment) => <PendingRow key={appointment.id} appointment={appointment} data={data}/>)}</div>
      </section>}
    </>}
  </div>;
}

function NextAppointment({ appointment, data }: { appointment: Appointment; data: AppData }) {
  const patient = patientFor(appointment, data.patients);
  if (!patient) return null;
  const details = appointmentDetails(appointment, data);
  const colors = calendarEventColors(getAppointmentDisplayColor(appointment, data.locations, data.services));
  return <section aria-labelledby="mobile-next-appointment">
    <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#7d8b82]">Prossimo appuntamento</p>
    <div className="relative overflow-hidden rounded-[1.35rem] bg-[#edf2e9] px-4 py-[1.125rem]">
      <span aria-hidden="true" className="absolute inset-y-4 left-0 w-[3px] rounded-r-full" style={{backgroundColor:colors.accent}}/>
      <div className="flex items-baseline justify-between gap-3"><time className="text-sm font-semibold text-[#46654c]">{appointment.time}</time><span className="text-xs text-[#758078]">{appointment.duration} min</span></div>
      <h2 id="mobile-next-appointment" className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#24352f]">{fullName(patient)}</h2>
      {details && <p className="mt-1 truncate text-sm text-[#66736b]">{details}</p>}
      {appointment.notes && <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#806c51]">Da ricordare: {appointment.notes}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/sedute/nuova?a=${appointment.id}`} className="flex min-h-11 items-center rounded-xl bg-[#46654c] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2">Inizia seduta</Link>
        <Link href={`/pazienti/${patient.id}`} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-[#52645a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Apri paziente</Link>
      </div>
    </div>
  </section>;
}

function AgendaRow({ appointment, data, completed }: { appointment: Appointment; data: AppData; completed: boolean }) {
  const patient = patientFor(appointment, data.patients);
  if (!patient) return null;
  const details = appointmentDetails(appointment, data);
  const color = getAppointmentDisplayColor(appointment, data.locations, data.services);
  return <article className="flex min-h-[4.75rem] items-center gap-1 rounded-xl transition-colors hover:bg-[#f0f3ed] active:bg-[#e5ebe1]">
    <div className="flex w-12 shrink-0 items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{backgroundColor:color}}/><time className="text-sm font-semibold text-[#526158]">{appointment.time}</time></div>
    <Link href={`/pazienti/${patient.id}`} aria-label={`Apri ${fullName(patient)}`} className="flex min-h-[4.75rem] min-w-0 flex-1 items-center py-3 pl-1 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"><span className="min-w-0 flex-1"><span className="block truncate text-[0.95rem] font-semibold text-[#2d4036]">{fullName(patient)}</span>{details && <span className="mt-0.5 block truncate text-xs text-[#7b877f]">{details}</span>}<span className="mt-1 block text-[0.7rem] font-medium text-[#65766b]">{completed ? "✓ Seduta registrata" : "In programma"}</span></span><ChevronRightIcon className="mx-1 h-3.5 w-3.5 shrink-0 text-[#91a097]"/></Link>
    {!completed && <Link href={`/sedute/nuova?a=${appointment.id}`} aria-label={`Inizia seduta per ${fullName(patient)}`} className="mr-2 inline-flex min-h-9 shrink-0 items-center rounded-lg bg-[#e2e9dd] px-2.5 text-xs font-semibold text-[#46654c] transition-colors hover:bg-[#d6e1d2] active:bg-[#cbd9c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Inizia</Link>}
  </article>;
}

function PendingRow({ appointment, data }: { appointment: Appointment; data: AppData }) {
  const patient = patientFor(appointment, data.patients);
  if (!patient) return null;
  return <article className="flex min-h-[4.75rem] items-center gap-1 rounded-xl transition-colors hover:bg-[#f4f0e9] active:bg-[#ebe3d7]"><time className="w-12 shrink-0 text-sm font-semibold text-[#776a58]">{appointment.time}</time><Link href={`/pazienti/${patient.id}`} aria-label={`Apri ${fullName(patient)}`} className="flex min-h-[4.75rem] min-w-0 flex-1 items-center py-3 pl-1 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"><span className="min-w-0 flex-1"><span className="block truncate text-[0.95rem] font-semibold text-[#35463d]">{fullName(patient)}</span><span className="mt-0.5 block text-xs text-[#817969]">Seduta da registrare</span></span><ChevronRightIcon className="mx-1 h-3.5 w-3.5 shrink-0 text-[#9a8e7b]"/></Link><Link href={`/sedute/nuova?a=${appointment.id}`} className="mr-2 inline-flex min-h-9 shrink-0 items-center rounded-lg bg-[#776a58] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#665a4b] active:bg-[#584d40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7b65]">Registra</Link></article>;
}

function MobileEmptyState() {
  return <section className="border-y border-[#dde5db] py-8" aria-labelledby="mobile-today-empty"><h2 id="mobile-today-empty" className="text-lg font-semibold tracking-[-0.02em] text-[#2c4035]">Nessun appuntamento oggi.</h2><p className="mt-1 text-sm leading-6 text-[#738078]">La giornata è libera.</p><Link href="/calendario" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#46654c] focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Apri calendario</Link></section>;
}

function SectionHeading({ id, label, count, action }: { id: string; label: string; count?: number; action?: React.ReactNode }) {
  return <div className="mb-2 flex min-h-11 items-center justify-between gap-3"><h2 id={id} className="text-lg font-semibold tracking-[-0.02em] text-[#2b3f34]">{label}</h2>{action ? <span className="text-sm font-medium text-[#526b59] [&_a]:flex [&_a]:min-h-11 [&_a]:items-center">{action}</span> : count !== undefined ? <span className="text-sm font-semibold tabular-nums text-[#7a6b57]">{count}</span> : null}</div>;
}

function patientFor(appointment: Appointment, patients: Patient[]) { return patients.find((patient) => patient.id === appointment.patientId); }

function appointmentDetails(appointment: Appointment, data: AppData) {
  const location = data.locations.find((item) => item.id === appointment.locationId);
  return [appointment.serviceNameSnapshot, location?.name || appointment.locationNameSnapshot].filter(Boolean).join(" · ");
}
