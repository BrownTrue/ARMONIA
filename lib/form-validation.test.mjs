import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateAdministrativeDetails, validateAppointmentForm, validateClinicalPathwayForm, validateGoalForm, validateLocationForm, validateNewAssessmentForm, validatePatientForm, validateServiceForm, validateSessionForm } from "./form-validation.ts";

test("patient validation localizes required names and administrative email", () => {
  assert.deepEqual(validatePatientForm({ firstName: "", lastName: " ", administrativeEmail: "bad" }), {
    firstName: "Inserisci il nome.", lastName: "Inserisci il cognome.", administrativeEmail: "Inserisci un indirizzo email valido.",
  });
  assert.deepEqual(validatePatientForm({ firstName: "Ada", lastName: "Rossi", administrativeEmail: "" }), {});
  assert.deepEqual(validateAdministrativeDetails({ administrativeEmail: "bad" }), { administrativeEmail: "Inserisci un indirizzo email valido." });
});

test("appointment validation reports field and recurrence errors without changing recurrence generation", () => {
  assert.deepEqual(validateAppointmentForm({ patientId: "", date: "", time: "", duration: 10, price: "12,345", repeat: "weekly", recurrenceEndDate: "" }), {
    patientId: "Seleziona un paziente.", date: "Inserisci una data.", time: "Inserisci un orario.", duration: "Inserisci una durata valida.", price: "Inserisci un prezzo valido con al massimo due decimali.", recurrenceEndDate: "Inserisci la data di fine ricorrenza.",
  });
  assert.deepEqual(validateAppointmentForm({ patientId: "p", date: "2026-10-10", time: "09:00", duration: 45, price: "0", repeat: "weekly", recurrenceEndDate: "2026-10-01" }), {
    recurrenceEndDate: "La data di fine non può precedere il primo appuntamento.",
  });
  assert.deepEqual(validateAppointmentForm({ patientId: "p", date: "2026-10-10", time: "09:00", duration: 45, price: "", repeat: "none", recurrenceEndDate: "" }), {});
});

test("location and service validation remain field-specific", () => {
  assert.deepEqual(validateLocationForm({ name: " " }), { name: "Inserisci il nome della sede." });
  assert.deepEqual(validateServiceForm({ name: "", duration: "", price: "bad" }), {
    name: "Inserisci il nome della prestazione.", duration: "Inserisci una durata valida tra 5 e 1440 minuti.", price: "Inserisci un prezzo valido con al massimo due decimali.",
  });
  assert.deepEqual(validateServiceForm({ name: "Seduta", duration: "50", price: "0" }), {});
});

test("touched forms use Armonia validation, focus the first field and keep server errors separate", () => {
  const controls = fs.readFileSync(new URL("../components/form-controls.tsx", import.meta.url), "utf8");
  assert.match(controls, /aria-invalid/);
  assert.match(controls, /aria-describedby/);
  assert.match(controls, /border-red-400/);

  for (const file of ["patient-form.tsx", "appointment-form.tsx", "settings/locations-settings.tsx", "settings/services-settings.tsx"]) {
    const source = fs.readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
    assert.match(source, /noValidate/);
    assert.match(source, /focusFirstInvalidField/);
    assert.match(source, /serverError/);
    assert.match(source, /fieldErrors/);
  }
});

test("session validation localizes patient, date, duration and price", () => {
  assert.deepEqual(validateSessionForm({ patientId: "", date: "", duration: 0, price: "bad", latestDate: "2026-10-03" }), {
    patientId: "Seleziona un paziente.", date: "Inserisci una data.", duration: "Inserisci una durata valida.", price: "Inserisci un prezzo valido con al massimo due decimali.",
  });
  assert.deepEqual(validateSessionForm({ patientId: "p", date: "2026-10-04", duration: 45, price: "0", latestDate: "2026-10-03" }), { date: "La data della seduta non può essere futura." });
  assert.deepEqual(validateSessionForm({ patientId: "p", date: "2026-10-03", duration: 45, price: "", latestDate: "2026-10-03" }), {});
});

test("clinical pathway, goal and assessment validation stay field-specific", () => {
  assert.deepEqual(validateClinicalPathwayForm({ startedOn: "" }), { startedOn: "Inserisci la data di inizio." });
  assert.deepEqual(validateClinicalPathwayForm({ startedOn: "2026-10-03", closedOn: "2026-10-02" }), { closedOn: "La data di chiusura non può precedere la data di inizio." });
  assert.deepEqual(validateGoalForm({ title: " " }), { title: "Inserisci un titolo per l’obiettivo." });
  assert.deepEqual(validateNewAssessmentForm({ assessmentType: "", clinicalDate: "" }), { assessmentType: "Seleziona il tipo di valutazione.", clinicalDate: "Inserisci la data clinica." });
});
