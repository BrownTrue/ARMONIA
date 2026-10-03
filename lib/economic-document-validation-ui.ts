import type { EconomicDocumentLine } from "./types.ts";
import type { ProfessionalDocumentSnapshot, RecipientDocumentSnapshot } from "./economic-documents.ts";
import { professionalDocumentMissingFields, recipientDocumentMissingFields } from "./economic-documents.ts";

export type ProformaValidationIssue = {
  kind: "field" | "row" | "section" | "global";
  section: "patient" | "lines" | "recipient" | "professional" | "total";
  field?: string;
  rowId?: string;
  message: string;
  summary: string;
};

const recipientFields: Record<string, string> = { nome: "firstName", cognome: "lastName", indirizzo: "address", CAP: "postalCode", comune: "city", paese: "country" };
const professionalFields: Record<string, string> = { "nome professionista": "firstName", professione: "profession", "codice fiscale o partita IVA": "taxCode", indirizzo: "address", CAP: "postalCode", comune: "city", paese: "country" };

export function proformaDraftValidationIssues(patientId: string, patientExists: boolean, lines: EconomicDocumentLine[]): ProformaValidationIssue[] {
  const issues: ProformaValidationIssue[] = [];
  if (!patientId || !patientExists) issues.push({ kind: "field", section: "patient", field: "patient", message: "Seleziona un paziente.", summary: "Paziente — seleziona un paziente" });
  if (!lines.length) issues.push({ kind: "section", section: "lines", field: "lines", message: "Aggiungi almeno una prestazione o una riga manuale.", summary: "Prestazioni — aggiungi almeno una riga" });
  lines.forEach((line, index) => {
    if (!line.descriptionSnapshot.trim()) issues.push({ kind: "row", section: "lines", rowId: line.id, field: "description", message: "Inserisci una descrizione.", summary: `Riga ${index + 1} — descrizione mancante` });
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) issues.push({ kind: "row", section: "lines", rowId: line.id, field: "quantity", message: "Inserisci una quantità valida.", summary: `Riga ${index + 1} — quantità non valida` });
    if (!Number.isInteger(line.unitAmountCents) || line.unitAmountCents < 0) issues.push({ kind: "row", section: "lines", rowId: line.id, field: "amount", message: "Inserisci un importo valido.", summary: `Riga ${index + 1} — importo non valido` });
  });
  return issues;
}

export function proformaIssuanceValidationIssues(input: { patientId: string; patientExists: boolean; lines: EconomicDocumentLine[]; recipient: RecipientDocumentSnapshot; professional: ProfessionalDocumentSnapshot; totalCents: number }): ProformaValidationIssue[] {
  const issues = proformaDraftValidationIssues(input.patientId, input.patientExists, input.lines);
  recipientDocumentMissingFields(input.recipient).forEach((label) => issues.push({ kind: "field", section: "recipient", field: recipientFields[label], message: `Completa ${label}.`, summary: `Destinatario — ${label} mancante` }));
  professionalDocumentMissingFields(input.professional).forEach((label) => issues.push({ kind: "field", section: "professional", field: professionalFields[label], message: `Completa ${label}.`, summary: `Dati professionali — ${label} mancante` }));
  if (!Number.isSafeInteger(input.totalCents) || input.totalCents < 0) issues.push({ kind: "global", section: "total", field: "total", message: "Controlla il totale del proforma.", summary: "Totale — valore non valido" });
  return issues;
}

export function proformaIssueTarget(issue: ProformaValidationIssue) {
  if (issue.rowId && issue.field) return `line-${issue.rowId}-${issue.field}`;
  return `${issue.section}-${issue.field || "section"}`;
}
