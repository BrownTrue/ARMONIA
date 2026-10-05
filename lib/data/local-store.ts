import type { AppData, Appointment } from "../types.ts";
import { parseExerciseRecipeV1 } from "../exercise-lab/recipes.ts";
import { parseWorksheetTemplateV1 } from "../exercise-lab/worksheet-templates.ts";
import { parsePatientWorksheetV1 } from "../exercise-lab/patient-worksheets.ts";

export const LOCAL_DATA_KEY = "armonia-demo-v2";
export const LOCAL_SCHEMA_VERSION = 1 as const;

export type LocalDataEnvelope = {
  schemaVersion: typeof LOCAL_SCHEMA_VERSION;
  savedAt: string;
  data: AppData;
};

export type LocalDataReadResult = {
  data: AppData;
  writable: boolean;
  migrated: boolean;
  error?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const arrayOrEmpty = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const validExerciseRecipes = (value: unknown) => arrayOrEmpty<unknown>(value).flatMap((entry) => { try { return [parseExerciseRecipeV1(entry)]; } catch { return []; } });
const validWorksheetTemplates = (value: unknown) => arrayOrEmpty<unknown>(value).flatMap((entry) => { try { return [parseWorksheetTemplateV1(entry)]; } catch { return []; } });
const validPatientWorksheets = (value: unknown) => arrayOrEmpty<unknown>(value).flatMap((entry) => { try { return [parsePatientWorksheetV1(entry)]; } catch { return []; } });

const validRecurrencePosition = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const compareCurrentAppointmentOrder = (left: Appointment, right: Appointment) =>
  left.date.localeCompare(right.date) || left.time.localeCompare(right.time) || left.id.localeCompare(right.id);

export function normalizeAppointmentRecurrencePositions(value: unknown): Appointment[] {
  const appointments = arrayOrEmpty<Appointment>(value).map((appointment) => ({ ...appointment }));
  const series = new Map<string, number[]>();
  appointments.forEach((appointment, index) => {
    if (!appointment.recurrenceSeriesId) {
      delete appointment.recurrencePosition;
      return;
    }
    const indexes = series.get(appointment.recurrenceSeriesId) ?? [];
    indexes.push(index);
    series.set(appointment.recurrenceSeriesId, indexes);
  });
  for (const indexes of series.values()) {
    const ordered = [...indexes].sort((left, right) =>
      compareCurrentAppointmentOrder(appointments[left], appointments[right]));
    const used = new Set<number>();
    for (const index of ordered) {
      const position = appointments[index].recurrencePosition;
      if (validRecurrencePosition(position) && !used.has(position)) used.add(position);
      else delete appointments[index].recurrencePosition;
    }
    let nextPosition = 0;
    for (const index of ordered) {
      if (appointments[index].recurrencePosition !== undefined) continue;
      while (used.has(nextPosition)) nextPosition += 1;
      appointments[index].recurrencePosition = nextPosition;
      used.add(nextPosition);
    }
  }
  return appointments;
}

function needsRecurrencePositionMigration(value: unknown): boolean {
  const appointments = arrayOrEmpty<Appointment>(value);
  const seen = new Map<string, Set<number>>();
  return appointments.some((appointment) => {
    if (!appointment.recurrenceSeriesId) return appointment.recurrencePosition !== undefined;
    if (!validRecurrencePosition(appointment.recurrencePosition)) return true;
    const positions = seen.get(appointment.recurrenceSeriesId) ?? new Set<number>();
    if (positions.has(appointment.recurrencePosition)) return true;
    positions.add(appointment.recurrencePosition);
    seen.set(appointment.recurrenceSeriesId, positions);
    return false;
  });
}

export function normalizeAppData(value: unknown): AppData {
  const source = isRecord(value) ? value : {};
  const profile = isRecord(source.profile) ? source.profile : {};
  const professionalDocumentDetails = isRecord(source.professionalDocumentDetails)
    ? source.professionalDocumentDetails as AppData["professionalDocumentDetails"]
    : undefined;
  return {
    patients: arrayOrEmpty(source.patients),
    patientAdministrativeDetails: arrayOrEmpty(source.patientAdministrativeDetails),
    ...(professionalDocumentDetails ? { professionalDocumentDetails } : {}),
    economicDocuments: arrayOrEmpty(source.economicDocuments),
    economicDocumentLines: arrayOrEmpty(source.economicDocumentLines),
    exerciseRecipes: validExerciseRecipes(source.exerciseRecipes),
    worksheetTemplates: validWorksheetTemplates(source.worksheetTemplates),
    patientWorksheets: validPatientWorksheets(source.patientWorksheets),
    appointments: normalizeAppointmentRecurrencePositions(source.appointments),
    locations: arrayOrEmpty(source.locations),
    services: arrayOrEmpty(source.services),
    sessions: arrayOrEmpty(source.sessions),
    payments: arrayOrEmpty(source.payments),
    paymentAllocations: arrayOrEmpty(source.paymentAllocations),
    goals: arrayOrEmpty(source.goals),
    materials: arrayOrEmpty(source.materials),
    clinicalPathways: arrayOrEmpty(source.clinicalPathways),
    clinicalAssessments: arrayOrEmpty(source.clinicalAssessments),
    profile: {
      firstName: typeof profile.firstName === "string" ? profile.firstName : "",
      lastName: typeof profile.lastName === "string" ? profile.lastName : "",
      profession: typeof profile.profession === "string" ? profile.profession : "",
      email: typeof profile.email === "string" ? profile.email : "",
      studio: typeof profile.studio === "string" ? profile.studio : "",
      calendarColorMode: profile.calendarColorMode === "service" ? "service" : "location",
      ...(typeof profile.onboardingCompletedAt === "string" ? { onboardingCompletedAt: profile.onboardingCompletedAt } : {}),
    },
  };
}

export function readLocalData(raw: string | null, whenMissing: () => AppData): LocalDataReadResult {
  if (raw === null) return { data: normalizeAppData(whenMissing()), writable: true, migrated: true };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: normalizeAppData({}), writable: false, migrated: false, error: "I dati locali non sono leggibili. Il valore originale è stato conservato." };
  }
  if (!isRecord(parsed)) {
    return { data: normalizeAppData({}), writable: false, migrated: false, error: "Il formato dei dati locali non è valido. Il valore originale è stato conservato." };
  }
  if ("schemaVersion" in parsed) {
    if (parsed.schemaVersion !== LOCAL_SCHEMA_VERSION) {
      return { data: normalizeAppData({}), writable: false, migrated: false, error: "Questi dati locali appartengono a una versione più recente e non sono stati modificati." };
    }
    if (!isRecord(parsed.data)) {
      return { data: normalizeAppData({}), writable: false, migrated: false, error: "L'archivio locale versionato non contiene dati validi ed è stato conservato." };
    }
    const normalized = normalizeAppData(parsed.data);
    const missingCollections = !Array.isArray(parsed.data.clinicalPathways)
      || !Array.isArray(parsed.data.clinicalAssessments)
      || !Array.isArray(parsed.data.locations)
      || !Array.isArray(parsed.data.services)
      || !Array.isArray(parsed.data.payments)
      || !Array.isArray(parsed.data.paymentAllocations)
      || !Array.isArray(parsed.data.patientAdministrativeDetails)
      || !Array.isArray(parsed.data.economicDocuments)
      || !Array.isArray(parsed.data.economicDocumentLines)
      || !Array.isArray(parsed.data.exerciseRecipes)
      || !Array.isArray(parsed.data.worksheetTemplates)
      || !Array.isArray(parsed.data.patientWorksheets);
    return { data: normalized, writable: true, migrated: missingCollections || needsRecurrencePositionMigration(parsed.data.appointments) };
  }
  return { data: normalizeAppData(parsed), writable: true, migrated: true };
}

export function serializeLocalData(data: AppData, savedAt = new Date().toISOString()) {
  const envelope: LocalDataEnvelope = { schemaVersion: LOCAL_SCHEMA_VERSION, savedAt, data: normalizeAppData(data) };
  return JSON.stringify(envelope);
}
