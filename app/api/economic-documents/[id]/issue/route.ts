import { NextResponse } from "next/server";
import { logServerDiagnostic } from "@/lib/privacy/server-diagnostics";
import { authenticatedUserId } from "@/lib/supabase/server";
import { EconomicDocumentServerError } from "@/lib/economic-documents/issuance";
import { issueEconomicDocumentOnServer } from "@/lib/economic-documents/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const romeDate = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const stageFor = (code: string) => code === "reserve_failed" ? "reserve"
  : code === "pdf_generation_failed" ? "pdf_generation"
    : code === "logo_processing_failed" || code === "logo_missing" ? "logo_processing"
      : code === "upload_failed" ? "upload"
        : code === "upload_verification_failed" ? "upload_verification"
          : code === "mark_uploaded_failed" ? "mark_uploaded"
            : code === "finalize_failed" ? "finalize"
              : code === "server_configuration_error" ? "server_configuration" : "issue";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return NextResponse.json({ error: "cloud_only" }, { status: 409, headers });
  let userId: string;
  try { userId = await authenticatedUserId(); } catch { return NextResponse.json({ error: "authentication_required" }, { status: 401, headers }); }
  try {
    const { id } = await context.params;
    const document = await issueEconomicDocumentOnServer(userId, id, romeDate());
    return NextResponse.json({ document }, { headers });
  } catch (cause) {
    const error = cause instanceof EconomicDocumentServerError ? cause : new EconomicDocumentServerError("issuance_failed", 500, true);
    logServerDiagnostic("economic_document_issuance", { stage: stageFor(error.code), code: error.code, retryable: error.retryable });
    return NextResponse.json({ error: error.code, retryable: error.retryable }, { status: error.status, headers });
  }
}
