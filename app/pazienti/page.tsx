"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/components/data-provider";
import { Modal } from "@/components/modal";
import { MobilePatientDirectory } from "@/components/patients/mobile-patient-directory";
import { PatientForm } from "@/components/patient-form";
import { filterPatients } from "@/lib/patient-directory";
import { age, fullName, initials } from "@/lib/types";
import styles from "@/components/patients/patient-experience.module.css";

const statusLabel = (status: string) => status === "active" ? "Attivo" : status === "suspended" ? "Sospeso" : "Concluso";
const dateLabel = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "Nessun appuntamento";

export default function Patients() {
  const { data, ready } = useData();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const list = filterPatients(data.patients, query);

  return <AppShell desktopWide>
    <MobilePatientDirectory patients={list} totalPatients={data.patients.length} ready={ready} query={query} onQueryChange={setQuery} onCreate={() => setCreating(true)}/>

    <div className={`hidden md:block ${styles.directory}`}>
      <header className={styles.directoryHeader}>
        <div className={styles.directoryHeading}>
          <p className={styles.eyebrow}>ARMONIA <span aria-hidden="true">/</span> SPAZIO DI CURA</p>
          <h1>Pazienti</h1>
          <p className={styles.intro}>Le persone che segui, tutte in un posto.</p>
        </div>
        <div className={styles.directoryHeaderActions}>
          <p className={styles.totalCount}><span className={styles.countNumber}>{data.patients.length}</span><span>{data.patients.length === 1 ? "persona seguita" : "persone seguite"}</span></p>
          <button type="button" onClick={() => setCreating(true)} className={`btn btn-primary ${styles.createAction}`}><span>Nuovo paziente</span><span className={styles.createIcon} aria-hidden="true">+</span></button>
        </div>
      </header>
      <section className={styles.directoryToolbar} aria-label="Ricerca pazienti">
        <label className={styles.searchBox}>
          <span className="sr-only">Cerca paziente</span>
          <SearchIcon className={styles.searchIcon}/>
          <input aria-label="Cerca paziente" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca per nome…" />
          {query && <button type="button" aria-label="Cancella ricerca" onClick={() => setQuery("")} className={styles.clearSearch}>×</button>}
        </label>
        <p className={styles.resultCount} role="status"><strong>{list.length}</strong> {list.length === 1 ? "risultato" : "risultati"}</p>
      </section>
      {!ready ? <p className={styles.directoryEmpty}>Caricamento…</p> : list.length === 0 ? <section className={styles.directoryEmpty} aria-live="polite"><span className={styles.emptyMark} aria-hidden="true">{query ? "⌕" : "+"}</span><h2>{query ? "Nessun paziente trovato." : "Nessun paziente ancora."}</h2><p>{query ? "Prova a modificare la ricerca." : "Aggiungi la prima persona alla tua directory."}</p>{!query && <button type="button" onClick={() => setCreating(true)} className={styles.emptyAction}>Nuovo paziente</button>}</section> : <div className={styles.patientGrid} aria-label="Elenco pazienti">{list.map((patient) => {
        const nextAppointment = data.appointments.filter((appointment) => appointment.patientId === patient.id).sort((left, right) => (left.date + left.time).localeCompare(right.date + right.time))[0];
        return <Link href={`/pazienti/${patient.id}`} className={styles.patientCard} key={patient.id} aria-label={`Apri ${fullName(patient)}`}>
          <div className={styles.cardTopline}><span className={`${styles.status} ${patient.status === "active" ? styles.statusActive : patient.status === "suspended" ? styles.statusSuspended : styles.statusCompleted}`}><span aria-hidden="true"/>{statusLabel(patient.status)}</span><span className={styles.cardArrow} aria-hidden="true">↗</span></div>
          <div className={styles.patientIdentity}><span aria-hidden="true" className={styles.patientAvatar}>{initials(patient)}</span><div className={styles.patientNameBlock}><h2>{fullName(patient)}</h2><p>{age(patient.birthDate) || "—"} anni <span aria-hidden="true">·</span> {statusLabel(patient.status)}</p></div></div>
          <div className={styles.referral}><span>Motivo dell’invio</span><p>{patient.referralReason || "Non indicato"}</p></div>
          <div className={styles.nextAppointment}><span className={styles.calendarGlyph} aria-hidden="true"><i/><b/></span><span><small>Data appuntamento</small><strong>{dateLabel(nextAppointment?.date)}</strong></span></div>
        </Link>;
      })}</div>}
    </div>

    {creating && <Modal title="Nuovo paziente" onClose={() => setCreating(false)}><PatientForm onDone={() => setCreating(false)}/></Modal>}
  </AppShell>;
}

function SearchIcon({ className }: { className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="10.75" cy="10.75" r="6.25"/><path d="m15.5 15.5 4 4"/></svg>;
}
