-- Read-only production preflight for migration 020.
-- Copy the count/fingerprint values from 020_preflight into the expected CTE
-- of the postflight before running it.
with
data_snapshot as (
  select
    (select count(*) from public.patients) as patients_before,
    count(*) as sessions_before,
    count(*) filter (where effective_price_cents is null) as session_prices_null,
    count(*) filter (where effective_price_cents = 0) as session_prices_zero,
    count(*) filter (where effective_price_cents > 0) as session_prices_positive,
    count(*) filter (where effective_price_cents < 0) as session_prices_negative,
    md5(coalesce(string_agg(id::text || ':' || coalesce(effective_price_cents::text, 'NULL'), ',' order by id), '')) as session_economic_fingerprint
  from public.sessions
),
objects as (
  select
    to_regclass('public.payments') is null as payments_absent,
    to_regclass('public.payment_allocations') is null as allocations_absent,
    to_regclass('public.payments_user_patient_paid_idx') is null
      and to_regclass('public.payments_user_status_paid_idx') is null
      and to_regclass('public.payment_allocations_user_session_idx') is null as index_name_collisions_absent,
    not exists (
      select 1
      from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
      where n.nspname = 'public'
        and (
          (r.relname = 'sessions' and c.conname = 'sessions_user_patient_id_key')
          or (r.relname = 'payments' and c.conname in (
            'payments_status_voided_at_check', 'payments_user_patient_fk',
            'payments_user_patient_id_key'
          ))
          or (r.relname = 'payment_allocations' and c.conname in (
            'payment_allocations_payment_fk', 'payment_allocations_session_fk'
          ))
        )
    ) as constraint_name_collisions_absent,
    to_regprocedure('public.create_economic_payment(uuid,uuid,integer,timestamp with time zone,text,text,jsonb)') is null
      and to_regprocedure('public.void_economic_payment(uuid)') is null
      and to_regprocedure('public.enforce_session_payment_floor()') is null as function_name_collisions_absent,
    not exists (
      select 1 from pg_trigger
      where tgname = 'sessions_enforce_payment_floor' and not tgisinternal
    ) as trigger_name_collision_absent
),
prerequisites as (
  select
    exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'sessions' and column_name = 'effective_price_cents'
    ) as session_price_present,
    exists (
      select 1 from pg_constraint
      where conrelid = 'public.patients'::regclass
        and conname = 'patients_user_id_id_key' and contype = 'u' and convalidated
    ) as patient_owner_key_present,
    not exists (
      select 1 from public.sessions group by user_id, patient_id, id having count(*) > 1
    ) as session_owner_key_collision_absent
),
keys as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.conrelid::regclass::text,
    'name', c.conname,
    'type', c.contype,
    'validated', c.convalidated,
    'definition', pg_get_constraintdef(c.oid, true)
  ) order by c.conrelid::regclass::text, c.conname), '[]'::jsonb) as value
  from pg_constraint c
  where (c.conrelid = 'public.patients'::regclass and c.conname = 'patients_user_id_id_key')
     or (c.conrelid = 'public.sessions'::regclass and c.contype = 'p')
),
security as (
  select jsonb_build_object(
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', c.relname,
        'owner', pg_get_userbyid(c.relowner),
        'rls_enabled', c.relrowsecurity,
        'rls_forced', c.relforcerowsecurity,
        'raw_acl', c.relacl
      ) order by c.relname)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('patients', 'sessions')
    ), '[]'::jsonb),
    'policies', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname)
      from pg_policies p
      where p.schemaname = 'public' and p.tablename in ('patients', 'sessions')
    ), '[]'::jsonb),
    'grants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table', table_name, 'grantee', grantee,
        'privilege', privilege_type, 'grantable', is_grantable
      ) order by table_name, grantee, privilege_type)
      from information_schema.role_table_grants
      where table_schema = 'public' and table_name in ('patients', 'sessions')
    ), '[]'::jsonb)
  ) as value
),
default_privileges as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'owner', owner.rolname,
    'schema', coalesce(n.nspname, 'ALL'),
    'object_type', d.defaclobjtype,
    'acl', d.defaclacl
  ) order by owner.rolname, coalesce(n.nspname, 'ALL'), d.defaclobjtype), '[]'::jsonb) as value
  from pg_default_acl d
  join pg_roles owner on owner.oid = d.defaclrole
  left join pg_namespace n on n.oid = d.defaclnamespace
  where d.defaclnamespace = 0 or n.nspname = 'public'
),
delete_structure as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.conrelid::regclass::text,
    'name', c.conname,
    'referenced_table', c.confrelid::regclass::text,
    'delete_action', c.confdeltype,
    'definition', pg_get_constraintdef(c.oid, true)
  ) order by c.conrelid::regclass::text, c.conname), '[]'::jsonb) as value
  from pg_constraint c
  where c.contype = 'f'
    and ((c.conrelid = 'public.patients'::regclass and c.confrelid = 'auth.users'::regclass)
      or (c.conrelid = 'public.sessions'::regclass and c.confrelid = 'public.patients'::regclass))
)
select jsonb_build_object(
  '020_preflight', jsonb_build_object(
    'ready',
      o.payments_absent and o.allocations_absent
      and o.index_name_collisions_absent and o.constraint_name_collisions_absent
      and o.function_name_collisions_absent and o.trigger_name_collision_absent
      and p.session_price_present and p.patient_owner_key_present
      and p.session_owner_key_collision_absent and d.session_prices_negative = 0,
    'server_version_num', current_setting('server_version_num')::integer,
    'version', version(),
    'patients_before', d.patients_before,
    'sessions_before', d.sessions_before,
    'session_prices_null', d.session_prices_null,
    'session_prices_zero', d.session_prices_zero,
    'session_prices_positive', d.session_prices_positive,
    'session_prices_negative', d.session_prices_negative,
    'session_economic_fingerprint', d.session_economic_fingerprint,
    'payments_absent', o.payments_absent,
    'allocations_absent', o.allocations_absent,
    'session_price_present', p.session_price_present,
    'patient_owner_key_present', p.patient_owner_key_present,
    'session_owner_key_collision_absent', p.session_owner_key_collision_absent,
    'index_name_collisions_absent', o.index_name_collisions_absent,
    'constraint_name_collisions_absent', o.constraint_name_collisions_absent,
    'function_name_collisions_absent', o.function_name_collisions_absent,
    'trigger_name_collision_absent', o.trigger_name_collision_absent,
    'required_keys', k.value,
    'current_patient_session_security', s.value,
    'default_privileges', dp.value,
    'current_delete_structure', ds.value
  )
)
from data_snapshot d
cross join objects o
cross join prerequisites p
cross join keys k
cross join security s
cross join default_privileges dp
cross join delete_structure ds;
