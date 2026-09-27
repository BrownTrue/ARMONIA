import type { Appointment, Material, Session } from "./types.ts";

export type RecentPatientMaterial = {
  materialId: string;
  material?: Material;
  lastUsedOn: string;
};

const appointmentTimestamp = (appointment: Appointment) =>
  new Date(`${appointment.date}T${appointment.time || "00:00"}:00`).getTime();

export function getPatientMaterials(materials: Material[], patientId: string) {
  const seen = new Set<string>();
  return materials.filter((material) => {
    if (!material.patientIds.includes(patientId) || seen.has(material.id)) return false;
    seen.add(material.id);
    return true;
  });
}

export function getRecentPatientMaterials(
  sessions: Session[],
  materials: Material[],
  patientId: string,
  limit = 5,
): RecentPatientMaterial[] {
  const byId = new Map(materials.map((material) => [material.id, material]));
  const seen = new Set<string>();
  const result: RecentPatientMaterial[] = [];
  const patientSessions = sessions
    .filter((session) => session.patientId === patientId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  for (const session of patientSessions) {
    for (const materialId of session.materialIds) {
      if (seen.has(materialId)) continue;
      seen.add(materialId);
      result.push({ materialId, material: byId.get(materialId), lastUsedOn: session.date });
      if (result.length >= limit) return result;
    }
  }
  return result;
}

export function getFuturePatientAppointments(
  appointments: Appointment[],
  patientId: string,
  now: Date = new Date(),
) {
  const threshold = now.getTime();
  return appointments
    .filter((appointment) => appointment.patientId === patientId && appointment.type !== "cancelled")
    .map((appointment) => ({ appointment, timestamp: appointmentTimestamp(appointment) }))
    .filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= threshold)
    .sort((a, b) => a.timestamp - b.timestamp || a.appointment.createdAt.localeCompare(b.appointment.createdAt))
    .map(({ appointment }) => appointment);
}
