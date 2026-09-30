import type { EconomicDocument } from "../types";

export class EconomicDocumentRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  constructor(code: string, status: number, retryable = false) {
    super(code);
    this.name = "EconomicDocumentRequestError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function createEconomicDocumentIssueRunner() {
  let persistedDocumentId: string | undefined;
  let issueStarted = false;
  return {
    async run(input: { persist: () => Promise<{ id: string }>; issue: (documentId: string) => Promise<EconomicDocument> }) {
      if (!persistedDocumentId) persistedDocumentId = (await input.persist()).id;
      issueStarted = true;
      return input.issue(persistedDocumentId);
    },
    state: () => ({ persistedDocumentId, issueStarted }),
  };
}

async function responseBody(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ error?: string; retryable?: boolean; document?: EconomicDocument; url?: string; expiresIn?: number }>;
}

export async function issueEconomicDocument(documentId: string, request: typeof fetch = fetch) {
  let response: Response;
  try { response = await request(`/api/economic-documents/${encodeURIComponent(documentId)}/issue`, { method: "POST" }); }
  catch { throw new EconomicDocumentRequestError("network_error", 0, true); }
  const body = await responseBody(response);
  if (!response.ok || !body.document) throw new EconomicDocumentRequestError(body.error || "issuance_failed", response.status, Boolean(body.retryable));
  return body.document;
}

export async function economicDocumentDownloadUrl(documentId: string, request: typeof fetch = fetch) {
  let response: Response;
  try { response = await request(`/api/economic-documents/${encodeURIComponent(documentId)}/download`, { method: "GET" }); }
  catch { throw new EconomicDocumentRequestError("network_error", 0, true); }
  const body = await responseBody(response);
  if (!response.ok || !body.url) throw new EconomicDocumentRequestError(body.error || "download_failed", response.status, response.status >= 500);
  return body.url;
}

export async function voidEconomicDocument(documentId: string, reason: string, request: typeof fetch = fetch) {
  let response: Response;
  try {
    response = await request(`/api/economic-documents/${encodeURIComponent(documentId)}/void`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
  } catch { throw new EconomicDocumentRequestError("network_error", 0, true); }
  const body = await responseBody(response);
  if (!response.ok || !body.document) throw new EconomicDocumentRequestError(body.error || "void_failed", response.status, response.status >= 500);
  return body.document;
}

export function economicDocumentIssueErrorMessage(cause: unknown) {
  const code = cause instanceof EconomicDocumentRequestError ? cause.code : "issuance_failed";
  if (code === "missing_required_data" || code === "no_lines") return "Completa i dati necessari prima di emettere il proforma.";
  if (code === "session_already_documented") return "Una o più prestazioni sono già incluse in un altro proforma emesso. Rivedi le prestazioni selezionate.";
  if (code === "logo_missing") return "Il logo selezionato non è più disponibile. Disattiva il logo oppure caricane uno nuovo.";
  if (code === "issuance_locked") return "È già in corso un’emissione per questo documento. Riprova tra pochi secondi.";
  if (code === "document_not_found") return "Il proforma non è più disponibile. Ricarica la pagina e riprova.";
  if (code === "document_not_draft") return "Questo proforma non è più una bozza modificabile.";
  if (code === "authentication_required") return "La sessione è scaduta. Accedi di nuovo per emettere il proforma.";
  if (code === "server_configuration_error") return "L’emissione non è disponibile per un problema di configurazione del server.";
  if (code === "network_error") return "Non è stato possibile raggiungere il server. La bozza non è stata persa: puoi riprovare.";
  return "Non siamo riusciti a completare l’emissione. La bozza non è stata persa. Puoi riprovare.";
}

export function economicDocumentDownloadErrorMessage(cause: unknown) {
  const code = cause instanceof EconomicDocumentRequestError ? cause.code : "download_failed";
  if (code === "economic_document_pdf_unavailable") return "Il PDF definitivo non è disponibile. Il documento non verrà rigenerato automaticamente.";
  if (code === "authentication_required") return "La sessione è scaduta. Accedi di nuovo per aprire il PDF.";
  if (code === "network_error") return "Non è stato possibile raggiungere il server. Riprova.";
  return "Non è stato possibile aprire il PDF definitivo. Riprova.";
}

export function economicDocumentVoidErrorMessage(cause: unknown) {
  const code = cause instanceof EconomicDocumentRequestError ? cause.code : "void_failed";
  if (code === "void_reason_required") return "Inserisci il motivo dell’annullamento.";
  if (code === "document_not_issued") return "Solo un documento emesso può essere annullato.";
  if (code === "network_error") return "Non è stato possibile raggiungere il server. Il documento non è stato modificato.";
  return "Non è stato possibile annullare il documento. Riprova.";
}
