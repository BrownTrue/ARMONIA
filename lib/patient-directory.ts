import type { Patient } from "./types.ts";
import { age, fullName } from "./types.ts";

export function filterPatients(patients: Patient[], query: string) {
  const normalizedQuery = query.toLocaleLowerCase("it-IT");
  return patients.filter((patient) => fullName(patient).toLocaleLowerCase("it-IT").includes(normalizedQuery));
}

export function patientDirectoryMeta(patient: Patient) {
  const patientAge = age(patient.birthDate);
  const status = patient.status === "active" ? "Attivo" : patient.status === "suspended" ? "Sospeso" : "Concluso";
  return `${patientAge > 0 ? `${patientAge} anni` : "Età non indicata"} · ${status}`;
}
