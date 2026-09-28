-- Read-only production postflight for migration 020.
-- Expected snapshot copied from the successful production preflight.
with
expected as (
  select 15::bigint as patients_before, 23::bigint as sessions_before,
    18::bigint as session_prices_null_before, 1::bigint as session_prices_zero_before,
    4::bigint as session_prices_positive_before,
    '741b2348320047caeea4a63e415ce9f2'::text as session_economic_fingerprint_before
),
data_snapshot as (
  select (select count(*) from public.patients) as patients_after, count(*) as sessions_after,
    count(*) filter (where effective_price_cents is null) as session_prices_null_after,
    count(*) filter (where effective_price_cents = 0) as session_prices_zero_after,
    count(*) filter (where effective_price_cents > 0) as session_prices_positive_after,
    md5(coalesce(string_agg(id::text || ':' || coalesce(effective_price_cents::text, 'NULL'), ',' order by id), '')) as session_economic_fingerprint_after
  from public.sessions
),
row_counts as (
  select (select count(*) from public.payments) as payments_count,
    (select count(*) from public.payment_allocations) as allocations_count
),
columns_snapshot as (
  select jsonb_build_object(
    'payments', coalesce((select jsonb_agg(jsonb_build_object(
      'name', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default) order by ordinal_position)
      from information_schema.columns where table_schema = 'public' and table_name = 'payments'), '[]'::jsonb),
    'payment_allocations', coalesce((select jsonb_agg(jsonb_build_object(
      'name', column_name, 'type', data_type, 'udt', udt_name,
      'nullable', is_nullable, 'default', column_default) order by ordinal_position)
      from information_schema.columns where table_schema = 'public' and table_name = 'payment_allocations'), '[]'::jsonb)
  ) as value
),
constraints_snapshot as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.conrelid::regclass::text, 'name', c.conname, 'type', c.contype,
    'validated', c.convalidated,
    'delete_action', case c.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' else null end,
    'definition', pg_get_constraintdef(c.oid, true)
  ) order by c.conrelid::regclass::text, c.conname), '[]'::jsonb) as value
  from pg_constraint c
  where c.conrelid in ('public.payments'::regclass, 'public.payment_allocations'::regclass)
     or (c.conrelid = 'public.sessions'::regclass and c.conname = 'sessions_user_patient_id_key')
),
constraint_checks as (
  select
    exists (select 1 from pg_constraint where conrelid = 'public.sessions'::regclass and conname = 'sessions_user_patient_id_key' and contype = 'u' and convalidated) as session_owner_key_ok,
    exists (select 1 from pg_constraint where conrelid = 'public.payments'::regclass and conname = 'payments_user_patient_fk' and confdeltype = 'r' and convalidated) as patient_restrict_ok,
    exists (select 1 from pg_constraint where conrelid = 'public.payments'::regclass and confrelid = 'auth.users'::regclass and confdeltype = 'r' and convalidated) as auth_user_restrict_ok,
    exists (select 1 from pg_constraint where conrelid = 'public.payment_allocations'::regclass and conname = 'payment_allocations_payment_fk' and confdeltype = 'r' and convalidated) as allocation_payment_restrict_ok,
    exists (select 1 from pg_constraint where conrelid = 'public.payment_allocations'::regclass and conname = 'payment_allocations_session_fk' and confdeltype = 'r' and convalidated) as allocation_session_restrict_ok,
    not exists (select 1 from pg_constraint where conrelid in ('public.payments'::regclass, 'public.payment_allocations'::regclass) and not convalidated) as all_constraints_validated
),
rls_snapshot as (
  select jsonb_build_object(
    'tables', (select jsonb_agg(jsonb_build_object('table', c.relname, 'enabled', c.relrowsecurity, 'forced', c.relforcerowsecurity) order by c.relname)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('payments', 'payment_allocations')),
    'policies', coalesce((select jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname)
      from pg_policies p where p.schemaname = 'public' and p.tablename in ('payments', 'payment_allocations')), '[]'::jsonb)
  ) as value
),
rls_checks as (
  select
    (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('payments', 'payment_allocations')) as rls_enabled,
    (select count(*) from pg_policies where schemaname = 'public' and tablename in ('payments', 'payment_allocations') and cmd = 'SELECT' and roles = array['authenticated']::name[] and qual = '(user_id = auth.uid())') = 2 as select_policies_ok,
    not exists (select 1 from pg_policies where schemaname = 'public' and tablename in ('payments', 'payment_allocations') and cmd <> 'SELECT') as no_mutation_policies
),
privileges_snapshot as (
  select jsonb_build_object(
    'roles', jsonb_agg(jsonb_build_object(
    'table', table_name, 'role', role_name,
    'select', has_table_privilege(role_name, 'public.' || table_name, 'SELECT'),
    'insert', has_table_privilege(role_name, 'public.' || table_name, 'INSERT'),
    'update', has_table_privilege(role_name, 'public.' || table_name, 'UPDATE'),
    'delete', has_table_privilege(role_name, 'public.' || table_name, 'DELETE'),
    'truncate', has_table_privilege(role_name, 'public.' || table_name, 'TRUNCATE'),
    'references', has_table_privilege(role_name, 'public.' || table_name, 'REFERENCES'),
    'trigger', has_table_privilege(role_name, 'public.' || table_name, 'TRIGGER')
    ) order by table_name, role_name),
    'public', (select coalesce(jsonb_agg(jsonb_build_object(
      'table', c.relname, 'privilege', acl.privilege_type, 'grantable', acl.is_grantable
    ) order by c.relname, acl.privilege_type), '[]'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
      where n.nspname = 'public' and c.relname in ('payments', 'payment_allocations') and acl.grantee = 0)
  ) as value
  from (values ('payments'), ('payment_allocations')) tables(table_name)
  cross join (values ('anon'), ('authenticated'), ('service_role')) roles(role_name)
),
privilege_checks as (
  select
    has_table_privilege('authenticated', 'public.payments', 'SELECT') and has_table_privilege('authenticated', 'public.payment_allocations', 'SELECT') as authenticated_select_ok,
    not has_table_privilege('authenticated', 'public.payments', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      and not has_table_privilege('authenticated', 'public.payment_allocations', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_mutations_blocked,
    not has_table_privilege('anon', 'public.payments', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      and not has_table_privilege('anon', 'public.payment_allocations', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_blocked,
    not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
      where n.nspname = 'public' and c.relname in ('payments', 'payment_allocations') and acl.grantee = 0) as public_blocked
),
functions_snapshot as (
  select jsonb_agg(jsonb_build_object(
    'signature', p.oid::regprocedure::text, 'owner', owner.rolname,
    'security_definer', p.prosecdef, 'config', p.proconfig,
    'public_execute', exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'),
    'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
    'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
    'service_role_execute', has_function_privilege('service_role', p.oid, 'EXECUTE')
  ) order by p.proname) as value
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_roles owner on owner.oid = p.proowner
  where n.nspname = 'public' and p.proname in ('create_economic_payment', 'void_economic_payment', 'enforce_session_payment_floor')
),
function_checks as (
  select count(*) = 3 as functions_present, bool_and(p.prosecdef) as all_security_definer,
    bool_and(p.proconfig @> array['search_path=pg_catalog, public']) as search_path_ok,
    bool_and(not exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE')) as public_execute_blocked,
    bool_and(not has_function_privilege('anon', p.oid, 'EXECUTE')) as anon_execute_blocked,
    bool_and(case when p.proname in ('create_economic_payment', 'void_economic_payment') then has_function_privilege('authenticated', p.oid, 'EXECUTE') else not has_function_privilege('authenticated', p.oid, 'EXECUTE') end) as authenticated_execute_ok
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('create_economic_payment', 'void_economic_payment', 'enforce_session_payment_floor')
),
trigger_snapshot as (
  select coalesce(jsonb_agg(jsonb_build_object('name', t.tgname, 'table', t.tgrelid::regclass::text, 'enabled', t.tgenabled, 'definition', pg_get_triggerdef(t.oid, true))), '[]'::jsonb) as value
  from pg_trigger t where t.tgrelid = 'public.sessions'::regclass and t.tgname = 'sessions_enforce_payment_floor' and not t.tgisinternal
),
trigger_check as (
  select count(*) = 1 and bool_and(t.tgenabled <> 'D') as trigger_ok
  from pg_trigger t where t.tgrelid = 'public.sessions'::regclass and t.tgname = 'sessions_enforce_payment_floor' and not t.tgisinternal
)
select jsonb_build_object('020_postflight', jsonb_build_object(
  'pass',
    e.patients_before is not null and e.sessions_before is not null and e.session_prices_null_before is not null
    and e.session_prices_zero_before is not null and e.session_prices_positive_before is not null and e.session_economic_fingerprint_before is not null
    and d.patients_after = e.patients_before and d.sessions_after = e.sessions_before
    and d.session_prices_null_after = e.session_prices_null_before and d.session_prices_zero_after = e.session_prices_zero_before
    and d.session_prices_positive_after = e.session_prices_positive_before and d.session_economic_fingerprint_after = e.session_economic_fingerprint_before
    and rc.payments_count = 0 and rc.allocations_count = 0
    and cc.session_owner_key_ok and cc.patient_restrict_ok and cc.auth_user_restrict_ok
    and cc.allocation_payment_restrict_ok and cc.allocation_session_restrict_ok and cc.all_constraints_validated
    and rlc.rls_enabled and rlc.select_policies_ok and rlc.no_mutation_policies
    and pc.authenticated_select_ok and pc.authenticated_mutations_blocked and pc.anon_blocked and pc.public_blocked
    and fc.functions_present and fc.all_security_definer and fc.search_path_ok
    and fc.public_execute_blocked and fc.anon_execute_blocked and fc.authenticated_execute_ok and tc.trigger_ok,
  'expected_snapshot_supplied', e.patients_before is not null and e.sessions_before is not null and e.session_economic_fingerprint_before is not null,
  'patients_after', d.patients_after, 'sessions_after', d.sessions_after,
  'session_prices_null_after', d.session_prices_null_after, 'session_prices_zero_after', d.session_prices_zero_after,
  'session_prices_positive_after', d.session_prices_positive_after, 'session_economic_fingerprint_after', d.session_economic_fingerprint_after,
  'payments_count', rc.payments_count, 'allocations_count', rc.allocations_count,
  'columns', cols.value, 'constraints', cons.value,
  'delete_actions', jsonb_build_object('auth_user_restrict', cc.auth_user_restrict_ok, 'patient_restrict', cc.patient_restrict_ok, 'allocation_payment_restrict', cc.allocation_payment_restrict_ok, 'allocation_session_restrict', cc.allocation_session_restrict_ok),
  'rls', rls.value, 'table_privileges', priv.value, 'functions', funcs.value,
  'trigger', trig.value, 'session_owner_key_validated', cc.session_owner_key_ok
))
from expected e cross join data_snapshot d cross join row_counts rc cross join columns_snapshot cols
cross join constraints_snapshot cons cross join constraint_checks cc cross join rls_snapshot rls cross join rls_checks rlc
cross join privileges_snapshot priv cross join privilege_checks pc cross join functions_snapshot funcs cross join function_checks fc
cross join trigger_snapshot trig cross join trigger_check tc;
