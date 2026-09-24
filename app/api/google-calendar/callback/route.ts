import { NextRequest, NextResponse } from "next/server";
import { ensureArmoniaCalendar } from "@/lib/google-calendar/google-api";
import { googleOAuthConfig } from "@/lib/google-calendar/config";
import {authenticatedUserId} from "@/lib/supabase/server";
import {googleOAuthResponseError} from "@/lib/google-calendar/oauth-error";

const settingsUrl = (request: NextRequest, value: string) =>
  new URL(`/impostazioni?google=${value}`, request.url);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("armonia_google_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(settingsUrl(request, "invalid-state"));
  }
  let userId:string;
  try { userId=await authenticatedUserId(); } catch { return NextResponse.redirect(settingsUrl(request,"unauthorized")); }
  try {
    const config = googleOAuthConfig();
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!response.ok) throw await googleOAuthResponseError(response,"Scambio OAuth non riuscito");
    const value = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!value.refresh_token) throw new Error("Google non ha restituito un refresh token");
    const record = {
      accessToken: value.access_token,
      refreshToken: value.refresh_token,
      expiresAt: Date.now() + value.expires_in * 1000,
      nameFormat: "first_initial" as const,
      reminderMinutes: 30,
      syncEnabled: true,
    };
    await ensureArmoniaCalendar(userId,record);
    const redirect = NextResponse.redirect(settingsUrl(request, "connected"));
    redirect.cookies.delete("armonia_google_oauth_state");
    return redirect;
  } catch (error) {
    console.error("Google Calendar OAuth:", error);
    return NextResponse.redirect(settingsUrl(request, "error"));
  }
}
