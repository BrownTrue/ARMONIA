import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { THERAPY_MATERIALS_BUCKET } from "@/lib/therapeutic-library/server";
import { deleteTherapeuticMaterialRecord } from "@/lib/therapeutic-library/delete";

type DeleteStage = "authenticated" | "material_lookup" | "path_validation" | "storage_delete" | "rpc_delete";

const logDeleteStage = (stage: DeleteStage, details: Record<string, boolean> = {}) => {
  console.info("therapeutic_material_delete", { stage, ...details });
};

const sanitizedDeleteFailure = (stage: DeleteStage, cause: unknown) => {
  const record = cause && typeof cause === "object" ? cause as Record<string, unknown> : null;
  const code = typeof record?.code === "string" ? record.code.slice(0, 80) : "unknown_error";
  const rawMessage = cause instanceof Error ? cause.message : typeof record?.message === "string" ? record.message : "Unknown error";
  const message = rawMessage
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "[uuid]")
    .replace(/\b(?:eyJ|sb_(?:secret|publishable)_)[A-Za-z0-9._-]+\b/g, "[token]")
    .replace(/(['"])[^'"]{1,200}\1/g, "$1[redacted]$1")
    .slice(0, 200);
  console.error("therapeutic_material_delete_failed", { stage, code, message });
};

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  let userId: string;
  try {
    userId = await authenticatedUserId();
    logDeleteStage("authenticated");
  } catch {
    return NextResponse.json({ error: "material_auth_required" }, { status: 401 });
  }
  let failureStage: DeleteStage = "material_lookup";
  try {
    const { id } = await context.params;
    const service = supabaseServiceClient();
    const { data: material, error } = await service.from("materials").select("id,storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    logDeleteStage("material_lookup", { materialFound: Boolean(material), hasStoragePath: Boolean(material?.storage_path) });
    failureStage = "path_validation";
    const result = await deleteTherapeuticMaterialRecord({
      userId,
      material: material ? { id: material.id, storagePath: material.storage_path } : null,
      removeStorageObject: async path => {
        failureStage = "storage_delete";
        logDeleteStage("storage_delete", { started: true });
        const removal = await service.storage.from(THERAPY_MATERIALS_BUCKET).remove([path]);
        if (!removal.error) logDeleteStage("storage_delete", { succeeded: true });
        return { error: removal.error };
      },
      deleteRecord: async materialId => {
        failureStage = "rpc_delete";
        logDeleteStage("rpc_delete", { started: true });
        const deletion = await service.rpc("delete_therapeutic_material_record", { p_user_id: userId, p_material_id: materialId });
        if (deletion.error) throw deletion.error;
        logDeleteStage("rpc_delete", { succeeded: true });
      },
    });
    return NextResponse.json({ deleted: true, ...result });
  } catch (cause) {
    sanitizedDeleteFailure(failureStage, cause);
    if (cause instanceof Error && cause.message === "invalid_storage_path") {
      return NextResponse.json({ error: "invalid_storage_path" }, { status: 409 });
    }
    return NextResponse.json({ error: "material_delete_failed" }, { status: 500 });
  }
}
