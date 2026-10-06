-- Calendar V3 catalog lifecycle: archived entries leave the operational
-- catalog while remaining available to historical appointments and colors.

begin;

alter table public.appointment_locations
  add column archived_at timestamptz null;

alter table public.appointment_services
  add column archived_at timestamptz null;

comment on column public.appointment_locations.archived_at is
  'When set, the location is removed from the operational catalog but retained for appointment history.';

comment on column public.appointment_services.archived_at is
  'When set, the service is removed from the operational catalog but retained for appointment history.';

alter table public.appointment_locations
  add constraint appointment_locations_archived_inactive_check
  check (archived_at is null or is_active = false);

alter table public.appointment_services
  add constraint appointment_services_archived_inactive_check
  check (archived_at is null or is_active = false);

create index sessions_user_appointment_idx
on public.sessions (user_id, appointment_id)
where appointment_id is not null;

create function public.calendar_appointment_is_operational(
  p_user_id uuid,
  p_appointment_id uuid,
  p_type public.appointment_type,
  p_starts_at timestamptz
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select p_type <> 'cancelled'::public.appointment_type
    and (
      (p_starts_at at time zone 'Europe/Rome')::date >=
        (current_timestamp at time zone 'Europe/Rome')::date
      or not exists (
        select 1
          from public.sessions s
         where s.user_id = p_user_id
           and s.appointment_id = p_appointment_id
      )
    );
$$;

create function public.enforce_calendar_catalog_archive_guard()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  blocking_appointments bigint;
  lock_kind text;
begin
  if new.archived_at is null then
    if old.archived_at is not null then
      -- Restore makes the item visible again but never reactivates it silently.
      new.is_active := false;
    end if;
    return new;
  end if;

  new.is_active := false;

  if old.archived_at is not null then
    return new;
  end if;

  lock_kind := case tg_table_name
    when 'appointment_locations' then 'location'
    when 'appointment_services' then 'service'
    else null
  end;

  if lock_kind is null then
    raise exception using
      errcode = '55000',
      message = 'calendar_catalog_archive_guard_invalid_table';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'calendar_catalog:' || lock_kind || ':' || new.user_id::text || ':' || new.id::text,
      0
    )
  );

  if lock_kind = 'location' then
    select count(*)
      into blocking_appointments
      from public.appointments a
     where a.user_id = new.user_id
       and a.location_id = new.id
       and public.calendar_appointment_is_operational(
         a.user_id,
         a.id,
         a.type,
         a.starts_at
       );
  else
    select count(*)
      into blocking_appointments
      from public.appointments a
     where a.user_id = new.user_id
       and a.service_id = new.id
       and public.calendar_appointment_is_operational(
         a.user_id,
         a.id,
         a.type,
         a.starts_at
       );
  end if;

  if blocking_appointments > 0 then
    raise exception using
      errcode = '23514',
      message = 'calendar_catalog_archive_blocked',
      detail = blocking_appointments::text;
  end if;

  return new;
end;
$$;

create function public.enforce_appointment_catalog_reference_guard()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  catalog_archived_at timestamptz;
  appointment_operational boolean;
begin
  -- Every writer uses the same deterministic lock order: location, then service.
  if new.location_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'calendar_catalog:location:' || new.user_id::text || ':' || new.location_id::text,
        0
      )
    );
  end if;

  if new.service_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'calendar_catalog:service:' || new.user_id::text || ':' || new.service_id::text,
        0
      )
    );
  end if;

  appointment_operational := case
    when tg_op = 'INSERT' then true
    else public.calendar_appointment_is_operational(
      new.user_id,
      new.id,
      new.type,
      new.starts_at
    )
  end;

  if new.location_id is not null
     and (
       tg_op = 'INSERT'
       or new.location_id is distinct from old.location_id
       or appointment_operational
     ) then
    select l.archived_at
      into catalog_archived_at
      from public.appointment_locations l
     where l.user_id = new.user_id
       and l.id = new.location_id;

    if catalog_archived_at is not null then
      raise exception using
        errcode = '23514',
        message = 'calendar_catalog_location_archived';
    end if;
  end if;

  if new.service_id is not null
     and (
       tg_op = 'INSERT'
       or new.service_id is distinct from old.service_id
       or appointment_operational
     ) then
    select s.archived_at
      into catalog_archived_at
      from public.appointment_services s
     where s.user_id = new.user_id
       and s.id = new.service_id;

    if catalog_archived_at is not null then
      raise exception using
        errcode = '23514',
        message = 'calendar_catalog_service_archived';
    end if;
  end if;

  return new;
end;
$$;

create function public.enforce_session_catalog_reference_guard()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  linked_appointment public.appointments%rowtype;
  catalog_archived_at timestamptz;
begin
  if tg_op = 'UPDATE'
     and new.appointment_id is not distinct from old.appointment_id then
    return new;
  end if;

  if old.appointment_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select a.*
    into linked_appointment
    from public.appointments a
   where a.user_id = old.user_id
     and a.id = old.appointment_id;

  -- Appointment/user/patient deletion may remove the Appointment in the same
  -- transaction. The deferred trigger observes that final state and allows it.
  if not found then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  -- Match the Appointment writer lock order to avoid divergent lock graphs.
  if linked_appointment.location_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'calendar_catalog:location:' || linked_appointment.user_id::text || ':' || linked_appointment.location_id::text,
        0
      )
    );
  end if;

  if linked_appointment.service_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'calendar_catalog:service:' || linked_appointment.user_id::text || ':' || linked_appointment.service_id::text,
        0
      )
    );
  end if;

  if public.calendar_appointment_is_operational(
    linked_appointment.user_id,
    linked_appointment.id,
    linked_appointment.type,
    linked_appointment.starts_at
  ) then
    if linked_appointment.location_id is not null then
      select l.archived_at
        into catalog_archived_at
        from public.appointment_locations l
       where l.user_id = linked_appointment.user_id
         and l.id = linked_appointment.location_id;

      if catalog_archived_at is not null then
        raise exception using
          errcode = '23514',
          message = case tg_op
            when 'DELETE' then 'calendar_catalog_session_delete_blocked'
            else 'calendar_catalog_session_unlink_blocked'
          end;
      end if;
    end if;

    if linked_appointment.service_id is not null then
      select s.archived_at
        into catalog_archived_at
        from public.appointment_services s
       where s.user_id = linked_appointment.user_id
         and s.id = linked_appointment.service_id;

      if catalog_archived_at is not null then
        raise exception using
          errcode = '23514',
          message = case tg_op
            when 'DELETE' then 'calendar_catalog_session_delete_blocked'
            else 'calendar_catalog_session_unlink_blocked'
          end;
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger appointment_locations_archive_guard
before update of archived_at on public.appointment_locations
for each row execute function public.enforce_calendar_catalog_archive_guard();

create trigger appointment_services_archive_guard
before update of archived_at on public.appointment_services
for each row execute function public.enforce_calendar_catalog_archive_guard();

create trigger appointments_catalog_reference_insert_guard
before insert on public.appointments
for each row execute function public.enforce_appointment_catalog_reference_guard();

create trigger appointments_catalog_reference_update_guard
before update of location_id, service_id, starts_at, type on public.appointments
for each row execute function public.enforce_appointment_catalog_reference_guard();

create constraint trigger sessions_catalog_reference_delete_guard
after delete or update of appointment_id on public.sessions
deferrable initially deferred
for each row execute function public.enforce_session_catalog_reference_guard();

revoke all on function public.calendar_appointment_is_operational(uuid, uuid, public.appointment_type, timestamptz) from public, anon, authenticated;
grant execute on function public.calendar_appointment_is_operational(uuid, uuid, public.appointment_type, timestamptz) to authenticated;
revoke all on function public.enforce_calendar_catalog_archive_guard() from public, anon, authenticated;
revoke all on function public.enforce_appointment_catalog_reference_guard() from public, anon, authenticated;
revoke all on function public.enforce_session_catalog_reference_guard() from public, anon, authenticated;

commit;
