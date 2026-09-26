import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { MaterialFileValidationError, UPLOAD_RESERVATION_TTL_SECONDS, validateMaterialFileDeclaration } from "@/lib/therapeutic-library/files";
import { cleanupExpiredStorageReservations, releaseStorageReservation, THERAPY_MATERIALS_BUCKET } from "@/lib/therapeutic-library/server";

export const dynamic = "force-dynamic";

const responseError = (code: string, status: number) => NextResponse.json({ error: code }, { status });

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return responseError("cloud_only", 409);
  let userId = "", reservationId = "";
  try {
    userId = await authenticatedUserId();
    await cleanupExpiredStorageReservations(userId);
    const body = await request.json() as { fileName?: unknown; size?: unknown; mimeType?: unknown };
    const declaration = validateMaterialFileDeclaration({ fileName: String(body.fileName || ""), size: Number(body.size), mimeType: String(body.mimeType || "") });
    const materialId = randomUUID(), objectId = randomUUID(), extension = declaration.extension;
    reservationId = randomUUID();
    const path = `${userId}/${materialId}/${objectId}.${extension === "jpeg" ? "jpg" : extension}`;
    const service = supabaseServiceClient();
    const { error: reserveError } = await service.rpc("reserve_therapeutic_storage_upload", {
      p_user_id: userId, p_reservation_id: reservationId, p_material_id: materialId,
      p_expected_bytes: declaration.size, p_object_path: path, p_extension: extension,
      p_mime_type: declaration.mimeType, p_ttl_seconds: UPLOAD_RESERVATION_TTL_SECONDS,
    });
    if (reserveError) throw reserveError;
    const { data, error } = await service.storage.from(THERAPY_MATERIALS_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error || new Error("signed_upload_failed");
    return NextResponse.json({ reservationId, materialId, path, token: data.token, expiresInSeconds: UPLOAD_RESERVATION_TTL_SECONDS });
  } catch (cause) {
    if (userId && reservationId) try { await releaseStorageReservation(userId, reservationId, "prepare_failed"); } catch {}
    if (cause instanceof MaterialFileValidationError) return responseError(cause.code, 400);
    const message = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "";
    if (message.includes("storage_quota_exceeded")) return responseError("storage_quota_exceeded", 409);
    if (message.includes("storage_account_requires_reconciliation")) return responseError("storage_requires_reconciliation", 409);
    return responseError("upload_prepare_failed", 500);
  }
}
