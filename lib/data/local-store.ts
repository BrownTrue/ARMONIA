import type { AppData } from "../types.ts";

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

export function normalizeAppData(value: unknown): AppData {
  const source = isRecord(value) ? value : {};
  const profile = isRecord(source.profile) ? source.profile : {};
  return {
    patients: arrayOrEmpty(source.patients),
    appointments: arrayOrEmpty(source.appointments),
    sessions: arrayOrEmpty(source.sessions),
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
    const missingClinicalCollections = !Array.isArray(parsed.data.clinicalPathways) || !Array.isArray(parsed.data.clinicalAssessments);
    return { data: normalized, writable: true, migrated: missingClinicalCollections };
  }
  return { data: normalizeAppData(parsed), writable: true, migrated: true };
}

export function serializeLocalData(data: AppData, savedAt = new Date().toISOString()) {
  const envelope: LocalDataEnvelope = { schemaVersion: LOCAL_SCHEMA_VERSION, savedAt, data: normalizeAppData(data) };
  return JSON.stringify(envelope);
}
