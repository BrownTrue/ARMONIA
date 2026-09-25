import { createHash } from "crypto";
import { isGoogleOAuthError } from "./oauth-error.ts";

export const GOOGLE_SERVER_SYNC_MAX_ATTEMPTS = 10;

export type GoogleServerSyncConfiguration = {
  enabled: boolean;
  testUserId?: string;
};

export type GoogleSyncFailure = {
  code: string;
  message: string;
  retryable: boolean;
};

export function googleServerSyncConfiguration(
  environment: Record<string, string | undefined> = process.env,
): GoogleServerSyncConfiguration {
  const testUserId = environment.GOOGLE_CALENDAR_SERVER_SYNC_TEST_USER_ID?.trim();
  return {
    enabled:
      environment.GOOGLE_CALENDAR_SERVER_SYNC_ENABLED === "true" &&
      Boolean(testUserId),
    testUserId: testUserId || undefined,
  };
}

export async function runIfGoogleServerSyncEnabled<T>(
  environment: Record<string, string | undefined>,
  task: (configuration: Required<GoogleServerSyncConfiguration>) => Promise<T>,
) {
  const configuration = googleServerSyncConfiguration(environment);
  if (!configuration.enabled || !configuration.testUserId) {
    return { enabled: false as const };
  }
  return {
    enabled: true as const,
    value: await task(configuration as Required<GoogleServerSyncConfiguration>),
  };
}

export function deterministicGoogleEventId(input: {
  namespace: string;
  userId: string;
  appointmentId: string;
}) {
  const digest = createHash("sha256")
    .update(`${input.namespace}:${input.userId}:${input.appointmentId}`)
    .digest("hex");
  return `a${digest.slice(0, 48)}`;
}

export function googleSyncRetryDelayMs(attemptCount: number) {
  const minutes = [1, 2, 5, 15, 30, 60, 180, 360, 720, 1440];
  return minutes[Math.min(Math.max(attemptCount, 1), minutes.length) - 1] * 60_000;
}

export function classifyGoogleSyncFailure(cause: unknown): GoogleSyncFailure {
  const error = cause instanceof Error ? cause : new Error("Sincronizzazione Google non riuscita");
  const status = (cause as { status?: number } | null)?.status;

  if (isGoogleOAuthError(cause)) {
    return {
      code: cause.oauthCode || `oauth_http_${cause.status}`,
      message: error.message,
      retryable: false,
    };
  }
  if (status === 401) return { code: "google_unauthorized", message: "Autorizzazione Google non valida", retryable: false };
  if (status === 429) return { code: "google_rate_limit", message: "Limite temporaneo Google Calendar raggiunto", retryable: true };
  if (status === 403) {
    const quota = /quota|rate.?limit|usagelimits/i.test(error.message);
    return {
      code: quota ? "google_rate_limit" : "google_forbidden",
      message: quota ? "Limite temporaneo Google Calendar raggiunto" : "Accesso al calendario Google non consentito",
      retryable: quota,
    };
  }
  if (status && status >= 500) return { code: `google_http_${status}`, message: `Google Calendar non disponibile (HTTP ${status})`, retryable: true };
  if (/fetch|network|timeout|timed out|socket/i.test(error.message)) {
    return { code: "google_network", message: "Connessione a Google Calendar non riuscita", retryable: true };
  }
  return {
    code: status ? `google_http_${status}` : "google_error",
    message: status ? `Sincronizzazione Google non riuscita (HTTP ${status})` : "Sincronizzazione Google non riuscita",
    retryable: false,
  };
}
