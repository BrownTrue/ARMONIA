import { euroInputToCents } from "./calendar-v2.ts";
import { isValidAdministrativeEmail } from "./patient-administrative-details.ts";

export type FieldErrors = Record<string, string>;

export function validatePatientForm(input: { firstName: string; lastName: string; administrativeEmail?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.firstName.trim()) errors.firstName = "Inserisci il nome.";
  if (!input.lastName.trim()) errors.lastName = "Inserisci il cognome.";
  if (!isValidAdministrativeEmail(input.administrativeEmail)) errors.administrativeEmail = "Inserisci un indirizzo email valido.";
  return errors;
}

export function validateAdministrativeDetails(input: { administrativeEmail?: string }): FieldErrors {
  return isValidAdministrativeEmail(input.administrativeEmail)
    ? {}
    : { administrativeEmail: "Inserisci un indirizzo email valido." };
}

export function validateAppointmentForm(input: { patientId: string; date: string; time: string; duration: number; price: string; repeat: "none" | "weekly"; recurrenceEndDate: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.patientId) errors.patientId = "Seleziona un paziente.";
  if (!input.date) errors.date = "Inserisci una data.";
  if (!input.time) errors.time = "Inserisci un orario.";
  if (!Number.isInteger(input.duration) || input.duration < 15 || (input.duration - 15) % 5 !== 0) errors.duration = "Inserisci una durata valida.";
  try { euroInputToCents(input.price); } catch { errors.price = "Inserisci un prezzo valido con al massimo due decimali."; }
  if (input.repeat === "weekly") {
    if (!input.recurrenceEndDate) errors.recurrenceEndDate = "Inserisci la data di fine ricorrenza.";
    else if (input.date && input.recurrenceEndDate < input.date) errors.recurrenceEndDate = "La data di fine non può precedere il primo appuntamento.";
  }
  return errors;
}

export function validateLocationForm(input: { name: string }): FieldErrors {
  return input.name.trim() ? {} : { name: "Inserisci il nome della sede." };
}

export function validateServiceForm(input: { name: string; duration: string; price: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = "Inserisci il nome della prestazione.";
  const duration = Number(input.duration);
  if (!Number.isInteger(duration) || duration < 5 || duration > 1440 || duration % 5 !== 0) errors.duration = "Inserisci una durata valida tra 5 e 1440 minuti.";
  try { euroInputToCents(input.price); } catch { errors.price = "Inserisci un prezzo valido con al massimo due decimali."; }
  return errors;
}

export function validateSessionForm(input: { patientId: string; date: string; duration: number; price: string; latestDate?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.patientId) errors.patientId = "Seleziona un paziente.";
  if (!input.date) errors.date = "Inserisci una data.";
  else if (input.latestDate && input.date > input.latestDate) errors.date = "La data della seduta non può essere futura.";
  if (!Number.isInteger(input.duration) || input.duration <= 0) errors.duration = "Inserisci una durata valida.";
  try { euroInputToCents(input.price); } catch { errors.price = "Inserisci un prezzo valido con al massimo due decimali."; }
  return errors;
}

export function validateClinicalPathwayForm(input: { startedOn?: string; closedOn?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (input.startedOn !== undefined && !input.startedOn) errors.startedOn = "Inserisci la data di inizio.";
  if (input.closedOn !== undefined) {
    if (!input.closedOn) errors.closedOn = "Inserisci la data di chiusura.";
    else if (input.startedOn && input.closedOn < input.startedOn) errors.closedOn = "La data di chiusura non può precedere la data di inizio.";
  }
  return errors;
}

export function validateGoalForm(input: { title: string }): FieldErrors {
  return input.title.trim() ? {} : { title: "Inserisci un titolo per l’obiettivo." };
}

export function validateNewAssessmentForm(input: { assessmentType: string; clinicalDate: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.assessmentType) errors.assessmentType = "Seleziona il tipo di valutazione.";
  if (!input.clinicalDate) errors.clinicalDate = "Inserisci la data clinica.";
  return errors;
}

export function focusFirstInvalidField(errors: FieldErrors) {
  if (typeof document === "undefined") return;
  const first = Object.keys(errors)[0];
  if (!first) return;
  requestAnimationFrame(() => {
    const control = document.querySelector<HTMLElement>(`[data-validation-field="${first}"]`);
    control?.scrollIntoView({ behavior: "smooth", block: "center" });
    control?.focus({ preventScroll: true });
  });
}
