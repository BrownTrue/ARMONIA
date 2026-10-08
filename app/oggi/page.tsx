"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { MobileToday } from "@/components/today/mobile-today";
import { PremiumAction } from "@/components/organic-premium/premium-action";
import type { Appointment, AppointmentLocation, Patient } from "@/lib/types";
import { fullName, initials, today } from "@/lib/types";
import { currentRomeTime, deriveTodayDashboard } from "@/lib/today-dashboard";
import styles from "./oggi-editorial.module.css";

export default function Today() {
  const { data, ready } = useData();
  const dashboard = deriveTodayDashboard(data.appointments, data.sessions, today(), currentRomeTime());
  const { all: appointments, pending, completed, overdue } = dashboard;
  const dateLabel = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  const editorialDateLabel = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const activePatients = data.patients.filter((patient) => patient.status === "active").length;
  const pendingSummary = overdue.length > 0
    ? `${overdue.length} ${overdue.length === 1 ? "appuntamento" : "appuntamenti"} da registrare e ${pending.length - overdue.length} ancora in programma.`
    : `${pending.length} ${pending.length === 1 ? "appuntamento" : "appuntamenti"} ancora in programma.`;

  return <AppShell desktopWide>
    <MobileToday data={data} ready={ready} dashboard={dashboard} dateLabel={dateLabel}/>
    <div className="hidden md:contents">
      <div className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero} aria-labelledby="today-editorial-title">
            <div className={styles.heroMain}>
              <div className={styles.heroContent}>
                <p className={styles.date}>{editorialDateLabel}</p>
                <h1 id="today-editorial-title" className={`${styles.title} organic-editorial-title`}>Il tempo della <em>cura.</em></h1>
                <p className={styles.summary}>{!ready ? "La tua agenda, in un unico spazio." : pending.length === 0 ? completed.length > 0 ? "Tutti gli appuntamenti di oggi hanno una seduta registrata." : "Una giornata libera per organizzare il lavoro con calma." : pendingSummary}</p>
                <div className={styles.heroFacts} aria-label="Appuntamenti di oggi">
                  <span className={styles.heroFact}><strong>{ready ? appointments.length : "—"}</strong> appuntamenti</span>
                  <span className={styles.heroFact}><strong>{ready ? completed.length : "—"}</strong> completati oggi</span>
                </div>
              </div>
            </div>

            <div className={styles.actionsPanel} aria-label="Azioni rapide">
              <p className={styles.actionsLabel}>INIZIA DA QUI</p>
              <PremiumAction href="/calendario" className={`btn btn-primary ${styles.primaryAction}`}>+ Nuovo appuntamento</PremiumAction>
              <Link href="/sedute/nuova" className={`btn btn-quiet ${styles.secondaryAction}`}>Registra seduta <span aria-hidden="true">↗</span></Link>
              <Link href="/calendario" className={styles.calendarLink}>Vedi calendario <span aria-hidden="true">→</span></Link>
            </div>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.agendaPanel} aria-labelledby="today-agenda-title">
              <header className={styles.panelHeading}>
                <div>
                  <p className={styles.eyebrow}>IL REGISTRO DELLA GIORNATA</p>
                  <h2 id="today-agenda-title">Agenda di oggi</h2>
                </div>
                <span className={styles.panelCount}>{ready ? `${appointments.length} ${appointments.length === 1 ? "appuntamento" : "appuntamenti"}` : "Caricamento…"}</span>
              </header>

              {!ready ? <p className={styles.loadingState}>Caricamento…</p> : appointments.length === 0 ? <div className={styles.emptyState}>
                <h3>Nessun appuntamento in programma.</h3>
                <p>Puoi aggiungerne uno dal calendario.</p>
                <Link href="/calendario">Apri calendario <span aria-hidden="true">→</span></Link>
              </div> : <ol className={styles.appointmentList}>
                {appointments.map((appointment) => <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  patients={data.patients}
                  locations={data.locations}
                  completed={completed.some((item) => item.id === appointment.id)}
                  overdue={overdue.some((item) => item.id === appointment.id)}
                />)}
              </ol>}
            </section>

            <aside className={styles.summaryPanel} aria-label="Riepilogo attività">
              <p className={styles.eyebrow}>IN SINTESI</p>
              <h2>Il filo della giornata.</h2>
              <div className={styles.summaryMetric}><span>Pazienti attivi · attuali</span><strong>{ready ? activePatients : "—"}</strong></div>
              <div className={styles.summaryMetric}><span>Sedute registrate · totale</span><strong>{ready ? data.sessions.length : "—"}</strong></div>
              <p className={styles.summaryNote}>Un quadro essenziale delle attività già presenti nel tuo spazio ARMONIA.</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  </AppShell>;
}

function AppointmentRow({ appointment, patients, locations, completed, overdue }: { appointment: Appointment; patients: Patient[]; locations: AppointmentLocation[]; completed: boolean; overdue: boolean }) {
  const patient = patients.find((item) => item.id === appointment.patientId);
  if (!patient) return null;
  const location = locations.find((item) => item.id === appointment.locationId);
  const details = [appointment.serviceNameSnapshot, location?.name || appointment.locationNameSnapshot].filter(Boolean).join(" · ");
  const status = completed ? "Seduta registrata" : overdue ? "Da registrare" : "In programma";
  const statusClass = completed ? styles.statusComplete : overdue ? styles.statusOverdue : "";

  return <li className={styles.rowWrap}>
    <article className={styles.appointmentRow}>
      <div className={styles.timeBlock}><time>{appointment.time}</time><small>{appointment.duration} min</small></div>
      <span className={styles.avatar} aria-hidden="true">{initials(patient)}</span>
      <div className={styles.appointmentDetails}>
        <h3>{fullName(patient)}</h3>
        {details && <p>{details}</p>}
        {appointment.notes && <p className={styles.notes}>Da ricordare: {appointment.notes}</p>}
      </div>
      <div className={styles.rowMeta}>
        <span className={`${styles.status} ${statusClass}`}>{status}{completed && <span aria-hidden="true"> ✓</span>}</span>
        <div className={styles.rowActions}>
          {completed ? <Link href={`/pazienti/${patient.id}`} aria-label={`Apri timeline di ${fullName(patient)}`} className={styles.patientLink}>Apri</Link> : <>
            <Link href={`/sedute/nuova?a=${appointment.id}`} className={styles.rowAction}>Inizia seduta</Link>
            <Link href={`/pazienti/${patient.id}`} className={styles.patientLink}>Apri paziente</Link>
          </>}
        </div>
      </div>
    </article>
  </li>;
}
