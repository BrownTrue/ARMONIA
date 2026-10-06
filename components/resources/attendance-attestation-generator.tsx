"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBranding } from "@/components/branding-provider";
import { useData } from "@/components/data-provider";
import { GeneratedPdfActions } from "@/components/documents/generated-pdf-actions";
import { currentProfessionalDocumentSnapshot } from "@/lib/economic-documents";
import {
  attendanceFileName,
  attendancePrefill,
  attendanceSessionLabel,
  buildAttendanceModel,
  defaultAttendanceIssuePlace,
  formatItalianDate,
  professionalAddress,
  professionalExtraDetails,
  sessionsForAttendance,
  todayInRome,
  validateAttendanceDraft,
  type AttendanceAttestationDraft,
  type AttendanceAttestationField,
  type AttendanceAttestationIssues,
  type AttendanceAttestationModel,
} from "@/lib/professional-documents/attendance-attestation";

const emptyDraft = (issuePlace: string, includeLogo: boolean): AttendanceAttestationDraft => ({ patientId: "", sessionId: "", sessionDate: "", startTime: "", endTime: "", location: "", issuePlace, issueDate: todayInRome(), includeLogo });
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200";
const errorClass = "mt-1 text-sm font-medium text-red-700";

export function AttendanceAttestationGenerator() {
  const { data, ready } = useData();
  const { logoSrc, hasCustomLogo, ready: brandingReady } = useBranding();
  const [draft, setDraft] = useState<AttendanceAttestationDraft>(() => emptyDraft(defaultAttendanceIssuePlace(data.profile, data.professionalDocumentDetails), false));
  const [issues, setIssues] = useState<AttendanceAttestationIssues>({});
  const [preview, setPreview] = useState<AttendanceAttestationModel>();
  const formRef = useRef<HTMLFormElement>(null);
  const logoDefaultApplied = useRef(false);
  const patientSessions = useMemo(() => sessionsForAttendance(data.sessions, draft.patientId), [data.sessions, draft.patientId]);
  const selectedPatient = data.patients.find((patient) => patient.id === draft.patientId);
  const selectedSession = data.sessions.find((session) => session.id === draft.sessionId && session.patientId === draft.patientId);
  const selectedAppointment = selectedSession?.appointmentId ? data.appointments.find((appointment) => appointment.id === selectedSession.appointmentId && appointment.patientId === selectedSession.patientId) : undefined;
  const requiresManualSchedule = Boolean(selectedSession && (!selectedAppointment || !/^([01]\d|2[0-3]):[0-5]\d$/.test(selectedAppointment.time)));
  const professional = useMemo(() => buildProfessionalPreview(data.profile, data.professionalDocumentDetails), [data.profile, data.professionalDocumentDetails]);

  useEffect(() => {
    if (!brandingReady || logoDefaultApplied.current) return;
    logoDefaultApplied.current = true;
    if (hasCustomLogo) setDraft((current) => ({ ...current, includeLogo: true }));
  }, [brandingReady, hasCustomLogo]);

  const update = <K extends keyof AttendanceAttestationDraft>(key: K, value: AttendanceAttestationDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key in issues) setIssues((current) => ({ ...current, [key]: undefined }));
    setPreview(undefined);
  };

  const choosePatient = (patientId: string) => {
    setDraft((current) => ({ ...current, patientId, sessionId: "", sessionDate: "", startTime: "", endTime: "", location: "" }));
    setIssues({});
    setPreview(undefined);
  };

  const chooseSession = (sessionId: string) => {
    const session = data.sessions.find((item) => item.id === sessionId && item.patientId === draft.patientId);
    if (!session) {
      setDraft((current) => ({ ...current, sessionId: "", sessionDate: "", startTime: "", endTime: "", location: "" }));
      return;
    }
    const prefill = attendancePrefill(session, data.appointments, data.locations);
    setDraft((current) => ({ ...current, sessionId, sessionDate: prefill.sessionDate, startTime: prefill.startTime, endTime: prefill.endTime, location: prefill.location }));
    setIssues((current) => ({ ...current, sessionId: undefined, startTime: undefined, endTime: undefined, location: undefined }));
    setPreview(undefined);
  };

  const validModel = () => {
    const nextIssues = validateAttendanceDraft(draft);
    if (!selectedPatient && !nextIssues.patientId) nextIssues.patientId = "Seleziona un paziente.";
    if (!selectedSession && !nextIssues.sessionId) nextIssues.sessionId = "Seleziona una seduta.";
    setIssues(nextIssues);
    const first = Object.keys(nextIssues)[0] as AttendanceAttestationField | undefined;
    if (first) {
      requestAnimationFrame(() => (formRef.current?.querySelector(`[data-attendance-field="${first}"]`) as HTMLElement | null)?.focus());
      return;
    }
    return buildAttendanceModel({ draft, patient: selectedPatient!, session: selectedSession!, profile: data.profile, professionalDetails: data.professionalDocumentDetails, logoSrc: hasCustomLogo && draft.includeLogo ? logoSrc : undefined });
  };

  const showPreview = () => {
    const model = validModel();
    if (model) setPreview(model);
  };

  const generatePdf = async () => {
    const model = validModel();
    if (!model || !selectedPatient) return;
    const [{ pdf }, { attendanceAttestationPdfDocument }] = await Promise.all([import("@react-pdf/renderer"), import("@/components/resources/attendance-attestation-pdf")]);
    const blob = await pdf(attendanceAttestationPdfDocument(model)).toBlob();
    setPreview(model);
    return blob;
  };

  if (!ready) return <div className="mt-8 rounded-2xl border border-sage-100 bg-white p-6 text-sm text-slate-500">Caricamento dati…</div>;

  return <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)]">
    <form ref={formRef} className="rounded-[1.5rem] border border-sage-100 bg-white p-5 shadow-[0_12px_32px_rgba(43,69,55,.05)] sm:p-6" onSubmit={(event) => event.preventDefault()} noValidate>
      <h2 className="text-xl font-bold">Dati dell’attestazione</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Scegli una seduta registrata. Il documento non include note, obiettivi o altri contenuti clinici.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Paziente" required error={issues.patientId} htmlFor="attendance-patient">
          <select id="attendance-patient" data-attendance-field="patientId" value={draft.patientId} onChange={(event) => choosePatient(event.target.value)} aria-invalid={Boolean(issues.patientId)} aria-describedby={issues.patientId ? "attendance-patient-error" : undefined} className={inputClass}>
            <option value="">Seleziona un paziente</option>
            {data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName}</option>)}
          </select>
        </Field>
        <Field label="Seduta" required error={issues.sessionId} htmlFor="attendance-session">
          <select id="attendance-session" data-attendance-field="sessionId" value={draft.sessionId} disabled={!draft.patientId} onChange={(event) => chooseSession(event.target.value)} aria-invalid={Boolean(issues.sessionId)} aria-describedby={issues.sessionId ? "attendance-session-error" : undefined} className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}>
            <option value="">{draft.patientId ? "Seleziona una seduta" : "Scegli prima il paziente"}</option>
            {patientSessions.map((session) => <option key={session.id} value={session.id}>{attendanceSessionLabel(session)}</option>)}
          </select>
          {draft.patientId && !patientSessions.length && <p className="mt-2 text-xs text-slate-500">Nessuna seduta registrata per questo paziente.</p>}
        </Field>
        <Field label="Data seduta" htmlFor="attendance-session-date">
          <input id="attendance-session-date" value={draft.sessionDate ? formatItalianDate(draft.sessionDate) : ""} placeholder="Seleziona una seduta" readOnly aria-readonly="true" className={`${inputClass} bg-slate-50 text-slate-600`} />
        </Field>
        <div className="hidden sm:block" aria-hidden="true" />
        <Field label="Ora inizio" required error={issues.startTime} htmlFor="attendance-start">
          <input id="attendance-start" data-attendance-field="startTime" type="time" value={draft.startTime} onChange={(event) => update("startTime", event.target.value)} aria-invalid={Boolean(issues.startTime)} aria-describedby={issues.startTime ? "attendance-start-error" : undefined} className={inputClass} />
        </Field>
        <Field label="Ora fine" required error={issues.endTime} htmlFor="attendance-end">
          <input id="attendance-end" data-attendance-field="endTime" type="time" value={draft.endTime} onChange={(event) => update("endTime", event.target.value)} aria-invalid={Boolean(issues.endTime)} aria-describedby={issues.endTime ? "attendance-end-error" : undefined} className={inputClass} />
        </Field>
        {requiresManualSchedule && <p className="-mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">Questa seduta non contiene un orario registrato. Inserisci l’orario da attestare.</p>}
        <Field label="Sede" required error={issues.location} htmlFor="attendance-location" wide>
          <input id="attendance-location" data-attendance-field="location" value={draft.location} onChange={(event) => update("location", event.target.value)} aria-invalid={Boolean(issues.location)} aria-describedby={issues.location ? "attendance-location-error" : undefined} placeholder="Es. Studio professionale" className={inputClass} />
        </Field>
        <Field label="Luogo di emissione" htmlFor="attendance-issue-place">
          <input id="attendance-issue-place" value={draft.issuePlace} onChange={(event) => update("issuePlace", event.target.value)} placeholder="Facoltativo" className={inputClass} />
        </Field>
        <Field label="Data documento" required error={issues.issueDate} htmlFor="attendance-issue-date">
          <input id="attendance-issue-date" data-attendance-field="issueDate" type="date" value={draft.issueDate} onChange={(event) => update("issueDate", event.target.value)} aria-invalid={Boolean(issues.issueDate)} aria-describedby={issues.issueDate ? "attendance-issue-date-error" : undefined} className={inputClass} />
        </Field>
      </div>

      <section className="mt-7 rounded-2xl bg-sage-50 p-4" aria-labelledby="professional-preview-title">
        <div className="flex items-start gap-3">
          {brandingReady && hasCustomLogo && <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-2"><Image src={logoSrc} alt="Logo professionale" width={80} height={56} unoptimized className="max-h-full max-w-full object-contain" /></div>}
          <div className="min-w-0"><h3 id="professional-preview-title" className="font-bold">Dati professionali</h3><p className="mt-1 text-sm font-bold text-slate-800">{professional.name || "Nome professionista non disponibile"}</p><p className="text-sm text-slate-600">{professional.lines.join(" · ") || "Completa i dati professionali nelle Impostazioni."}</p></div>
        </div>
        <Link href="/impostazioni" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-sage-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">Gestisci dati professionali</Link>
        {brandingReady && hasCustomLogo && <label className="mt-2 flex min-h-11 items-center gap-3 text-sm font-bold"><input type="checkbox" checked={draft.includeLogo} onChange={(event) => update("includeLogo", event.target.checked)} className="h-5 w-5 accent-sage-700" />Includi logo professionale</label>}
      </section>

      <div className="mt-6"><button type="button" onClick={showPreview} className="min-h-11 w-full rounded-xl border border-sage-200 px-5 text-sm font-bold text-sage-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 sm:w-auto">Anteprima contenuto</button></div>
      <GeneratedPdfActions
        title="Attestazione di presenza"
        fileName={selectedPatient && selectedSession ? attendanceFileName(selectedPatient, selectedSession.date) : "Attestazione_presenza.pdf"}
        revisionKey={JSON.stringify(draft)}
        generate={generatePdf}
      />
    </form>

    <section aria-labelledby="attendance-preview-title" className="min-w-0">
      <h2 id="attendance-preview-title" className="text-lg font-bold">Anteprima</h2>
      <p className="mt-1 text-sm text-slate-500">Il documento viene creato sul dispositivo e non viene salvato in ARMONIA.</p>
      {preview ? <AttendancePreview model={preview} /> : <div className="mt-4 grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-sage-200 bg-white p-8 text-center text-sm text-slate-500">Compila i dati e scegli “Anteprima”.</div>}
    </section>
  </div>;
}

function Field({ label, required, error, htmlFor, wide, children }: { label: string; required?: boolean; error?: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={wide ? "sm:col-span-2" : undefined}><label htmlFor={htmlFor} className="text-sm font-bold text-slate-700">{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{error && <p id={`${htmlFor}-error`} role="alert" className={errorClass}>{error}</p>}</div>;
}

function AttendancePreview({ model }: { model: AttendanceAttestationModel }) {
  const name = model.professional.professionalName || [model.professional.firstName, model.professional.lastName].filter(Boolean).join(" ");
  const address = professionalAddress(model.professional);
  const details = professionalExtraDetails(model.professional);
  return <div className="mt-4 overflow-auto rounded-[1.5rem] bg-slate-100 p-2 sm:p-4"><article className="mx-auto min-h-[42rem] w-full max-w-[46rem] bg-white px-6 py-8 text-slate-800 shadow-sm sm:px-10 sm:py-10">
    <header className="flex items-start gap-4 border-b border-slate-200 pb-5">
      {model.logoSrc && <div className="flex h-16 w-24 shrink-0 items-center justify-center"><Image src={model.logoSrc} alt="" width={96} height={64} unoptimized className="max-h-full max-w-full object-contain" /></div>}
      <div><p className="font-bold text-sage-900">{name}</p><p className="text-sm text-slate-600">{model.professional.profession || "Logopedista"}</p>{model.professional.studio && <p className="text-sm text-slate-600">{model.professional.studio}</p>}{address && <p className="mt-1 text-xs text-slate-500">{address}</p>}{model.professional.email && <p className="text-xs text-slate-500">{model.professional.email}</p>}</div>
    </header>
    <h3 className="mt-12 text-center text-xl font-bold">Attestazione di presenza</h3>
    <div className="mt-10 space-y-5 text-sm leading-7 sm:text-base">
      <p>Si attesta che <strong>{model.patientName}</strong> ha effettuato una seduta logopedica in data <strong>{formatItalianDate(model.sessionDate)}</strong>, dalle ore <strong>{model.startTime}</strong> alle ore <strong>{model.endTime}</strong>, presso <strong>{model.location}</strong>.</p>
      <p>Il presente documento viene rilasciato su richiesta dell’interessato per gli usi consentiti.</p>
    </div>
    <p className="mt-10 text-sm">{[model.issuePlace, formatItalianDate(model.issueDate)].filter(Boolean).join(", ")}</p>
    <div className="ml-auto mt-12 w-56 text-center text-sm"><p className="font-bold">{name}</p><p>Logopedista</p>{details && <p className="mt-2 text-xs leading-5 text-slate-500">{details}</p>}<div className="mt-14 border-t border-slate-400 pt-1 text-xs text-slate-500">Firma</div></div>
  </article></div>;
}

function buildProfessionalPreview(profile: Parameters<typeof defaultAttendanceIssuePlace>[0], details: Parameters<typeof defaultAttendanceIssuePlace>[1]) {
  const snapshot = currentProfessionalDocumentSnapshot(profile, details);
  return { name: snapshot.professionalName || "", lines: [snapshot.profession || "Logopedista", snapshot.studio, professionalAddress(snapshot), snapshot.taxCode && `C.F. ${snapshot.taxCode}`, snapshot.vatNumber && `P. IVA ${snapshot.vatNumber}`].filter(Boolean) as string[] };
}
