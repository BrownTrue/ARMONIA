import "server-only";
import { supabaseServiceClient } from "@/lib/supabase/server";
import type { CalendarFeedAppointment, CalendarFeedTitleFormat } from "./ics";
import {
  createCalendarFeedCredentials,
  decryptCalendarFeedToken,
  hashCalendarFeedToken,
  parseCalendarFeedEncryptionKey,
} from "./token";
import { calendarFeedAppointmentsFromRows } from "./rows";

const calendarFeedEncryptionSecret = () => {
  const secret = process.env.CALENDAR_FEED_ENCRYPTION_KEY;
  parseCalendarFeedEncryptionKey(secret);
  return secret!;
};

type SubscriptionRow = {
  user_id: string;
  token_hash: string;
  token_encrypted: string;
  enabled: boolean;
  title_format: CalendarFeedTitleFormat;
  created_at: string;
  updated_at: string;
  rotated_at: string | null;
};

export type CalendarFeedSubscription = {
  userId: string;
  enabled: boolean;
  titleFormat: CalendarFeedTitleFormat;
  token: string;
  createdAt: string;
  updatedAt: string;
  rotatedAt?: string;
};

const fromRow = (row: SubscriptionRow): CalendarFeedSubscription => ({
  userId: row.user_id,
  enabled: row.enabled,
  titleFormat: row.title_format,
  token: decryptCalendarFeedToken(row.token_encrypted, calendarFeedEncryptionSecret()),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  rotatedAt: row.rotated_at || undefined,
});

const subscriptionColumns = "user_id,token_hash,token_encrypted,enabled,title_format,created_at,updated_at,rotated_at";

export async function loadCalendarFeedSubscription(userId: string) {
  const { data, error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .select(subscriptionColumns)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as SubscriptionRow) : null;
}

export async function activateCalendarFeedSubscription(userId: string, titleFormat: CalendarFeedTitleFormat) {
  const current = await loadCalendarFeedSubscription(userId);
  if (current?.enabled) return current;
  const credentials = createCalendarFeedCredentials(calendarFeedEncryptionSecret());
  const now = new Date().toISOString();
  const { data, error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .upsert({
      user_id: userId,
      token_hash: credentials.tokenHash,
      token_encrypted: credentials.tokenEncrypted,
      enabled: true,
      title_format: titleFormat,
      updated_at: now,
      rotated_at: current ? now : null,
    }, { onConflict: "user_id" })
    .select(subscriptionColumns)
    .single();
  if (error) throw error;
  return fromRow(data as SubscriptionRow);
}

export async function updateCalendarFeedTitleFormat(userId: string, titleFormat: CalendarFeedTitleFormat) {
  const { data, error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .update({ title_format: titleFormat, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select(subscriptionColumns)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as SubscriptionRow) : null;
}

export async function rotateCalendarFeedSubscription(userId: string) {
  const credentials = createCalendarFeedCredentials(calendarFeedEncryptionSecret());
  const now = new Date().toISOString();
  const { data, error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .update({
      token_hash: credentials.tokenHash,
      token_encrypted: credentials.tokenEncrypted,
      enabled: true,
      updated_at: now,
      rotated_at: now,
    })
    .eq("user_id", userId)
    .select(subscriptionColumns)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as SubscriptionRow) : null;
}

export async function disableCalendarFeedSubscription(userId: string) {
  const { error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function findEnabledCalendarFeedSubscription(token: string) {
  const { data, error } = await supabaseServiceClient()
    .from("calendar_feed_subscriptions")
    .select("user_id,title_format,enabled")
    .eq("token_hash", hashCalendarFeedToken(token))
    .eq("enabled", true)
    .maybeSingle();
  if (error) throw error;
  return data ? { userId: data.user_id as string, titleFormat: data.title_format as CalendarFeedTitleFormat } : null;
}

export async function loadCalendarFeedAppointments(userId: string, since: Date): Promise<CalendarFeedAppointment[]> {
  const { data, error } = await supabaseServiceClient()
    .from("appointments")
    .select("id,starts_at,duration_minutes,type,updated_at,patients!inner(first_name,last_name,user_id)")
    .eq("user_id", userId)
    .eq("patients.user_id", userId)
    .neq("type", "cancelled")
    .gte("starts_at", since.toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return calendarFeedAppointmentsFromRows(data || [], userId);
}
