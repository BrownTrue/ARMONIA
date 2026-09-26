import "server-only";
import { randomUUID } from "crypto";
import { supabaseServiceClient } from "@/lib/supabase/server";
import { deleteGoogleEvent, findGoogleEventsByAppointmentId, upsertGoogleEvent } from "./google-api";
import { googleEventTitle, romeAppointmentDateTime } from "./event-details";
import {
  classifyGoogleSyncFailure,
  deterministicGoogleEventId,
  GOOGLE_SERVER_SYNC_MAX_ATTEMPTS,
  googleSyncRetryDelayMs,
  runIfGoogleServerSyncEnabled,
} from "./server-sync-policy";
import { googleTokenStore } from "./token-store";
import { logServerDiagnostic } from "@/lib/privacy/server-diagnostics";

type ClaimedGoogleOperation = {
  user_id: string;
  appointment_id: string;
  google_event_id: string | null;
  desired_action: "upsert" | "delete";
  operation_version: number;
  attempt_count: number;
};

type ServerSyncSummary = {
  claimed: number;
  succeeded: number;
  retrying: number;
  failed: number;
};

const rpcError = (error: { message?: string } | null) => {
  if (error) throw new Error(error.message || "Operazione outbox Google non riuscita");
};

export async function processGoogleCalendarServerOutbox() {
  return runIfGoogleServerSyncEnabled(process.env, async configuration => {
    const service = supabaseServiceClient();
    const leaseToken = randomUUID();
    const claimed = await service.rpc("claim_google_calendar_sync_batch", {
      p_lease_token: leaseToken,
      p_batch_size: 20,
      p_lease_seconds: 120,
      p_user_id: configuration.testUserId,
    });
    rpcError(claimed.error);
    const operations = (claimed.data || []) as ClaimedGoogleOperation[];
    const summary: ServerSyncSummary = { claimed: operations.length, succeeded: 0, retrying: 0, failed: 0 };

    for (const operation of operations) {
      try {
        const appointmentResult = await service
          .from("appointments")
          .select("id,patient_id,starts_at,duration_minutes,type")
          .eq("user_id", operation.user_id)
          .eq("id", operation.appointment_id)
          .maybeSingle();
        rpcError(appointmentResult.error);
        const appointment = appointmentResult.data;
        const shouldDelete = operation.desired_action === "delete" || !appointment || appointment.type === "cancelled";

        if (shouldDelete) {
          if (operation.google_event_id) await deleteGoogleEvent(operation.user_id, operation.google_event_id);
          const completed = await service.rpc("complete_google_calendar_sync", {
            p_user_id: operation.user_id,
            p_appointment_id: operation.appointment_id,
            p_operation_version: operation.operation_version,
            p_lease_token: leaseToken,
            p_google_event_id: null,
            p_remove_link: true,
          });
          rpcError(completed.error);
          summary.succeeded += 1;
          continue;
        }

        const connection = await googleTokenStore.load(operation.user_id);
        if (!connection?.calendarId || !connection.syncEnabled) throw new Error("Google Calendar non collegato");
        const patientResult = await service
          .from("patients")
          .select("first_name,last_name")
          .eq("user_id", operation.user_id)
          .eq("id", appointment.patient_id)
          .maybeSingle();
        rpcError(patientResult.error);
        if (!patientResult.data) throw new Error("Paziente non trovato");

        let eventId = operation.google_event_id || undefined;
        if (!eventId) {
          const legacyMatches = await findGoogleEventsByAppointmentId(operation.user_id, operation.appointment_id);
          eventId = legacyMatches.sort()[0];
          if (legacyMatches.length > 1) {
            logServerDiagnostic("google_calendar", {
              stage: "legacy_event_lookup",
              code: "duplicate_event_mapping",
              retryable: false,
              level: "warn",
            });
          }
        }
        const when = romeAppointmentDateTime(appointment.starts_at);
        const event = await upsertGoogleEvent(operation.user_id, {
          appointmentId: operation.appointment_id,
          eventId,
          createEventId: eventId ? undefined : deterministicGoogleEventId({
            namespace: process.env.NEXT_PUBLIC_SUPABASE_URL || "armonia-local",
            userId: operation.user_id,
            appointmentId: operation.appointment_id,
          }),
          title: googleEventTitle(patientResult.data.first_name, patientResult.data.last_name, connection.nameFormat),
          date: when.date,
          time: when.time,
          duration: appointment.duration_minutes,
          reminderMinutes: connection.reminderMinutes,
        });
        const completed = await service.rpc("complete_google_calendar_sync", {
          p_user_id: operation.user_id,
          p_appointment_id: operation.appointment_id,
          p_operation_version: operation.operation_version,
          p_lease_token: leaseToken,
          p_google_event_id: event.id,
          p_remove_link: false,
        });
        rpcError(completed.error);
        summary.succeeded += 1;
      } catch (cause) {
        const failure = classifyGoogleSyncFailure(cause);
        const retryable = failure.retryable && operation.attempt_count < GOOGLE_SERVER_SYNC_MAX_ATTEMPTS;
        const result = retryable
          ? await service.rpc("retry_google_calendar_sync", {
              p_user_id: operation.user_id,
              p_appointment_id: operation.appointment_id,
              p_operation_version: operation.operation_version,
              p_lease_token: leaseToken,
              p_next_attempt_at: new Date(Date.now() + googleSyncRetryDelayMs(operation.attempt_count)).toISOString(),
              p_error_code: failure.code,
              p_error_message: failure.message,
            })
          : await service.rpc("fail_google_calendar_sync", {
              p_user_id: operation.user_id,
              p_appointment_id: operation.appointment_id,
              p_operation_version: operation.operation_version,
              p_lease_token: leaseToken,
              p_error_code: failure.code,
              p_error_message: failure.message,
            });
        rpcError(result.error);
        if (retryable) summary.retrying += 1;
        else summary.failed += 1;
      }
    }

    return summary;
  });
}
