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
