import { NextResponse } from "next/server";
import { EconomicDocumentServerError } from "@/lib/economic-documents/issuance";
import { signedEconomicDocumentUrl } from "@/lib/economic-documents/server";
import { authenticatedUserId } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409, headers });
  let userId: string;
  try { userId = await authenticatedUserId(); } catch { return NextResponse.json({ error: "authentication_required" }, { status: 401, headers }); }
  try {
    const { id } = await context.params;
    return NextResponse.json({ url: await signedEconomicDocumentUrl(userId, id), expiresIn: 60 }, { headers });
  } catch (cause) {
    const error = cause instanceof EconomicDocumentServerError ? cause : new EconomicDocumentServerError("download_failed", 500, true);
    return NextResponse.json({ error: error.code }, { status: error.status, headers });
  }
}

