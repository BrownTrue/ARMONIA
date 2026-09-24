export type GoogleEventLink = {
  googleEventId: string | null;
  attemptCount: number;
};

export type GoogleEventLinkCleanup = {
  find: () => Promise<GoogleEventLink | null>;
  markSyncing: (attemptCount: number) => Promise<void>;
  deleteGoogleEvent: (eventId: string) => Promise<void>;
  remove: () => Promise<void>;
  markError: (message: string) => Promise<void>;
};

export async function removeLinkedGoogleEvent(operations: GoogleEventLinkCleanup) {
  const link = await operations.find();
  if (!link) return { ok: true as const, hadMapping: false };

  if (!link.googleEventId) {
    await operations.remove();
    return { ok: true as const, hadMapping: true };
  }

  await operations.markSyncing(link.attemptCount + 1);
  try {
    await operations.deleteGoogleEvent(link.googleEventId);
    await operations.remove();
    return { ok: true as const, hadMapping: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Eliminazione non riuscita";
    await operations.markError(message);
    throw cause;
  }
}
