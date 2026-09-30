export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export function authStatusFromBootstrap(input: { error: unknown; sessionPresent: boolean }): AuthStatus {
  if (input.error) return "error";
  return input.sessionPresent ? "authenticated" : "unauthenticated";
}

export async function runAuthBootstrap<T>(
  getSession: () => Promise<{ data: { session: T | null }; error: unknown }>,
) {
  const result = await getSession();
  return {
    session: result.data.session,
    error: result.error,
    status: authStatusFromBootstrap({ error: result.error, sessionPresent: Boolean(result.data.session) }),
  };
}

export function authStatusFromEvent(
  current: AuthStatus,
  event: string,
  sessionPresent: boolean,
): AuthStatus {
  if (sessionPresent) return "authenticated";
  if (event === "SIGNED_OUT") return "unauthenticated";
  return current;
}
