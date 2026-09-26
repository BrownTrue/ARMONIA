import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";
import { THERAPY_MATERIALS_BUCKET } from "@/lib/therapeutic-library/server";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  try {
    const userId = await authenticatedUserId();
    const { id } = await context.params;
    const service = supabaseServiceClient();
    const { data: material, error } = await service.from("materials").select("id,storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!material) return NextResponse.json({ deleted: true, alreadyDeleted: true });
    if (material.storage_path) {
      const prefix = `${userId}/`;
      if (!material.storage_path.startsWith(prefix)) return NextResponse.json({ error: "invalid_storage_path" }, { status: 409 });
      const removal = await service.storage.from(THERAPY_MATERIALS_BUCKET).remove([material.storage_path]);
      if (removal.error) throw removal.error;
    }
    const deletion = await service.rpc("delete_therapeutic_material_record", { p_user_id: userId, p_material_id: id });
    if (deletion.error) throw deletion.error;
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "material_delete_failed" }, { status: 500 });
  }
}
