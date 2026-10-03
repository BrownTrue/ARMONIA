"use client";

import { useState } from "react";
import { useData } from "./data-provider";
import { Field } from "./form-controls";
import { Modal } from "./modal";
import {
  administrativeDetailsSummary,
  copyPatientAddressToRecipient,
  detailsByPatientId,
  isEmptyPatientAdministrativeDetails,
  normalizePatientAdministrativeDetails,
} from "@/lib/patient-administrative-details";
import type { Patient, PatientAdministrativeDetails } from "@/lib/types";
import { focusFirstInvalidField, validateAdministrativeDetails, type FieldErrors } from "@/lib/form-validation";

const timestamp = () => new Date().toISOString();
export const blankPatientAdministrativeDetails = (patientId: string): PatientAdministrativeDetails => ({
  patientId,
  billingSubjectType: "patient",
  createdAt: timestamp(),
  updatedAt: timestamp(),
});

export function PatientAdministrativeDetailsCard({ patient }: { patient: Patient }) {
  const { data, savePatientAdministrativeDetails, deletePatientAdministrativeDetails } = useData();
  const details = detailsByPatientId(data.patientAdministrativeDetails, patient.id);
  const [open, setOpen] = useState(false);
  const summary = details ? administrativeDetailsSummary(patient, details) : [];
  return <>
    <section className="card p-4 sm:p-5 lg:col-span-12" aria-labelledby="patient-administrative-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="patient-administrative-title" className="font-bold">Dati amministrativi</h2>
          {!details && <p className="mt-1 text-sm text-slate-500">Dati fiscali e intestazione documenti non ancora inseriti.</p>}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-sage-700">{details ? "Modifica" : "Completa"}</button>
      </div>
      {details && <dl className="mt-3 grid gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => <div key={item.label} className="min-w-0"><dt className="text-xs font-bold text-slate-400">{item.label}</dt><dd className="mt-0.5 break-words text-slate-700">{item.value}</dd></div>)}
      </dl>}
    </section>
    {open && <PatientAdministrativeDetailsModal
      patient={patient}
      existing={details}
      onClose={() => setOpen(false)}
      onSave={savePatientAdministrativeDetails}
      onDelete={deletePatientAdministrativeDetails}
    />}
  </>;
}

function PatientAdministrativeDetailsModal({ patient, existing, onClose, onSave, onDelete }: {
  patient: Patient;
  existing?: PatientAdministrativeDetails;
  onClose: () => void;
  onSave: (details: PatientAdministrativeDetails) => Promise<void>;
  onDelete: (patientId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PatientAdministrativeDetails>(() => existing ? { ...existing } : blankPatientAdministrativeDetails(patient.id));
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const remove = async () => {
    if (!existing || !window.confirm("Rimuovere i dati amministrativi di questo paziente?")) return;
    setSaving(true); setServerError("");
    try { await onDelete(patient.id); onClose(); }
    catch { setServerError("Non è stato possibile rimuovere i dati amministrativi. Riprova."); setSaving(false); }
  };
  return <Modal title={existing ? "Modifica dati amministrativi" : "Completa dati amministrativi"} onClose={() => !saving && onClose()}>
    <form noValidate onSubmit={async (event) => {
      event.preventDefault();
      if (saving) return;
      const errors = validateAdministrativeDetails({ administrativeEmail: draft.administrativeEmail });
      if (Object.keys(errors).length) { setFieldErrors(errors); setServerError(""); focusFirstInvalidField(errors); return; }
      setSaving(true); setFieldErrors({}); setServerError("");
      const normalized = normalizePatientAdministrativeDetails({ ...draft, updatedAt: timestamp() });
      try {
        if (isEmptyPatientAdministrativeDetails(normalized)) {
          if (existing) await onDelete(patient.id);
        } else await onSave(normalized);
        onClose();
      } catch { setServerError("Non è stato possibile salvare i dati amministrativi. Riprova."); setSaving(false); }
    }} className="space-y-6">
      <PatientAdministrativeDetailsFields patient={patient} value={draft} onChange={(details)=>{setDraft(details);setFieldErrors({});}} errors={fieldErrors} />

      {serverError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{serverError}</p>}
      <div className="flex flex-col gap-3 border-t border-sage-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>{existing && <button type="button" disabled={saving} onClick={() => void remove()} className="min-h-11 text-sm font-bold text-red-600 disabled:opacity-50">Rimuovi dati amministrativi</button>}</div>
        <div className="form-actions sm:mt-0"><button type="button" disabled={saving} onClick={onClose} className="btn btn-quiet disabled:opacity-50">Annulla</button><button type="submit" disabled={saving} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Salvataggio…" : "Salva"}</button></div>
      </div>
    </form>
  </Modal>;
}

export function PatientAdministrativeDetailsFields({ patient, value: draft, onChange: setDraft, errors = {} }: { patient: Patient; value: PatientAdministrativeDetails; onChange: (details: PatientAdministrativeDetails) => void; errors?: FieldErrors }) {
  const update = (field: keyof PatientAdministrativeDetails, value: string) => setDraft({ ...draft, [field]: value });
  return <>
    <AdministrativeSection title="Dati fiscali del paziente">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdministrativeField label="Codice fiscale" value={draft.patientTaxCode} onChange={(value) => update("patientTaxCode", value.toUpperCase())} inputMode="text" autoCapitalize="characters" className="uppercase" />
        <AdministrativeField label="Indirizzo" value={draft.patientAddress} onChange={(value) => update("patientAddress", value)} wrapperClassName="sm:col-span-2" autoComplete="street-address" />
        <AdministrativeField label="CAP" value={draft.patientPostalCode} onChange={(value) => update("patientPostalCode", value)} inputMode="text" autoComplete="postal-code" />
        <AdministrativeField label="Comune" value={draft.patientCity} onChange={(value) => update("patientCity", value)} autoComplete="address-level2" />
        <AdministrativeField label="Provincia" value={draft.patientProvince} onChange={(value) => update("patientProvince", value)} autoComplete="address-level1" />
        <AdministrativeField label="Paese" value={draft.patientCountry} onChange={(value) => update("patientCountry", value)} autoComplete="country-name" />
      </div>
    </AdministrativeSection>
    <AdministrativeSection title="Intestatario documenti">
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Intestatario documenti">
        <SubjectOption checked={draft.billingSubjectType === "patient"} onChange={() => setDraft({ ...draft, billingSubjectType: "patient" })} label={`Il paziente stesso — ${patient.firstName || "Paziente"} ${patient.lastName}`.trim()} />
        <SubjectOption checked={draft.billingSubjectType === "other"} onChange={() => setDraft({ ...draft, billingSubjectType: "other" })} label="Un'altra persona" />
      </div>
      {draft.billingSubjectType === "other" && <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AdministrativeField label="Nome" value={draft.recipientFirstName} onChange={(value) => update("recipientFirstName", value)} autoComplete="given-name" />
        <AdministrativeField label="Cognome" value={draft.recipientLastName} onChange={(value) => update("recipientLastName", value)} autoComplete="family-name" />
        <AdministrativeField label="Codice fiscale" value={draft.recipientTaxCode} onChange={(value) => update("recipientTaxCode", value.toUpperCase())} className="uppercase" />
        <AdministrativeField label="Relazione con il paziente" value={draft.recipientRelationship} onChange={(value) => update("recipientRelationship", value)} list="recipient-relationship-suggestions" />
        <datalist id="recipient-relationship-suggestions"><option value="Madre"/><option value="Padre"/><option value="Tutore legale"/><option value="Familiare"/><option value="Altro"/></datalist>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2"><p className="text-sm font-bold">Indirizzo dell’intestatario</p><button type="button" onClick={() => setDraft(copyPatientAddressToRecipient(draft))} className="min-h-10 text-sm font-bold text-sage-700">Copia indirizzo del paziente</button></div>
        <AdministrativeField label="Indirizzo" value={draft.recipientAddress} onChange={(value) => update("recipientAddress", value)} wrapperClassName="sm:col-span-2" />
        <AdministrativeField label="CAP" value={draft.recipientPostalCode} onChange={(value) => update("recipientPostalCode", value)} inputMode="text" />
        <AdministrativeField label="Comune" value={draft.recipientCity} onChange={(value) => update("recipientCity", value)} />
        <AdministrativeField label="Provincia" value={draft.recipientProvince} onChange={(value) => update("recipientProvince", value)} />
        <AdministrativeField label="Paese" value={draft.recipientCountry} onChange={(value) => update("recipientCountry", value)} />
      </div>}
    </AdministrativeSection>
    <AdministrativeSection title="Email amministrativa">
      <AdministrativeField id="administrative-email" data-validation-field="administrativeEmail" label="Email amministrativa" type="email" value={draft.administrativeEmail} error={errors.administrativeEmail} onChange={(value) => update("administrativeEmail", value)} autoComplete="email" />
      <p className="mt-2 text-xs leading-5 text-slate-500">Per future comunicazioni o documenti amministrativi.</p>
    </AdministrativeSection>
  </>;
}

function AdministrativeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-sage-100 bg-sage-50/30 p-4 sm:p-5"><h3 className="mb-4 font-bold text-slate-800">{title}</h3>{children}</section>;
}

function AdministrativeField({ label, value, onChange, wrapperClassName = "", className = "", error, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { label: string; value?: string; onChange: (value: string) => void; wrapperClassName?: string; error?: string }) {
  return <div className={wrapperClassName}><Field {...props} label={label} value={value || ""} error={error} onChange={(event) => onChange(event.target.value)} className={className} /></div>;
}

function SubjectOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold transition ${checked ? "border-sage-400 bg-sage-50 text-sage-900" : "border-slate-200 bg-white text-slate-600 hover:border-sage-200"}`}><input type="radio" name="billingSubjectType" checked={checked} onChange={onChange} className="h-4 w-4 accent-sage-700"/><span>{label}</span></label>;
}
