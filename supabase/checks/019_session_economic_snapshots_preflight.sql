-- Read-only preflight. Run manually before migration 019.
-- Gate: if postgres_version_supports_column_list_set_null is false,
-- DO NOT APPLY migration 019.

select
  current_setting('server_version_num')::integer as server_version_num,
  version() as postgres_version,
  current_setting('server_version_num')::integer >= 150000
    as postgres_version_supports_column_list_set_null;

select
  count(*) as sessions_before,
  count(*) filter (where appointment_id is not null) as sessions_with_appointment,
  min(occurred_at) as earliest_session_at,
  max(occurred_at) as latest_session_at
from public.sessions;

select
  count(*) as economic_columns_present,
  count(*) = 0 as economic_columns_absent
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sessions'
  and column_name in ('service_id', 'service_name_snapshot', 'effective_price_cents');

select column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sessions'
order by ordinal_position;

select conname, contype, convalidated, pg_get_constraintdef(oid) as definition
from pg_catalog.pg_constraint
where conrelid = 'public.sessions'::regclass
order by conname;

with unique_constraints as (
  select
    c.conname,
    c.condeferrable,
    c.condeferred,
    array(
      select a.attname
      from unnest(c.conkey) with ordinality as key(attnum, position)
      join pg_catalog.pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = key.attnum
      order by key.position
    ) as key_columns,
    pg_get_constraintdef(c.oid) as definition
  from pg_catalog.pg_constraint c
  where c.conrelid = 'public.appointment_services'::regclass
    and c.contype = 'u'
)
select
  conname,
  key_columns,
  condeferrable,
  condeferred,
  definition,
  key_columns = array['user_id', 'id']::name[]
    and not condeferrable as supports_sessions_owner_fk
from unique_constraints
order by conname;

select
  count(*) filter (
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_service_owner_fk'
  ) as service_fk_name_collisions,
  count(*) filter (
    where conrelid = 'public.sessions'::regclass
      and conname = 'sessions_effective_price_check'
  ) as price_check_name_collisions
from pg_catalog.pg_constraint;

select
  count(*) as index_name_collisions,
  count(*) = 0 as index_name_collision_absent
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'sessions_user_service_occurred_idx'
  and c.relkind in ('i', 'I');

select relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_catalog.pg_class
where oid = 'public.sessions'::regclass;

select policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public' and tablename = 'sessions'
order by policyname;

select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'sessions'
  and grantee in ('authenticated', 'anon', 'service_role')
order by grantee, privilege_type;

with roles(role_name) as (
  values ('authenticated'), ('anon'), ('service_role')
), privileges(privilege_type) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
)
select
  role_name,
  privilege_type,
  pg_catalog.has_table_privilege(
    role_name,
    'public.sessions',
    privilege_type
  ) as has_effective_privilege
from roles
cross join privileges
order by role_name, privilege_type;

select count(*) as cross_owner_appointment_services
from public.appointments a
join public.appointment_services s on s.id = a.service_id
where a.user_id <> s.user_id;

select jsonb_build_object(
  'server_version_num', current_setting('server_version_num')::integer,
  'postgres15_or_newer', current_setting('server_version_num')::integer >= 150000,
  'sessions_before', (select count(*) from public.sessions),
  'sessions_with_appointment', (
    select count(*) from public.sessions where appointment_id is not null
  ),
  'economic_columns_absent', (
    select count(*) = 0
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name in ('service_id', 'service_name_snapshot', 'effective_price_cents')
  ),
  'referenced_unique_present', exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.appointment_services'::regclass
      and c.contype = 'u'
      and not c.condeferrable
      and array(
        select a.attname
        from unnest(c.conkey) with ordinality as key(attnum, position)
        join pg_catalog.pg_attribute a
          on a.attrelid = c.conrelid and a.attnum = key.attnum
        order by key.position
      ) = array['user_id', 'id']::name[]
  ),
  'constraint_name_collisions_absent', not exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.sessions'::regclass
      and c.conname in ('sessions_service_owner_fk', 'sessions_effective_price_check')
  ),
  'index_name_collision_absent', not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'sessions_user_service_occurred_idx'
      and c.relkind in ('i', 'I')
  ),
  'rls_enabled', (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.sessions'::regclass
  )
) as "019_preflight";
