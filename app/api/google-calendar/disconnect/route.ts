import { NextResponse } from "next/server";
import { googleTokenStore } from "@/lib/google-calendar/token-store";
import {authenticatedUserId} from "@/lib/supabase/server";
import {logServerDiagnostic} from "@/lib/privacy/server-diagnostics";

export async function POST() {
  let userId:string;try{userId=await authenticatedUserId()}catch{return NextResponse.json({error:"Non autorizzato"},{status:401})}
  let record = null;
  try { record = await googleTokenStore.load(userId); } catch (error) { logServerDiagnostic("google_calendar", {stage:"load_connection",cause:error,retryable:true}); }
  if (record?.refreshToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(record.refreshToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch (error) {
      logServerDiagnostic("google_calendar", {stage:"revoke_token",cause:error,retryable:true});
    }
  }
  await googleTokenStore.clear(userId);
  return NextResponse.json({ ok: true });
}
