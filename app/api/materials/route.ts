import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId, supabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409 });
  let userId: string;
  try {
    userId = await authenticatedUserId();
  } catch {
    return NextResponse.json({ error: "material_auth_required" }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const requestedId = typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id) ? body.id : randomUUID();
    const service = supabaseServiceClient();
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "material_title_required" }, { status: 400 });
    const patientIds = Array.isArray(body.patientIds) ? [...new Set(body.patientIds.filter(id => typeof id === "string"))] as string[] : [];
    const externalUrl = typeof body.externalUrl === "string" ? body.externalUrl.trim() : null;
    if (externalUrl) {
      try {
        const parsed = new URL(externalUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("invalid protocol");
      } catch { return NextResponse.json({ error: "invalid_external_url" }, { status: 400 }); }
    }
    const { data: materialId, error } = await service.rpc("save_therapeutic_material_metadata", {
      p_user_id: userId,
      p_material_id: requestedId,
      p_title: title,
      p_description: String(body.description || "").trim() || null,
      p_category: String(body.category || "altro"),
      p_tags: Array.isArray(body.tags) ? body.tags.filter(tag => typeof tag === "string").map(tag => tag.trim()).filter(Boolean).slice(0, 30) : [],
      p_external_url: externalUrl,
      p_patient_ids: patientIds,
      p_is_favorite: Boolean(body.favorite),
    });
    if (error) {
      const known = ["invalid_external_url", "invalid_patient_association", "material_title_required"]
        .find(code => error.message.includes(code));
      if (known) return NextResponse.json({ error: known }, { status: 400 });
      throw error;
    }
    return NextResponse.json({ materialId });
  } catch {
    return NextResponse.json({ error: "material_save_failed" }, { status: 500 });
  }
}
