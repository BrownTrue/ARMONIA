export type ReconnectableGoogleRecord = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  calendarId?: string;
  nameFormat: "first_initial" | "full" | "initials";
  reminderMinutes: number;
  syncEnabled: boolean;
};

export type ReconnectTokenResult = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export class GoogleReconnectError extends Error {
  readonly code: "missing_connection" | "missing_refresh_token" | "calendar_unavailable";

  constructor(code: "missing_connection" | "missing_refresh_token" | "calendar_unavailable", message: string) {
    super(message);
    this.name = "GoogleReconnectError";
    this.code = code;
  }
}

export async function reconnectGoogleConnection<T extends ReconnectableGoogleRecord>(
  existing: T | null,
  tokens: ReconnectTokenResult,
  operations: {
    verifyCalendarAccess: (record: T) => Promise<void>;
    save: (record: T) => Promise<void>;
  },
) {
  if (!existing?.calendarId) {
    throw new GoogleReconnectError("missing_connection", "Connessione Google esistente non trovata");
  }
  if (!tokens.refreshToken) {
    throw new GoogleReconnectError("missing_refresh_token", "Google non ha restituito un nuovo refresh token");
  }

  const next = {
    ...existing,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  } as T;

  try {
    await operations.verifyCalendarAccess(next);
  } catch {
    throw new GoogleReconnectError("calendar_unavailable", "Il calendario Armonia esistente non è accessibile con l'account autorizzato");
  }
  await operations.save(next);
  return next;
}
