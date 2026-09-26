export type FinalizeReservationSnapshot = {
  status: string;
  materialId: string;
};

export type AmbiguousCommitResolution =
  | { kind: "committed"; materialId: string }
  | { kind: "retry" }
  | { kind: "unavailable" };

export async function resolveAmbiguousCommit(
  readReservation: () => Promise<FinalizeReservationSnapshot | null>,
  materialExists: (materialId: string) => Promise<boolean>,
): Promise<AmbiguousCommitResolution> {
  let reservation: FinalizeReservationSnapshot | null;
  try {
    reservation = await readReservation();
  } catch {
    return { kind: "unavailable" };
  }
  if (!reservation) return { kind: "unavailable" };
  if (reservation.status !== "committed") return { kind: "retry" };
  try {
    return await materialExists(reservation.materialId)
      ? { kind: "committed", materialId: reservation.materialId }
      : { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}
