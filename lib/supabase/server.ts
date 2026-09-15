import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = () => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL non configurata");
  return value;
};

export async function authenticatedUserId() {
  if (process.env.NEXT_PUBLIC_DATA_MODE === "local") return "local";
  const cookieStore = await cookies();
  const client = createServerClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values:{name:string;value:string;options:CookieOptions}[]) => {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot always write refreshed cookies. */ }
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sessione Supabase non valida");
  return data.user.id;
}

export function supabaseServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY non configurata");
  return createClient(url(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
