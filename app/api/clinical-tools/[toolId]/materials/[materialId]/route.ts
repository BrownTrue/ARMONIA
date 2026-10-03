import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { resolveOriginalClinicalToolMaterial } from "@/lib/clinical-tools/original-materials";
import { authenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ toolId: string; materialId: string }> }) {
  try {
    await authenticatedUserId();
  } catch {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }

  const { toolId, materialId } = await context.params;
  const resolved = resolveOriginalClinicalToolMaterial(toolId, materialId);
  if (!resolved) return NextResponse.json({ error: "clinical_tool_material_not_found" }, { status: 404 });

  try {
    const body = await readFile(resolved.filePath);
    const shouldDownload = request.nextUrl.searchParams.get("download") === "1" || resolved.material.kind !== "pdf";
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${resolved.material.fileName}"`,
        "Content-Length": String(body.byteLength),
        "Content-Type": resolved.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "clinical_tool_material_unavailable" }, { status: 500 });
  }
}
