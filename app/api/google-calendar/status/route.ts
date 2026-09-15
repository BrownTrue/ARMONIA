import { NextResponse } from "next/server";
import { googleCalendarConfigured } from "@/lib/google-calendar/config";
import { googleTokenStore } from "@/lib/google-calendar/token-store";
import {authenticatedUserId} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!googleCalendarConfigured()) {
    return NextResponse.json({ configured: false, connected: false });
  }
  try {
    const userId=await authenticatedUserId();
    const record = await googleTokenStore.load(userId);
    return NextResponse.json({
      configured: true,
      connected: Boolean(record?.refreshToken && record.calendarId),
      calendarName: record?.calendarId ? "Armonia" : undefined,
      nameFormat:record?.nameFormat,
      reminderMinutes:record?.reminderMinutes,
      syncEnabled:record?.syncEnabled,
    });
  } catch (error) {
    return NextResponse.json({ configured: true, connected: false, error: error instanceof Error ? error.message : "Errore di connessione" },{status:401});
  }
}
