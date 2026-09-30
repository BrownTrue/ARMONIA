import { NextResponse } from "next/server";
import { EconomicDocumentServerError } from "@/lib/economic-documents/issuance";
import { voidEconomicDocumentOnServer } from "@/lib/economic-documents/server";
import { authenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409, headers });
  let userId: string;
  try { userId = await authenticatedUserId(); } catch { return NextResponse.json({ error: "authentication_required" }, { status: 401, headers }); }
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as { reason?: unknown };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) return NextResponse.json({ error: "void_reason_required" }, { status: 422, headers });
    return NextResponse.json({ document: await voidEconomicDocumentOnServer(userId, id, reason) }, { headers });
  } catch (cause) {
    const error = cause instanceof EconomicDocumentServerError ? cause : new EconomicDocumentServerError("void_failed", 500, true);
    return NextResponse.json({ error: error.code }, { status: error.status, headers });
  }
}

