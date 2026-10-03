import { currentProfessionalDocumentSnapshot, type ProfessionalDocumentSnapshot } from "../economic-documents.ts";
import type { Appointment, AppointmentLocation, Patient, ProfessionalDocumentDetails, Profile, Session } from "../types.ts";

export type AttendanceAttestationDraft = {
  patientId: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  issuePlace: string;
  issueDate: string;
  includeLogo: boolean;
};

export type AttendanceAttestationField = "patientId" | "sessionId" | "startTime" | "endTime" | "location" | "issueDate";
export type AttendanceAttestationIssues = Partial<Record<AttendanceAttestationField, string>>;

export type AttendanceAttestationModel = {
  patientName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  issuePlace?: string;
  issueDate: string;
  professional: ProfessionalDocumentSnapshot;
  logoSrc?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const text = (value?: string) => value?.trim() || "";

export function todayInRome(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function sessionsForAttendance(sessions: Session[], patientId: string) {
  return sessions.filter((session) => session.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function attendanceSessionLabel(session: Session) {
  return [formatItalianDate(session.date), session.serviceNameSnapshot?.trim() || "Seduta logopedica", `${session.duration} min`].join(" · ");
}

export function addMinutes(time: string, duration: number) {
  const match = TIME_RE.exec(time);
  if (!match || !Number.isFinite(duration) || duration <= 0) return "";
  const minutes = Number(match[1]) * 60 + Number(match[2]) + duration;
  if (minutes >= 24 * 60) return "";
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function attendancePrefill(session: Session, appointments: Appointment[], locations: AppointmentLocation[]) {
  const appointment = session.appointmentId ? appointments.find((item) => item.id === session.appointmentId && item.patientId === session.patientId) : undefined;
  if (!appointment) return { sessionDate: session.date, startTime: "", endTime: "", location: "", hasRecordedSchedule: false };
  const startTime = TIME_RE.test(appointment.time) ? appointment.time : "";
  const currentLocation = appointment.locationId ? locations.find((item) => item.id === appointment.locationId)?.name.trim() : "";
  return {
    sessionDate: session.date,
    startTime,
    endTime: startTime ? addMinutes(startTime, session.duration) : "",
    location: text(appointment.locationNameSnapshot) || currentLocation || "",
    hasRecordedSchedule: Boolean(startTime),
  };
}

export function defaultAttendanceIssuePlace(profile: Profile, details?: ProfessionalDocumentDetails) {
  return text(details?.city) || text(profile.studio);
}

export function validateAttendanceDraft(draft: AttendanceAttestationDraft): AttendanceAttestationIssues {
  const issues: AttendanceAttestationIssues = {};
  if (!draft.patientId) issues.patientId = "Seleziona un paziente.";
  if (!draft.sessionId) issues.sessionId = "Seleziona una seduta.";
  if (!TIME_RE.test(draft.startTime)) issues.startTime = "Inserisci l’orario di inizio.";
  if (!TIME_RE.test(draft.endTime)) issues.endTime = "Inserisci l’orario di fine.";
  if (TIME_RE.test(draft.startTime) && TIME_RE.test(draft.endTime) && draft.endTime <= draft.startTime) issues.endTime = "L’orario di fine deve essere successivo a quello di inizio.";
  if (!text(draft.location)) issues.location = "Inserisci la sede.";
  if (!DATE_RE.test(draft.issueDate) || Number.isNaN(new Date(`${draft.issueDate}T12:00:00`).getTime())) issues.issueDate = "Inserisci una data valida.";
  return issues;
}

export function buildAttendanceModel(input: { draft: AttendanceAttestationDraft; patient: Patient; session: Session; profile: Profile; professionalDetails?: ProfessionalDocumentDetails; logoSrc?: string }): AttendanceAttestationModel {
  if (input.patient.id !== input.draft.patientId || input.session.id !== input.draft.sessionId || input.session.patientId !== input.patient.id) throw new Error("attendance_source_mismatch");
  const issues = validateAttendanceDraft(input.draft);
  if (Object.keys(issues).length) throw new Error("attendance_invalid");
  return {
    patientName: `${input.patient.firstName} ${input.patient.lastName}`.trim(),
    sessionDate: input.session.date,
    startTime: input.draft.startTime,
    endTime: input.draft.endTime,
    location: input.draft.location.trim(),
    issuePlace: text(input.draft.issuePlace) || undefined,
    issueDate: input.draft.issueDate,
    professional: currentProfessionalDocumentSnapshot(input.profile, input.professionalDetails),
    logoSrc: input.draft.includeLogo ? input.logoSrc : undefined,
  };
}

export function attendanceFileName(patient: Patient, sessionDate: string) {
  const lastName = patient.lastName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "Paziente";
  const date = DATE_RE.test(sessionDate) ? sessionDate : "data";
  return `Attestazione_presenza_${lastName}_${date}.pdf`;
}

export function formatItalianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export function professionalAddress(snapshot: ProfessionalDocumentSnapshot) {
  return [snapshot.address, snapshot.postalCode, snapshot.city, snapshot.province, snapshot.country].filter(Boolean).join(" · ");
}

export function professionalExtraDetails(snapshot: ProfessionalDocumentSnapshot) {
  return [snapshot.taxCode && `C.F. ${snapshot.taxCode}`, snapshot.vatNumber && `P. IVA ${snapshot.vatNumber}`, professionalAddress(snapshot), snapshot.email].filter(Boolean).join(" · ");
}
