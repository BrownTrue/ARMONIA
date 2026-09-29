import type { Patient, PatientAdministrativeDetails } from "./types.ts";

const optionalText = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized || undefined;
};
const taxCode = (value: string | undefined) => optionalText(value)?.toUpperCase();

export function normalizePatientAdministrativeDetails(details: PatientAdministrativeDetails): PatientAdministrativeDetails {
  return {
    patientId: details.patientId,
    patientTaxCode: taxCode(details.patientTaxCode),
    patientAddress: optionalText(details.patientAddress),
    patientPostalCode: optionalText(details.patientPostalCode),
    patientCity: optionalText(details.patientCity),
    patientProvince: optionalText(details.patientProvince),
    patientCountry: optionalText(details.patientCountry),
    billingSubjectType: details.billingSubjectType,
    recipientFirstName: optionalText(details.recipientFirstName),
    recipientLastName: optionalText(details.recipientLastName),
    recipientTaxCode: taxCode(details.recipientTaxCode),
    recipientRelationship: optionalText(details.recipientRelationship),
    recipientAddress: optionalText(details.recipientAddress),
    recipientPostalCode: optionalText(details.recipientPostalCode),
    recipientCity: optionalText(details.recipientCity),
    recipientProvince: optionalText(details.recipientProvince),
    recipientCountry: optionalText(details.recipientCountry),
    administrativeEmail: optionalText(details.administrativeEmail),
    createdAt: details.createdAt,
    updatedAt: details.updatedAt,
  };
}

export function detailsByPatientId(details: PatientAdministrativeDetails[], patientId: string) {
  return details.find((item) => item.patientId === patientId);
}

export function upsertPatientAdministrativeDetails(items: PatientAdministrativeDetails[], details: PatientAdministrativeDetails) {
  const normalized = normalizePatientAdministrativeDetails(details);
  return items.some((item) => item.patientId === details.patientId)
    ? items.map((item) => item.patientId === details.patientId ? normalized : item)
    : [normalized, ...items];
}

export function removePatientAdministrativeDetails(items: PatientAdministrativeDetails[], patientId: string) {
  return items.filter((item) => item.patientId !== patientId);
}

const administrativeTextFields: (keyof PatientAdministrativeDetails)[] = [
  "patientTaxCode", "patientAddress", "patientPostalCode", "patientCity", "patientProvince", "patientCountry",
  "recipientFirstName", "recipientLastName", "recipientTaxCode", "recipientRelationship", "recipientAddress",
  "recipientPostalCode", "recipientCity", "recipientProvince", "recipientCountry", "administrativeEmail",
];

export function isEmptyPatientAdministrativeDetails(details: PatientAdministrativeDetails) {
  return details.billingSubjectType === "patient"
    && administrativeTextFields.every((field) => !optionalText(details[field] as string | undefined));
}

export function copyPatientAddressToRecipient(details: PatientAdministrativeDetails): PatientAdministrativeDetails {
  return {
    ...details,
    recipientAddress: details.patientAddress,
    recipientPostalCode: details.patientPostalCode,
    recipientCity: details.patientCity,
    recipientProvince: details.patientProvince,
    recipientCountry: details.patientCountry,
  };
}

export function isValidAdministrativeEmail(value: string | undefined) {
  const normalized = optionalText(value);
  return !normalized || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export async function savePatientWithAdministrativeDetails(
  patient: Patient,
  details: PatientAdministrativeDetails,
  existingDetails: PatientAdministrativeDetails | undefined,
  savePatient: (patient: Patient) => Promise<void>,
  saveDetails: (details: PatientAdministrativeDetails) => Promise<void>,
  deleteDetails: (patientId: string) => Promise<void>,
) {
  try { await savePatient(patient); }
  catch (cause) { throw new PatientAdministrativePersistenceError("patient", cause); }
  const normalized = normalizePatientAdministrativeDetails(details);
  try {
    if (isEmptyPatientAdministrativeDetails(normalized)) {
      if (existingDetails) await deleteDetails(patient.id);
      return "none" as const;
    }
    await saveDetails(normalized);
    return "saved" as const;
  } catch (cause) {
    throw new PatientAdministrativePersistenceError("administrative", cause);
  }
}

export class PatientAdministrativePersistenceError extends Error {
  readonly stage: "patient" | "administrative";
  constructor(stage: "patient" | "administrative", options?: unknown) {
    super(stage === "patient" ? "patient_save_failed" : "administrative_details_save_failed", { cause: options });
    this.name = "PatientAdministrativePersistenceError";
    this.stage = stage;
  }
}

export function administrativeDetailsSummary(patient: Patient, details: PatientAdministrativeDetails) {
  const recipient = details.billingSubjectType === "patient"
    ? "Paziente stesso"
    : [details.recipientFirstName, details.recipientLastName].filter(Boolean).join(" ") || "Un'altra persona";
  const residence = [details.patientCity, details.patientProvince].filter(Boolean).join(" · ");
  return [
    details.patientTaxCode ? { label: "Codice fiscale", value: details.patientTaxCode } : undefined,
    residence ? { label: "Comune / residenza", value: residence } : undefined,
    { label: "Intestatario", value: details.billingSubjectType === "patient" ? `${recipient} · ${patient.firstName} ${patient.lastName}` : recipient },
    details.administrativeEmail ? { label: "Email amministrativa", value: details.administrativeEmail } : undefined,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

export type CurrentDocumentRecipient = {
  firstName: string;
  lastName: string;
  taxCode?: string;
  relationship?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  administrativeEmail?: string;
};

export function currentDocumentRecipient(patient: Patient, details: PatientAdministrativeDetails): CurrentDocumentRecipient {
  if (details.billingSubjectType === "other") {
    return {
      firstName: details.recipientFirstName || "",
      lastName: details.recipientLastName || "",
      taxCode: details.recipientTaxCode,
      relationship: details.recipientRelationship,
      address: details.recipientAddress,
      postalCode: details.recipientPostalCode,
      city: details.recipientCity,
      province: details.recipientProvince,
      country: details.recipientCountry,
      administrativeEmail: details.administrativeEmail,
    };
  }
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    taxCode: details.patientTaxCode,
    address: details.patientAddress,
    postalCode: details.patientPostalCode,
    city: details.patientCity,
    province: details.patientProvince,
    country: details.patientCountry,
    administrativeEmail: details.administrativeEmail,
  };
}
