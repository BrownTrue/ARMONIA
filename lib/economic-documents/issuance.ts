import { createHash } from "node:crypto";

export type IssuanceAttemptRow = {
  id: string;
  document_id: string;
  status: "reserved" | "uploaded" | "finalized" | "abandoned";
  document_number: string;
  issue_date: string;
  lease_token: string;
  pdf_storage_path: string;
  logo_snapshot_path: string | null;
};

export type IssuanceDocumentRow = Record<string, unknown> & {
  id: string;
  status: "draft" | "issued" | "voided";
  professional_snapshot: Record<string, unknown>;
  recipient_snapshot: Record<string, unknown>;
  currency_code: string;
  notes: string | null;
  logo_included: boolean;
};

export type IssuanceLineRow = Record<string, unknown> & {
  description_snapshot: string;
  service_date_snapshot: string | null;
  quantity: number;
  unit_amount_cents: number;
  line_total_cents: number;
  position: number;
};

export type IssuanceReservation = {
  attempt: IssuanceAttemptRow;
  document: IssuanceDocumentRow;
  lines: IssuanceLineRow[];
};

export class EconomicDocumentServerError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  constructor(code: string, status = 500, retryable = false) {
    super(code);
    this.name = "EconomicDocumentServerError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

export type IssuanceDependencies = {
  findFinalized: () => Promise<IssuanceDocumentRow | null>;
  reserve: () => Promise<IssuanceReservation>;
  loadLogo: () => Promise<{ original: Uint8Array; renderable: Uint8Array }>;
  renderPdf: (reservation: IssuanceReservation, logo?: Uint8Array) => Promise<Uint8Array>;
  putImmutable: (path: string, bytes: Uint8Array, contentType: string) => Promise<void>;
  markUploaded: (input: {
    attempt: IssuanceAttemptRow;
    pdfSha256: string;
    pdfSize: number;
    logoSha256?: string;
    logoSize?: number;
  }) => Promise<void>;
  finalize: (attempt: IssuanceAttemptRow) => Promise<IssuanceDocumentRow>;
  recordError: (attempt: IssuanceAttemptRow, code: string) => Promise<void>;
};

export async function issueEconomicDocument(deps: IssuanceDependencies) {
  const finalized = await deps.findFinalized();
  if (finalized) return finalized;

  let reservation: IssuanceReservation | undefined;
  try {
    reservation = await deps.reserve();
    const { attempt, document } = reservation;
    if (attempt.status === "finalized" || document.status === "issued") return document;
    if (attempt.status === "uploaded") return deps.finalize(attempt);

    let renderableLogo: Uint8Array | undefined;
    let logoSha256: string | undefined;
    let logoSize: number | undefined;
    if (attempt.logo_snapshot_path) {
      const logo = await deps.loadLogo();
      renderableLogo = logo.renderable;
      logoSha256 = sha256(logo.original);
      logoSize = logo.original.byteLength;
      await deps.putImmutable(attempt.logo_snapshot_path, logo.original, "image/webp");
    }

    const pdf = await deps.renderPdf(reservation, renderableLogo);
    if (!pdf.byteLength || pdf.byteLength > 10 * 1024 * 1024) throw new EconomicDocumentServerError("pdf_size_invalid", 500, false);
    await deps.putImmutable(attempt.pdf_storage_path, pdf, "application/pdf");
    await deps.markUploaded({ attempt, pdfSha256: sha256(pdf), pdfSize: pdf.byteLength, logoSha256, logoSize });
    return deps.finalize(attempt);
  } catch (cause) {
    const error = cause instanceof EconomicDocumentServerError
      ? cause
      : new EconomicDocumentServerError("issuance_failed", 500, true);
    if (reservation?.attempt && reservation.attempt.status !== "finalized") {
      try { await deps.recordError(reservation.attempt, error.code); } catch { /* Preserve the primary error. */ }
    }
    throw error;
  }
}
