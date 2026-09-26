import "server-only";

type DiagnosticLevel = "error" | "warn";

type ServerDiagnostic = {
  stage: string;
  cause?: unknown;
  code?: string;
  retryable: boolean;
  level?: DiagnosticLevel;
};

const SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

const safeValue = (value: unknown, fallback: string) =>
  typeof value === "string" && SAFE_VALUE.test(value) ? value : fallback;

export function serverErrorCode(cause: unknown) {
  const record = cause && typeof cause === "object" ? cause as Record<string, unknown> : null;
  const oauthCode = safeValue(record?.oauthCode, "");
  if (oauthCode) return oauthCode;
  const code = safeValue(record?.code, "");
  if (code) return code;
  if (typeof record?.status === "number" && Number.isInteger(record.status)) return `http_${record.status}`;
  return "unknown_error";
}

export function logServerDiagnostic(scope: string, diagnostic: ServerDiagnostic) {
  const level = diagnostic.level || "error";
  const payload = {
    stage: safeValue(diagnostic.stage, "unknown_stage"),
    code: safeValue(diagnostic.code, serverErrorCode(diagnostic.cause)),
    retryable: diagnostic.retryable,
  };
  console[level](safeValue(scope, "server_diagnostic"), payload);
}
