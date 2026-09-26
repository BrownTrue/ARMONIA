import "server-only";
import { supabaseServiceClient } from "@/lib/supabase/server";
import { buildStorageReconciliationReport, collectAllPages, walkStorageNamespace } from "./reconciliation";

export const THERAPY_MATERIALS_BUCKET = "therapy-materials";

export async function releaseStorageReservation(userId: string, reservationId: string, failureCode?: string) {
  const { error } = await supabaseServiceClient().rpc("release_therapeutic_storage_reservation", {
    p_user_id: userId, p_reservation_id: reservationId, p_failure_code: failureCode || null,
  });
  if (error) throw error;
}

export async function requireStorageReservationCleanup(userId: string, reservationId: string, failureCode: string) {
  const { error } = await supabaseServiceClient().rpc("require_therapeutic_storage_cleanup", {
    p_user_id: userId, p_reservation_id: reservationId, p_failure_code: failureCode,
  });
  if (error) throw error;
}

export async function cleanupExpiredStorageReservations(userId: string) {
  const service = supabaseServiceClient();
  const { data, error } = await service.rpc("claim_expired_therapeutic_storage_cleanup", { p_user_id: userId });
  if (error) throw error;
  for (const reservation of data || []) {
    const objectPath = String(reservation.object_path || "");
    const slash = objectPath.lastIndexOf("/");
    if (slash <= 0) continue;
    const folder = objectPath.slice(0, slash), name = objectPath.slice(slash + 1);
    const listed = await service.storage.from(THERAPY_MATERIALS_BUCKET).list(folder, { limit: 2, search: name });
    if (listed.error) continue;
    const exists = (listed.data || []).some(object => object.name === name);
    if (exists) {
      const removal = await service.storage.from(THERAPY_MATERIALS_BUCKET).remove([objectPath]);
      if (removal.error) continue;
    }
    // Bytes are released only after confirmed absence or successful removal.
    try { await releaseStorageReservation(userId, String(reservation.id), "expired_cleaned"); } catch {}
  }
}

export async function auditUserStorage(userId: string) {
  const service = supabaseServiceClient();
  const materials = await collectAllPages(500, async (from, to) => {
    const { data, error } = await service.from("materials").select("id,storage_path,file_size")
      .eq("user_id", userId).not("storage_path", "is", null).order("id", { ascending: true }).range(from, to);
    if (error) throw error;
    return data || [];
  });
  const database = materials.map(item => ({ materialId: item.id as string, path: item.storage_path as string, size: Number(item.file_size || 0) }));
  const storage = await walkStorageNamespace(userId, async (prefix, offset, limit) => {
    const { data, error } = await service.storage.from(THERAPY_MATERIALS_BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    return data || [];
  });
  return buildStorageReconciliationReport(database, storage);
}
