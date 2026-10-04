import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { callbackExchangeFailureReason, callbackFailureReason, callbackSuccessPath } from "@/lib/auth/signup";

const errorRedirect = (request: NextRequest, reason: string) => NextResponse.redirect(new URL(`/auth/error?reason=${reason}`, request.url));

export async function GET(request: NextRequest) {
  const errorCode = request.nextUrl.searchParams.get("error_code") || request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  if (errorCode || errorDescription) return errorRedirect(request, callbackFailureReason({ code: errorCode, description: errorDescription }));

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return errorRedirect(request, "incomplete");

  const next = callbackSuccessPath(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.url));
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return errorRedirect(request, callbackExchangeFailureReason({ code: error.code, description: error.message }));
  return response;
}
