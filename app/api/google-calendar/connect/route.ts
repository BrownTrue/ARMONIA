import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_CALENDAR_SCOPE, googleCalendarConfigured, googleOAuthConfig } from "@/lib/google-calendar/config";
import {authenticatedUserId} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!googleCalendarConfigured()) {
    return NextResponse.redirect(new URL("/impostazioni?google=not-configured", request.url));
  }
  try { await authenticatedUserId(); } catch { return NextResponse.redirect(new URL("/login",request.url)); }
  const config = googleOAuthConfig();
  const state = randomBytes(24).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("armonia_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return response;
}
