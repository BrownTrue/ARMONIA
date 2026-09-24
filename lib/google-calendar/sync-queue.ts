export type QueueItem = { id: string };

export function reconcileStaleUpserts<T extends { action: string }>(
  queue: readonly T[],
  currentAppointmentIds: ReadonlySet<string>,
  appointmentId: (item: T) => string,
  toDelete: (item: T, appointmentId: string) => T,
) {
  return queue.map(item => {
    const id = appointmentId(item);
    return item.action === "upsert" && !currentAppointmentIds.has(id) ? toDelete(item, id) : item;
  });
}

export async function processQueueSnapshot<T extends QueueItem>(
  initial: readonly T[],
  currentById: (id: string) => T | undefined,
  process: (item: T) => Promise<void>,
  stopAfterError: (error: Error) => boolean = () => false,
) {
  const errors: Error[] = [];

  for (const initialItem of initial) {
    const current = currentById(initialItem.id);
    if (!current) continue;

    try {
      await process(current);
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("Errore di sincronizzazione");
      errors.push(error);
      if (stopAfterError(error)) break;
    }
  }

  return errors;
}

export function isGoogleDeleteAlreadyAbsent(cause: unknown) {
  const status = (cause as { status?: number } | null)?.status;
  return status === 404 || status === 410;
}
