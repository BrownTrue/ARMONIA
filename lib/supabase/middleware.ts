import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { ServerAuthState } from "@/lib/auth/routing";

const hasSupabaseAuthCookie = (request: NextRequest) => request.cookies.getAll().some(
  ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
);

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const hadAuthCookie = hasSupabaseAuthCookie(request);
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values: { name: string; value: string; options: CookieOptions }[]) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data, error } = await client.auth.getUser();
  const authState: ServerAuthState = data.user
    ? "authenticated"
    : error && hadAuthCookie
      ? "error"
      : "unauthenticated";
  return { response, authState };
}

export function responseWithRefreshedCookies(source: NextResponse, destination: URL) {
  const response = NextResponse.redirect(destination);
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
