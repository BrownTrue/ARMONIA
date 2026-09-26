import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { MAX_MATERIAL_FILE_BYTES, validateMaterialFileContent } from "@/lib/therapeutic-library/files";
import { resolveAmbiguousCommit } from "@/lib/therapeutic-library/finalize";
import { releaseStorageReservation, requireStorageReservationCleanup, THERAPY_MATERIALS_BUCKET } from "@/lib/therapeutic-library/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  const userId = await authenticatedUserId();
  const body = await request.json() as { reservationId?: unknown; title?: unknown; description?: unknown; category?: unknown; tags?: unknown; fileName?: unknown; patientIds?: unknown; favorite?: unknown };
  const reservationId = String(body.reservationId || "");
  const service = supabaseServiceClient();
  const readReservation = async () => {
    const result = await service.from("storage_upload_reservations")
      .select("id,user_id,material_id,expected_bytes,object_path,extension,status,expires_at")
      .eq("id", reservationId).eq("user_id", userId).maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  };
  const materialExists = async (materialId: string) => {
    const result = await service.from("materials").select("id").eq("id", materialId).eq("user_id", userId).maybeSingle();
    if (result.error) throw result.error;
    return Boolean(result.data);
  };
  let reservation;
  try { reservation = await readReservation(); } catch { return NextResponse.json({ error: "upload_finalize_retry" }, { status: 503 }); }
  if (!reservation) return NextResponse.json({ error: "reservation_not_available" }, { status: 404 });
  if (reservation.status === "committed") {
    if (await materialExists(reservation.material_id).catch(() => false)) return NextResponse.json({ materialId: reservation.material_id, alreadyCommitted: true });
    return NextResponse.json({ error: "upload_finalize_retry" }, { status: 503 });
  }
  if (reservation.status !== "pending") return NextResponse.json({ error: "reservation_not_available" }, { status: 409 });

  const path = reservation.object_path;
  let verifiedBytes = 0;
  let tags: string[] = [];
  let patientIds: string[] = [];
  try {
    if (new Date(reservation.expires_at).getTime() <= Date.now()) throw new Error("reservation_expired");
    const blobResult = await service.storage.from(THERAPY_MATERIALS_BUCKET).download(path);
    if (blobResult.error || !blobResult.data) throw blobResult.error || new Error("uploaded_object_missing");
    const blob = blobResult.data;
    if (blob.size !== Number(reservation.expected_bytes) || blob.size > MAX_MATERIAL_FILE_BYTES) throw new Error("verified_size_mismatch");
    validateMaterialFileContent(reservation.extension, new Uint8Array(await blob.arrayBuffer()));
    verifiedBytes = blob.size;
    tags = Array.isArray(body.tags) ? body.tags.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean).slice(0, 30) : [];
    patientIds = Array.isArray(body.patientIds) ? body.patientIds.filter((item): item is string => typeof item === "string") : [];
  } catch {
    let cleanupFailed = false;
    try {
      const cleanup = await service.storage.from(THERAPY_MATERIALS_BUCKET).remove([path]);
      cleanupFailed = Boolean(cleanup.error);
    } catch { cleanupFailed = true; }
    try {
      if (cleanupFailed) await requireStorageReservationCleanup(userId, reservationId, "validation_failed_cleanup_failed");
      else await releaseStorageReservation(userId, reservationId, "validation_failed");
    } catch {}
    return NextResponse.json({ error: "upload_finalize_failed" }, { status: 400 });
  }

  let commitResult;
  try {
    commitResult = await service.rpc("commit_therapeutic_storage_upload", {
      p_user_id: userId, p_reservation_id: reservationId, p_verified_bytes: verifiedBytes,
      p_title: String(body.title || ""), p_description: String(body.description || ""),
      p_category: String(body.category || "altro"), p_tags: tags, p_file_name: String(body.fileName || ""),
      p_patient_ids: patientIds, p_is_favorite: Boolean(body.favorite),
    });
  } catch { commitResult = { data: null, error: new Error("ambiguous_commit") }; }
  if (!commitResult.error && commitResult.data) return NextResponse.json({ materialId: commitResult.data });

  const resolution = await resolveAmbiguousCommit(
    async () => {
      const current = await readReservation();
      return current ? { status: current.status, materialId: current.material_id } : null;
    },
    materialExists,
  );
  if (resolution.kind === "committed") return NextResponse.json({ materialId: resolution.materialId, alreadyCommitted: true });
  // Never delete after the commit RPC has been invoked: pending or unknown
  // state is retained for safe retry/reconciliation.
  return NextResponse.json({ error: "upload_finalize_retry" }, { status: 503 });
}
