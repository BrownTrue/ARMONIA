import { NextRequest, NextResponse } from "next/server";
import { authenticatedUserId } from "@/lib/supabase/server";
import { googleServerSyncConfiguration } from "@/lib/google-calendar/server-sync-policy";
import { processGoogleCalendarServerOutbox } from "@/lib/google-calendar/server-sync";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configuration = googleServerSyncConfiguration();
  if (!configuration.enabled || !configuration.testUserId) {
    return NextResponse.json({ enabled: false, processed: 0 });
  }

  const configuredSecret = process.env.GOOGLE_CALENDAR_SERVER_SYNC_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const authorizedCron = Boolean(configuredSecret && suppliedSecret === configuredSecret);
  if (!authorizedCron) {
    try {
      const userId = await authenticatedUserId();
      if (userId !== configuration.testUserId) {
        return NextResponse.json({ error: "Sincronizzazione server non abilitata per questo account" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
  }

  try {
    return NextResponse.json(await processGoogleCalendarServerOutbox());
  } catch (cause) {
    console.error("Processore Google Calendar server-side:", cause);
    return NextResponse.json({ error: "Processore Google Calendar non disponibile" }, { status: 500 });
  }
}

