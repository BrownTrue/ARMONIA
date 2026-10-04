import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { callbackExchangeFailureReason, callbackFailureReason } from "@/lib/auth/signup";
import { RECOVERY_COOKIE } from "@/lib/auth/password";

const failure = (request: NextRequest, reason: string) => NextResponse.redirect(new URL(`/auth/error?reason=recovery-${reason}`, request.url));

export async function GET(request: NextRequest) {
  const providerCode = request.nextUrl.searchParams.get("error_code") || request.nextUrl.searchParams.get("error");
  const providerDescription = request.nextUrl.searchParams.get("error_description");
  if (providerCode || providerDescription) return failure(request, callbackFailureReason({ code: providerCode, description: providerDescription }));
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return failure(request, "incomplete");

  const response = NextResponse.redirect(new URL("/reset-password", request.url));
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    const reason = callbackExchangeFailureReason({ code: error.code, description: error.message });
    return failure(request, reason === "cross-device" ? "device" : reason);
  }
  response.cookies.set(RECOVERY_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 10 * 60 });
  return response;
}
