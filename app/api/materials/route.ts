import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  try {
    const userId = await authenticatedUserId();
    const body = await request.json() as Record<string, unknown>;
    const requestedId = typeof body.id === "string" ? body.id : "";
    const service = supabaseServiceClient();
    const { data: existing, error: existingError } = requestedId
      ? await service.from("materials").select("id,storage_path,external_url").eq("id", requestedId).eq("user_id", userId).maybeSingle()
      : { data: null, error: null };
    if (existingError) throw existingError;

    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "material_title_required" }, { status: 400 });
    const patientIds = Array.isArray(body.patientIds) ? [...new Set(body.patientIds.filter(id => typeof id === "string"))] as string[] : [];
    if (patientIds.length) {
      const { count, error } = await service.from("patients").select("id", { count: "exact", head: true }).eq("user_id", userId).in("id", patientIds);
      if (error) throw error;
      if (count !== patientIds.length) return NextResponse.json({ error: "invalid_patient_association" }, { status: 400 });
    }

    const safeMetadata = {
      title,
      description: String(body.description || "").trim() || null,
      category: String(body.category || "altro"),
      tags: Array.isArray(body.tags) ? body.tags.filter(tag => typeof tag === "string").map(tag => tag.trim()).filter(Boolean).slice(0, 30) : [],
      is_favorite: Boolean(body.favorite),
      updated_at: new Date().toISOString(),
    };
    let materialId = existing?.id as string | undefined;
    if (existing) {
      const { error } = await service.from("materials").update(safeMetadata).eq("id", existing.id).eq("user_id", userId);
      if (error) throw error;
    } else {
      const rawUrl = String(body.externalUrl || "");
      let externalUrl: URL;
      try { externalUrl = new URL(rawUrl); } catch { return NextResponse.json({ error: "invalid_external_url" }, { status: 400 }); }
      if (!['http:', 'https:'].includes(externalUrl.protocol)) return NextResponse.json({ error: "invalid_external_url" }, { status: 400 });
      materialId = randomUUID();
      const { error } = await service.from("materials").insert({
        id: materialId, user_id: userId, ...safeMetadata,
        file_name: null, storage_path: null, mime_type: null, file_size: 0,
        external_url: externalUrl.toString(),
      });
      if (error) throw error;
    }

    const { error: deleteLinksError } = await service.from("patient_materials").delete().eq("material_id", materialId!);
    if (deleteLinksError) throw deleteLinksError;
    if (patientIds.length) {
      const { error } = await service.from("patient_materials").insert(patientIds.map(patientId => ({ patient_id: patientId, material_id: materialId })));
      if (error) throw error;
    }
    return NextResponse.json({ materialId });
  } catch {
    return NextResponse.json({ error: "material_save_failed" }, { status: 500 });
  }
}
