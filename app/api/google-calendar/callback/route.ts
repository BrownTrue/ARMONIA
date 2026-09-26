import { NextRequest, NextResponse } from "next/server";
import { ensureArmoniaCalendar,verifyArmoniaCalendarAccess } from "@/lib/google-calendar/google-api";
import { googleOAuthConfig } from "@/lib/google-calendar/config";
import {authenticatedUserId} from "@/lib/supabase/server";
import {googleOAuthResponseError} from "@/lib/google-calendar/oauth-error";
import {googleTokenStore} from "@/lib/google-calendar/token-store";
import {GoogleReconnectError,reconnectGoogleConnection} from "@/lib/google-calendar/reconnect";
import {logServerDiagnostic} from "@/lib/privacy/server-diagnostics";

const settingsUrl = (request: NextRequest, value: string) =>
  new URL(`/impostazioni?google=${value}`, request.url);
const oauthRedirect=(request:NextRequest,value:string)=>{const response=NextResponse.redirect(settingsUrl(request,value));response.cookies.delete("armonia_google_oauth_state");response.cookies.delete("armonia_google_oauth_mode");return response};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("armonia_google_oauth_state")?.value;
  const mode=request.cookies.get("armonia_google_oauth_mode")?.value==="reconnect"?"reconnect":"connect";
  if (!code || !state || !expected || state !== expected) {
    return oauthRedirect(request,"invalid-state");
  }
  let userId:string;
  try { userId=await authenticatedUserId(); } catch { return oauthRedirect(request,"unauthorized"); }
  try {
    const existing=mode==="reconnect"?await googleTokenStore.load(userId):null;
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
    if (!value.refresh_token) throw new GoogleReconnectError("missing_refresh_token","Google non ha restituito un nuovo refresh token");
    if(mode==="reconnect"){
      await reconnectGoogleConnection(existing,{accessToken:value.access_token,refreshToken:value.refresh_token,expiresAt:Date.now()+value.expires_in*1000},{verifyCalendarAccess:verifyArmoniaCalendarAccess,save:record=>googleTokenStore.save(userId,record)});
      return oauthRedirect(request,"reconnected");
    }
    const record = {
      accessToken: value.access_token,
      refreshToken: value.refresh_token,
      expiresAt: Date.now() + value.expires_in * 1000,
      nameFormat: "first_initial" as const,
      reminderMinutes: 30,
      syncEnabled: true,
    };
    await ensureArmoniaCalendar(userId,record);
    return oauthRedirect(request,"connected");
  } catch (error) {
    logServerDiagnostic("google_calendar", {stage:mode==="reconnect"?"reconnect_callback":"connect_callback",cause:error,retryable:false});
    if(mode==="reconnect"&&error instanceof GoogleReconnectError)return oauthRedirect(request,`reconnect-${error.code.replaceAll("_","-")}`);
    return oauthRedirect(request,mode==="reconnect"?"reconnect-error":"error");
  }
}
