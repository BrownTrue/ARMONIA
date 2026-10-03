import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatisticsDataset } from "./types.ts";

const PAGE_SIZE = 500;
type QueryResult = { data: Record<string, unknown>[] | null; error: unknown };

async function paginatedRows(client: SupabaseClient, table: string, columns: string, userId: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await client.from(table).select(columns).eq("user_id", userId).order("id").range(from, from + PAGE_SIZE - 1) as QueryResult;
    if (result.error) throw result.error;
    const page = result.data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function romeDateTime(value: unknown) {
  const date = new Date(String(value));
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

export async function loadCloudStatistics(client: SupabaseClient, userId: string): Promise<StatisticsDataset> {
  const [sessions, appointments, patients, payments, services] = await Promise.all([
    paginatedRows(client, "sessions", "id,patient_id,appointment_id,service_id,service_name_snapshot,effective_price_cents,occurred_at,duration_minutes", userId),
    paginatedRows(client, "appointments", "id,starts_at,duration_minutes,type", userId),
    paginatedRows(client, "patients", "id,status,created_at", userId),
    paginatedRows(client, "payments", "id,amount_cents,paid_at,status", userId),
    paginatedRows(client, "appointment_services", "id,name", userId),
  ]);
  return {
    sessions: sessions.map((row) => ({ id: String(row.id), patientId: String(row.patient_id), appointmentId: row.appointment_id ? String(row.appointment_id) : undefined, serviceId: row.service_id ? String(row.service_id) : undefined, serviceNameSnapshot: row.service_name_snapshot ? String(row.service_name_snapshot) : undefined, effectivePriceCents: row.effective_price_cents === null || row.effective_price_cents === undefined ? undefined : Number(row.effective_price_cents), date: romeDateTime(row.occurred_at).date, duration: Number(row.duration_minutes || 45) })),
    appointments: appointments.map((row) => { const value = romeDateTime(row.starts_at); return { id: String(row.id), date: value.date, time: value.time, duration: Number(row.duration_minutes), type: row.type as StatisticsDataset["appointments"][number]["type"] }; }),
    patients: patients.map((row) => ({ id: String(row.id), status: row.status as StatisticsDataset["patients"][number]["status"], createdAt: romeDateTime(row.created_at).date })),
    payments: payments.map((row) => ({ id: String(row.id), amountCents: Number(row.amount_cents), paidAt: String(row.paid_at).slice(0, 10), status: row.status as StatisticsDataset["payments"][number]["status"] })),
    services: services.map((row) => ({ id: String(row.id), name: String(row.name) })),
  };
}

export const STATISTICS_CLOUD_FIELDS = {
  sessions: "id,patient_id,appointment_id,service_id,service_name_snapshot,effective_price_cents,occurred_at,duration_minutes",
  appointments: "id,starts_at,duration_minutes,type",
  patients: "id,status,created_at",
  payments: "id,amount_cents,paid_at,status",
  appointment_services: "id,name",
} as const;
