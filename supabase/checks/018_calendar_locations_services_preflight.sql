-- READ-ONLY preflight for migration 018. Do not run migration from this file.

select
  to_regclass('public.appointment_locations') as appointment_locations_relation,
  to_regclass('public.appointment_services') as appointment_services_relation;

select
  table_schema,
  table_name,
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

select count(*) as appointments_before_018
from public.appointments;

select
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'appointments'
order by grantee, privilege_type;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'appointments'
order by policyname;

select
  n.nspname as schema_name,
  c.relname as object_name,
  c.relkind as object_kind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relname in ('appointment_locations', 'appointment_services')
order by n.nspname, c.relname;
