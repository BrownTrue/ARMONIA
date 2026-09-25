-- Dormant server-side Google Calendar outbox infrastructure.
--
-- This migration is additive and confined to the Google Calendar subsystem.
-- It does not configure a scheduler, enable the application worker, or attach
-- triggers to appointments. The atomic outbox triggers will be introduced by
-- a later migration together with the controlled server-side cutover.

alter table public.google_calendar_event_links
  add column if not exists operation_version bigint not null default 1,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists is_retryable boolean not null default true;

create index if not exists google_calendar_event_links_processable_idx
  on public.google_calendar_event_links
    (next_attempt_at, updated_at, user_id)
  where sync_status in ('pending', 'error', 'syncing');

comment on column public.google_calendar_event_links.operation_version is
  'Monotonic outbox version. Worker results apply only to the version they claimed.';
comment on column public.google_calendar_event_links.next_attempt_at is
  'Earliest timestamp at which a retryable operation may be claimed.';
comment on column public.google_calendar_event_links.lease_token is
  'Opaque worker lease identifier used to reject stale worker results.';
comment on column public.google_calendar_event_links.lease_expires_at is
  'Expiry of the worker lease; expired syncing rows may be reclaimed.';
comment on column public.google_calendar_event_links.is_retryable is
  'False when user or operator action is required before another attempt.';

create or replace function public.claim_google_calendar_sync_batch(
  p_lease_token uuid,
  p_batch_size integer default 20,
  p_lease_seconds integer default 120,
  p_user_id uuid default null
)
returns table (
  user_id uuid,
  appointment_id uuid,
  google_event_id text,
  desired_action text,
  operation_version bigint,
  attempt_count integer
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  with candidates as (
    select link.user_id, link.appointment_id
    from public.google_calendar_event_links link
    join public.google_calendar_connections connection
      on connection.user_id = link.user_id
     and connection.sync_enabled = true
    where (p_user_id is null or link.user_id = p_user_id)
      and (
        (
          link.sync_status in ('pending', 'error')
          and link.is_retryable = true
          and coalesce(link.next_attempt_at, '-infinity'::timestamptz) <= now()
        )
        or (
          link.sync_status = 'syncing'
          and coalesce(link.lease_expires_at, '-infinity'::timestamptz) <= now()
        )
      )
    order by coalesce(link.next_attempt_at, link.updated_at), link.updated_at
    for update of link skip locked
    limit least(greatest(p_batch_size, 1), 100)
  ), claimed as (
    update public.google_calendar_event_links link
    set sync_status = 'syncing',
        attempt_count = link.attempt_count + 1,
        last_attempt_at = now(),
        lease_token = p_lease_token,
        lease_expires_at = now() + make_interval(secs => least(greatest(p_lease_seconds, 30), 900)),
        updated_at = now()
    from candidates
    where link.user_id = candidates.user_id
      and link.appointment_id = candidates.appointment_id
    returning link.user_id,
              link.appointment_id,
              link.google_event_id,
              link.desired_action,
              link.operation_version,
              link.attempt_count
  )
  select * from claimed;
$$;

create or replace function public.complete_google_calendar_sync(
  p_user_id uuid,
  p_appointment_id uuid,
  p_operation_version bigint,
  p_lease_token uuid,
  p_google_event_id text default null,
  p_remove_link boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_remove_link then
    delete from public.google_calendar_event_links link
    where link.user_id = p_user_id
      and link.appointment_id = p_appointment_id
      and link.desired_action = 'delete'
      and link.operation_version = p_operation_version
      and link.lease_token = p_lease_token;
    if found then return true; end if;
  end if;

  update public.google_calendar_event_links link
  set google_event_id = coalesce(p_google_event_id, link.google_event_id),
      sync_status = case
        when link.operation_version = p_operation_version then 'synced'
        else 'pending'
      end,
      next_attempt_at = case
        when link.operation_version = p_operation_version then null
        else now()
      end,
      last_error = null,
      last_error_code = null,
      is_retryable = true,
      last_synced_at = case
        when link.operation_version = p_operation_version then now()
        else link.last_synced_at
      end,
      lease_token = null,
      lease_expires_at = null,
      updated_at = now()
  where link.user_id = p_user_id
    and link.appointment_id = p_appointment_id
    and link.lease_token = p_lease_token;
  return found;
end;
$$;

create or replace function public.retry_google_calendar_sync(
  p_user_id uuid,
  p_appointment_id uuid,
  p_operation_version bigint,
  p_lease_token uuid,
  p_next_attempt_at timestamptz,
  p_error_code text,
  p_error_message text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.google_calendar_event_links link
  set sync_status = case
        when link.operation_version = p_operation_version then 'error'
        else 'pending'
      end,
      next_attempt_at = case
        when link.operation_version = p_operation_version then p_next_attempt_at
        else now()
      end,
      last_error_code = case
        when link.operation_version = p_operation_version then left(p_error_code, 120)
        else null
      end,
      last_error = case
        when link.operation_version = p_operation_version then left(p_error_message, 1000)
        else null
      end,
      is_retryable = true,
      lease_token = null,
      lease_expires_at = null,
      updated_at = now()
  where link.user_id = p_user_id
    and link.appointment_id = p_appointment_id
    and link.lease_token = p_lease_token;
  return found;
end;
$$;

create or replace function public.fail_google_calendar_sync(
  p_user_id uuid,
  p_appointment_id uuid,
  p_operation_version bigint,
  p_lease_token uuid,
  p_error_code text,
  p_error_message text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.google_calendar_event_links link
  set sync_status = case
        when link.operation_version = p_operation_version then 'error'
        else 'pending'
      end,
      next_attempt_at = case
        when link.operation_version = p_operation_version then null
        else now()
      end,
      last_error_code = case
        when link.operation_version = p_operation_version then left(p_error_code, 120)
        else null
      end,
      last_error = case
        when link.operation_version = p_operation_version then left(p_error_message, 1000)
        else null
      end,
      is_retryable = case
        when link.operation_version = p_operation_version then false
        else true
      end,
      lease_token = null,
      lease_expires_at = null,
      updated_at = now()
  where link.user_id = p_user_id
    and link.appointment_id = p_appointment_id
    and link.lease_token = p_lease_token;
  return found;
end;
$$;

revoke all on function public.claim_google_calendar_sync_batch(uuid, integer, integer, uuid)
  from public, anon, authenticated;
revoke all on function public.complete_google_calendar_sync(uuid, uuid, bigint, uuid, text, boolean)
  from public, anon, authenticated;
revoke all on function public.retry_google_calendar_sync(uuid, uuid, bigint, uuid, timestamptz, text, text)
  from public, anon, authenticated;
revoke all on function public.fail_google_calendar_sync(uuid, uuid, bigint, uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.claim_google_calendar_sync_batch(uuid, integer, integer, uuid)
  to service_role;
grant execute on function public.complete_google_calendar_sync(uuid, uuid, bigint, uuid, text, boolean)
  to service_role;
grant execute on function public.retry_google_calendar_sync(uuid, uuid, bigint, uuid, timestamptz, text, text)
  to service_role;
grant execute on function public.fail_google_calendar_sync(uuid, uuid, bigint, uuid, text, text)
  to service_role;
