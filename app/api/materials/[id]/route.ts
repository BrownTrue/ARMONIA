import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { THERAPY_MATERIALS_BUCKET } from "@/lib/therapeutic-library/server";
import { deleteTherapeuticMaterialRecord } from "@/lib/therapeutic-library/delete";
import { logServerDiagnostic } from "@/lib/privacy/server-diagnostics";

type DeleteStage = "authenticated" | "material_lookup" | "path_validation" | "storage_delete" | "rpc_delete";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  let userId: string;
  try {
    userId = await authenticatedUserId();
  } catch {
    return NextResponse.json({ error: "material_auth_required" }, { status: 401 });
  }
  let failureStage: DeleteStage = "material_lookup";
  try {
    const { id } = await context.params;
    const service = supabaseServiceClient();
    const { data: material, error } = await service.from("materials").select("id,storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    failureStage = "path_validation";
    const result = await deleteTherapeuticMaterialRecord({
      userId,
      material: material ? { id: material.id, storagePath: material.storage_path } : null,
      removeStorageObject: async path => {
        failureStage = "storage_delete";
        const removal = await service.storage.from(THERAPY_MATERIALS_BUCKET).remove([path]);
        return { error: removal.error };
      },
      deleteRecord: async materialId => {
        failureStage = "rpc_delete";
        const deletion = await service.rpc("delete_therapeutic_material_record", { p_user_id: userId, p_material_id: materialId });
        if (deletion.error) throw deletion.error;
      },
    });
    return NextResponse.json({ deleted: true, ...result });
  } catch (cause) {
    logServerDiagnostic("therapeutic_material", { stage: failureStage, cause, retryable: false });
    if (cause instanceof Error && cause.message === "invalid_storage_path") {
      return NextResponse.json({ error: "invalid_storage_path" }, { status: 409 });
    }
    return NextResponse.json({ error: "material_delete_failed" }, { status: 500 });
  }
}
