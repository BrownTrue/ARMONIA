-- READ-ONLY postflight for migration 018. Compare appointments_after_018 with
-- appointments_before_018 recorded by the preflight before applying migration.

select
  to_regclass('public.appointment_locations') as appointment_locations_relation,
  to_regclass('public.appointment_services') as appointment_services_relation;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('appointment_locations', 'appointment_services')
order by c.relname;

select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('appointment_locations', 'appointment_services')
order by tablename, cmd, policyname;

select
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('appointment_locations', 'appointment_services')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_name, grantee, privilege_type;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'appointments'
  and column_name in (
    'location_id',
    'service_id',
    'location_name_snapshot',
    'service_name_snapshot',
    'effective_price_cents'
  )
order by column_name;

select
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = 'appointments'
  and con.conname in (
    'appointments_location_owner_fk',
    'appointments_service_owner_fk',
    'appointments_effective_price_check'
  )
order by con.conname;

select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'appointment_locations_user_active_order_idx',
    'appointment_services_user_active_order_idx',
    'appointments_user_location_starts_idx',
    'appointments_user_service_starts_idx'
  )
order by indexname;

select
  count(*) as appointments_after_018,
  count(*) filter (
    where location_id is not null
       or service_id is not null
       or location_name_snapshot is not null
       or service_name_snapshot is not null
       or effective_price_cents is not null
  ) as appointments_with_unexpected_backfill,
  count(*) filter (
    where location_id is null
      and service_id is null
      and location_name_snapshot is null
      and service_name_snapshot is null
      and effective_price_cents is null
  ) as legacy_appointments_unchanged
from public.appointments;
