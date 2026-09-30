export const AUTH_DIAGNOSTICS_KEY = "armonia-auth-diagnostics-v1";
export const AUTH_DIAGNOSTICS_LIMIT = 40;

export type AuthDiagnostic = {
  timestamp: string;
  event: string;
  route: string;
  sessionPresent: boolean;
  bootstrapResult?: "session" | "no_session" | "error";
  expiresAt?: number;
  online: boolean;
  visibility: "visible" | "hidden" | "prerender" | "unloaded" | "unknown";
  errorCode?: string;
};

type DiagnosticStorage = Pick<Storage, "getItem" | "setItem">;

const safeCode = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, 64);
  return /^[a-zA-Z0-9_.-]+$/.test(normalized) ? normalized : undefined;
};

const safeRoute = (pathname: string) => pathname
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "[id]")
  .slice(0, 160);

export function sanitizedAuthErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "auth_error";
  const record = error as Record<string, unknown>;
  return safeCode(record.code) || safeCode(record.name) || "auth_error";
}

export function appendAuthDiagnostic(
  storage: DiagnosticStorage,
  entry: AuthDiagnostic,
  limit = AUTH_DIAGNOSTICS_LIMIT,
) {
  let current: AuthDiagnostic[] = [];
  try {
    const parsed = JSON.parse(storage.getItem(AUTH_DIAGNOSTICS_KEY) || "[]");
    if (Array.isArray(parsed)) current = parsed;
  } catch {
    current = [];
  }
  const next = [...current, entry].slice(-Math.max(1, limit));
  storage.setItem(AUTH_DIAGNOSTICS_KEY, JSON.stringify(next));
  return next;
}

export function logAuthDiagnostic(input: {
  event: string;
  sessionPresent: boolean;
  bootstrapResult?: AuthDiagnostic["bootstrapResult"];
  expiresAt?: number | null;
  error?: unknown;
}) {
  if (typeof window === "undefined") return;
  const visibility = document.visibilityState;
  appendAuthDiagnostic(window.sessionStorage, {
    timestamp: new Date().toISOString(),
    event: safeCode(input.event) || "UNKNOWN",
    route: safeRoute(window.location.pathname),
    sessionPresent: input.sessionPresent,
    bootstrapResult: input.bootstrapResult,
    expiresAt: input.expiresAt || undefined,
    online: navigator.onLine,
    visibility: visibility === "visible" || visibility === "hidden" || visibility === "prerender" || visibility === "unloaded" ? visibility : "unknown",
    errorCode: input.error ? sanitizedAuthErrorCode(input.error) : undefined,
  });
}
