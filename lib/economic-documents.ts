import { currentDocumentRecipient, type CurrentDocumentRecipient } from "./patient-administrative-details.ts";
import type { EconomicDocument, EconomicDocumentLine, Patient, PatientAdministrativeDetails, ProfessionalDocumentDetails, Profile } from "./types.ts";

const text = (value?: string) => value?.trim() || undefined;
const upper = (value?: string) => text(value)?.toUpperCase();

export function normalizeProfessionalDocumentDetails(details: ProfessionalDocumentDetails): ProfessionalDocumentDetails {
  return { userId: details.userId, taxCode: upper(details.taxCode), vatNumber: upper(details.vatNumber), address: text(details.address), postalCode: text(details.postalCode), city: text(details.city), province: text(details.province), country: text(details.country), createdAt: details.createdAt, updatedAt: details.updatedAt };
}

export type ProfessionalDocumentSnapshot = { firstName?: string; lastName?: string; professionalName?: string; profession?: string; studio?: string; taxCode?: string; vatNumber?: string; address?: string; postalCode?: string; city?: string; province?: string; country?: string; email?: string };
export type RecipientDocumentSnapshot = CurrentDocumentRecipient & { billingSubjectType?: "patient" | "other" };

export function currentProfessionalDocumentSnapshot(profile: Profile, details?: ProfessionalDocumentDetails): ProfessionalDocumentSnapshot {
  const normalized = details ? normalizeProfessionalDocumentDetails(details) : undefined;
  const firstName = text(profile.firstName), lastName = text(profile.lastName);
  return { firstName, lastName, professionalName: [firstName, lastName].filter(Boolean).join(" ") || undefined, profession: text(profile.profession), studio: text(profile.studio), taxCode: normalized?.taxCode, vatNumber: normalized?.vatNumber, address: normalized?.address, postalCode: normalized?.postalCode, city: normalized?.city, province: normalized?.province, country: normalized?.country, email: text(profile.email) };
}

export function currentEconomicDocumentRecipient(patient: Patient, details: PatientAdministrativeDetails): RecipientDocumentSnapshot {
  const recipient = currentDocumentRecipient(patient, details);
  return {
    firstName: text(recipient.firstName) || "",
    lastName: text(recipient.lastName) || "",
    taxCode: upper(recipient.taxCode),
    relationship: text(recipient.relationship),
    address: text(recipient.address),
    postalCode: text(recipient.postalCode),
    city: text(recipient.city),
    province: text(recipient.province),
    country: text(recipient.country),
    administrativeEmail: text(recipient.administrativeEmail),
    billingSubjectType: details.billingSubjectType,
  };
}

export function professionalDocumentMissingFields(snapshot: ProfessionalDocumentSnapshot) {
  const missing: string[] = [];
  if (!snapshot.professionalName) missing.push("nome professionista");
  if (!snapshot.profession) missing.push("professione");
  if (!snapshot.taxCode && !snapshot.vatNumber) missing.push("codice fiscale o partita IVA");
  if (!snapshot.address) missing.push("indirizzo");
  if (!snapshot.postalCode) missing.push("CAP");
  if (!snapshot.city) missing.push("comune");
  if (!snapshot.country) missing.push("paese");
  return missing;
}

export function recipientDocumentMissingFields(snapshot: RecipientDocumentSnapshot) {
  const missing: string[] = [];
  if (!text(snapshot.firstName)) missing.push("nome");
  if (!text(snapshot.lastName)) missing.push("cognome");
  if (!text(snapshot.address)) missing.push("indirizzo");
  if (!text(snapshot.postalCode)) missing.push("CAP");
  if (!text(snapshot.city)) missing.push("comune");
  if (!text(snapshot.country)) missing.push("paese");
  return missing;
}

export function documentTotals(lines: EconomicDocumentLine[]) {
  const subtotalCents = lines.reduce((sum, line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || !Number.isInteger(line.unitAmountCents) || line.unitAmountCents < 0 || line.lineTotalCents !== line.quantity * line.unitAmountCents) throw new Error("economic_document_line_total_invalid");
    return sum + line.lineTotalCents;
  }, 0);
  if (!Number.isSafeInteger(subtotalCents)) throw new Error("economic_document_total_invalid");
  return { subtotalCents, totalCents: subtotalCents };
}

export function isEconomicDocumentInvariantValid(document: EconomicDocument) {
  const numbered = document.sequenceNumber !== undefined && document.numberYear !== undefined && Boolean(document.documentNumber) && Boolean(document.issueDate) && Boolean(document.issuedAt);
  const noNumbering = document.sequenceNumber === undefined && document.numberYear === undefined && !document.documentNumber && !document.issueDate && !document.issuedAt;
  if (document.status === "draft") return noNumbering && !document.voidedAt;
  if (document.status === "issued") return numbered && !document.voidedAt;
  return numbered && Boolean(document.voidedAt);
}

export function saveLocalEconomicDocumentDraft(documents: EconomicDocument[], document: EconomicDocument) {
  if (document.status !== "draft" || !isEconomicDocumentInvariantValid(document)) throw new Error("economic_document_draft_invalid");
  return documents.some((item) => item.id === document.id) ? documents.map((item) => item.id === document.id ? document : item) : [document, ...documents];
}

export function deleteLocalEconomicDocumentDraft(documents: EconomicDocument[], lines: EconomicDocumentLine[], documentId: string) {
  const document = documents.find((item) => item.id === documentId);
  if (!document) return { documents, lines };
  if (document.status !== "draft") throw new Error("economic_document_not_deletable");
  return { documents: documents.filter((item) => item.id !== documentId), lines: lines.filter((line) => line.documentId !== documentId) };
}

export function saveLocalEconomicDocumentLine(lines: EconomicDocumentLine[], documents: EconomicDocument[], line: EconomicDocumentLine) {
  const previous = lines.find((item) => item.id === line.id);
  if (previous && (previous.patientId !== line.patientId || previous.documentId !== line.documentId)) throw new Error("economic_document_line_identity_immutable");
  const document = documents.find((item) => item.id === line.documentId && item.patientId === line.patientId);
  if (!document || document.status !== "draft") throw new Error("economic_document_line_not_mutable");
  documentTotals([line]);
  return lines.some((item) => item.id === line.id) ? lines.map((item) => item.id === line.id ? line : item) : [...lines, line];
}

export function deleteLocalEconomicDocumentLine(lines: EconomicDocumentLine[], documents: EconomicDocument[], lineId: string) {
  const line = lines.find((item) => item.id === lineId);
  const document = line && documents.find((item) => item.id === line.documentId);
  if (!line) return lines;
  if (!document || document.status !== "draft") throw new Error("economic_document_line_not_mutable");
  return lines.filter((item) => item.id !== lineId);
}

export function sessionIsInActiveIssuedEconomicDocument(sessionId: string, documents: EconomicDocument[], lines: EconomicDocumentLine[]) {
  const issuedIds = new Set(documents.filter((document) => document.status === "issued").map((document) => document.id));
  return lines.some((line) => line.sessionId === sessionId && issuedIds.has(line.documentId));
}

export function assertPatientEconomicDocumentDeleteAllowed(patientId: string, documents: EconomicDocument[]) {
  if (documents.some((document) => document.patientId === patientId)) throw new Error("patient_has_economic_documents");
}

export function assertSessionEconomicDocumentDeleteAllowed(sessionId: string, lines: EconomicDocumentLine[]) {
  if (lines.some((line) => line.sessionId === sessionId)) throw new Error("session_has_economic_document_lines");
}
