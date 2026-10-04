import { NextRequest, NextResponse } from "next/server";
import { authRoutingDecision, type ServerAuthState } from "@/lib/auth/routing";
import { refreshSupabaseSession, responseWithRefreshedCookies } from "@/lib/supabase/middleware";
import { isLocalDataMode } from "@/lib/data-mode";
import { RECOVERY_COOKIE } from "@/lib/auth/password";

export async function middleware(request: NextRequest) {
  const localMode = isLocalDataMode();
  let response = NextResponse.next({ request });
  let authState: ServerAuthState = localMode ? "authenticated" : "error";

  if (!localMode) {
    const refreshed = await refreshSupabaseSession(request);
    response = refreshed.response;
    authState = refreshed.authState;
  }

  const pathname = request.nextUrl.pathname;
  if (!localMode && pathname === "/reset-password" && !request.cookies.get(RECOVERY_COOKIE)) {
    return responseWithRefreshedCookies(response, new URL("/forgot-password?reason=invalid", request.url));
  }
  const destination = `${pathname}${request.nextUrl.search}`;
  const decision = authRoutingDecision({
    pathname,
    destination,
    localMode,
    authState,
    requestedNext: request.nextUrl.searchParams.get("next"),
  });
  if (decision.type === "pass") return response;
  return responseWithRefreshedCookies(response, new URL(decision.destination, request.url));
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|calendar(?:/|$)|_next/static|_next/image|favicon.ico|manifest.webmanifest|branding(?:/|$)|resources(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|zip|docx|mp3|m4a|wav)$).*)",
  ],
};
