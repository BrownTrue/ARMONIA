import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { BRANDING_BUCKET, brandingStoragePath } from "@/lib/branding/config";
import { economicDocumentFromRow } from "@/lib/supabase/repository";
import { supabaseServiceClient } from "@/lib/supabase/server";
import type { EconomicDocument } from "@/lib/types";
import { EconomicDocumentServerError, issueEconomicDocument, sha256, type IssuanceAttemptRow, type IssuanceDocumentRow, type IssuanceReservation } from "./issuance";
import { renderProformaPdf } from "./proforma-pdf";

export const ECONOMIC_DOCUMENTS_BUCKET = "economic-documents";

type SupabaseFailure = { message?: string; code?: string };
const knownCodes: [string, string][] = [
  ["economic_document_not_found", "document_not_found"], ["economic_document_not_draft", "document_not_draft"],
  ["economic_document_has_no_lines", "no_lines"], ["economic_document_line_description_required", "missing_required_data"],
  ["economic_document_snapshots_incomplete", "missing_required_data"], ["economic_document_required_fields_missing", "missing_required_data"],
  ["session_already_documented", "session_already_documented"], ["issuance_lease_invalid", "issuance_locked"],
  ["issuance_lease_expired", "issuance_locked"], ["issuance_attempt_not_uploaded", "finalize_failed"],
  ["economic_document_not_issued", "document_not_issued"], ["void_reason_required", "void_reason_required"],
];

function mapFailure(cause: SupabaseFailure | null | undefined, fallback: string): EconomicDocumentServerError {
  const message = cause?.message || "";
  const code = knownCodes.find(([internal]) => message.includes(internal))?.[1] || fallback;
  const status = code === "document_not_found" ? 404
    : code === "missing_required_data" || code === "no_lines" || code === "void_reason_required" ? 422
      : code === "session_already_documented" || code === "document_not_draft" || code === "document_not_issued" || code === "issuance_locked" ? 409 : 500;
  return new EconomicDocumentServerError(code, status, status >= 500 || code === "issuance_locked");
}

const rpcData = <T>(result: { data: unknown; error: SupabaseFailure | null }, fallback: string) => {
  if (result.error) throw mapFailure(result.error, fallback);
  return result.data as T;
};

async function putImmutable(path: string, bytes: Uint8Array, contentType: string) {
  const service = supabaseServiceClient();
  const upload = await service.storage.from(ECONOMIC_DOCUMENTS_BUCKET).upload(path, bytes, { contentType, upsert: false, cacheControl: "0" });
  if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw mapFailure(upload.error, "upload_failed");
  const downloaded = await service.storage.from(ECONOMIC_DOCUMENTS_BUCKET).download(path);
  if (downloaded.error || !downloaded.data) throw mapFailure(downloaded.error, "upload_verification_failed");
  const stored = new Uint8Array(await downloaded.data.arrayBuffer());
  if (stored.byteLength !== bytes.byteLength || sha256(stored) !== sha256(bytes)) throw new EconomicDocumentServerError("upload_verification_failed", 409, false);
}

export async function issueEconomicDocumentOnServer(userId: string, documentId: string, issueDate: string): Promise<EconomicDocument> {
  let service: ReturnType<typeof supabaseServiceClient>;
  try { service = supabaseServiceClient(); }
  catch { throw new EconomicDocumentServerError("server_configuration_error", 500, false); }
  const attemptId = randomUUID();
  const leaseToken = randomUUID();
  const result = await issueEconomicDocument({
    findFinalized: async () => {
      const attemptResult = await service.from("economic_document_issuance_attempts").select("document_id").eq("user_id", userId).eq("document_id", documentId).eq("status", "finalized").limit(1).maybeSingle();
      if (attemptResult.error) throw mapFailure(attemptResult.error, "issuance_lookup_failed");
      if (!attemptResult.data) return null;
      const documentResult = await service.from("economic_documents").select("*").eq("user_id", userId).eq("id", documentId).single();
      if (documentResult.error) throw mapFailure(documentResult.error, "economic_document_lookup_failed");
      return documentResult.data as IssuanceDocumentRow;
    },
    reserve: async () => rpcData<IssuanceReservation>(await service.rpc("reserve_economic_document_issuance", {
      p_user_id: userId, p_document_id: documentId, p_attempt_id: attemptId, p_lease_token: leaseToken, p_issue_date: issueDate, p_lease_seconds: 900,
    }), "reserve_failed"),
    loadLogo: async () => {
      const download = await service.storage.from(BRANDING_BUCKET).download(brandingStoragePath(userId));
      if (download.error || !download.data) throw new EconomicDocumentServerError("logo_missing", 422, false);
      const original = new Uint8Array(await download.data.arrayBuffer());
      if (!original.byteLength || original.byteLength > 2 * 1024 * 1024) throw new EconomicDocumentServerError("logo_missing", 422, false);
      let renderable: Uint8Array;
      try { renderable = new Uint8Array(await sharp(original).png().toBuffer()); }
      catch { throw new EconomicDocumentServerError("logo_processing_failed", 500, false); }
      return { original, renderable };
    },
    renderPdf: async (reservation, logo) => {
      try { return await renderProformaPdf(reservation, logo); }
      catch { throw new EconomicDocumentServerError("pdf_generation_failed", 500, false); }
    },
    putImmutable,
    markUploaded: async ({ attempt, pdfSha256, pdfSize, logoSha256, logoSize }) => {
      rpcData(await service.rpc("mark_economic_document_issuance_uploaded", {
        p_user_id: userId, p_attempt_id: attempt.id, p_lease_token: attempt.lease_token,
        p_pdf_storage_path: attempt.pdf_storage_path, p_pdf_sha256: pdfSha256, p_pdf_size_bytes: pdfSize,
        p_logo_snapshot_path: attempt.logo_snapshot_path, p_logo_sha256: logoSha256 ?? null, p_logo_size_bytes: logoSize ?? null,
      }), "mark_uploaded_failed");
    },
    finalize: async (attempt: IssuanceAttemptRow) => rpcData<IssuanceDocumentRow>(await service.rpc("finalize_economic_document_issuance", {
      p_user_id: userId, p_attempt_id: attempt.id, p_lease_token: attempt.lease_token,
    }), "finalize_failed"),
    recordError: async (attempt, code) => { rpcData(await service.rpc("record_economic_document_issuance_error", { p_user_id: userId, p_attempt_id: attempt.id, p_lease_token: attempt.lease_token, p_error_code: code }), "issuance_record_error_failed"); },
  });
  return economicDocumentFromRow(result as Parameters<typeof economicDocumentFromRow>[0]);
}

export async function signedEconomicDocumentUrl(userId: string, documentId: string) {
  const service = supabaseServiceClient();
  const result = await service.from("economic_documents").select("pdf_storage_path,status").eq("user_id", userId).eq("id", documentId).in("status", ["issued", "voided"]).maybeSingle();
  if (result.error) throw mapFailure(result.error, "economic_document_lookup_failed");
  if (!result.data?.pdf_storage_path) throw new EconomicDocumentServerError("economic_document_pdf_unavailable", 404, false);
  const signed = await service.storage.from(ECONOMIC_DOCUMENTS_BUCKET).createSignedUrl(result.data.pdf_storage_path, 60, { download: `proforma-${documentId}.pdf` });
  if (signed.error || !signed.data?.signedUrl) throw mapFailure(signed.error, "signed_url_failed");
  return signed.data.signedUrl;
}

export async function voidEconomicDocumentOnServer(userId: string, documentId: string, reason: string) {
  const service = supabaseServiceClient();
  const result = await service.rpc("void_economic_document", { p_user_id: userId, p_document_id: documentId, p_reason: reason });
  return economicDocumentFromRow(rpcData<IssuanceDocumentRow>(result, "economic_document_void_failed") as Parameters<typeof economicDocumentFromRow>[0]);
}
