-- Read-only postflight. Run manually after migration 019.
select
  count(*) as sessions_after,
  count(*) filter (where appointment_id is not null) as sessions_with_appointment,
  min(occurred_at) as earliest_session_at,
  max(occurred_at) as latest_session_at
from public.sessions;

select column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sessions'
  and column_name in ('service_id', 'service_name_snapshot', 'effective_price_cents')
order by column_name;

select count(*) as sessions_populated_unexpectedly
from public.sessions
where service_id is not null
   or service_name_snapshot is not null
   or effective_price_cents is not null;

select count(*) as sessions_with_negative_price
from public.sessions
where effective_price_cents < 0;

select
  conname,
  convalidated,
  pg_get_constraintdef(oid) as definition
from pg_catalog.pg_constraint
where conrelid = 'public.sessions'::regclass
  and conname = 'sessions_effective_price_check';

select
  c.conname,
  array(
    select a.attname
    from unnest(c.conkey) with ordinality as key(attnum, position)
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = key.attnum
    order by key.position
  ) as local_columns,
  c.confrelid::regclass as referenced_table,
  array(
    select a.attname
    from unnest(c.confkey) with ordinality as key(attnum, position)
    join pg_catalog.pg_attribute a
      on a.attrelid = c.confrelid and a.attnum = key.attnum
    order by key.position
  ) as referenced_columns,
  c.confdeltype,
  c.confupdtype,
  array(
    select a.attname
    from unnest(coalesce(c.confdelsetcols, c.conkey))
      with ordinality as key(attnum, position)
    join pg_catalog.pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = key.attnum
    order by key.position
  ) as delete_set_columns,
  c.convalidated,
  pg_get_constraintdef(c.oid) as definition
from pg_catalog.pg_constraint c
where c.conrelid = 'public.sessions'::regclass
  and c.conname = 'sessions_service_owner_fk'
  and c.contype = 'f';

with unique_constraints as (
  select
    c.conname,
    c.condeferrable,
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
  definition,
  key_columns = array['user_id', 'id']::name[]
    and not condeferrable as supports_sessions_owner_fk
from unique_constraints
order by conname;

select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename = 'sessions'
  and indexname = 'sessions_user_service_occurred_idx';

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

select conname, contype, convalidated, pg_get_constraintdef(oid) as definition
from pg_catalog.pg_constraint
where conrelid = 'public.sessions'::regclass
order by conname;

select jsonb_build_object(
  'sessions_after', (select count(*) from public.sessions),
  'economic_columns_present', (
    select count(*) = 3
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name in ('service_id', 'service_name_snapshot', 'effective_price_cents')
      and is_nullable = 'YES'
      and column_default is null
  ),
  'sessions_populated_unexpectedly', (
    select count(*)
    from public.sessions
    where service_id is not null
      or service_name_snapshot is not null
      or effective_price_cents is not null
  ),
  'price_check_present_and_validated', exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.sessions'::regclass
      and c.conname = 'sessions_effective_price_check'
      and c.contype = 'c'
      and c.convalidated
  ),
  'service_fk_present_and_validated', exists (
    select 1
    from pg_catalog.pg_constraint c
    where c.conrelid = 'public.sessions'::regclass
      and c.conname = 'sessions_service_owner_fk'
      and c.contype = 'f'
      and c.convalidated
      and c.confdeltype = 'n'
      and c.confupdtype = 'a'
      and array(
        select a.attname
        from unnest(c.confdelsetcols) with ordinality as key(attnum, position)
        join pg_catalog.pg_attribute a
          on a.attrelid = c.conrelid and a.attnum = key.attnum
        order by key.position
      ) = array['service_id']::name[]
  ),
  'service_index_present', exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'sessions'
      and indexname = 'sessions_user_service_occurred_idx'
      and indexdef ilike '%(user_id, service_id, occurred_at)%'
      and indexdef ilike '%where (service_id is not null)%'
  ),
  'rls_enabled', (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.sessions'::regclass
  ),
  'negative_prices', (
    select count(*) from public.sessions where effective_price_cents < 0
  )
) as "019_postflight";
