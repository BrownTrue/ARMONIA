-- Read-only production postflight for migration 021.
-- Fill the expected CTE only with values copied from the successful preflight.
with expected as (
  select 15::bigint as patients_before,
    '8b166de1e1a7f8b62fe42c35f71f1614'::text as patient_fingerprint_before
), snapshot as (
  select count(*) as patients_after,
    md5(coalesce(string_agg(jsonb_build_array(
      id, user_id, first_name, last_name, birth_date, phone, guardian_name,
      school, school_class, referral_reason, notes, status,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')
    )::text, ',' order by id), '')) as patient_fingerprint_after
  from public.patients
), detail_count as (
  select count(*) as records_after from public.patient_administrative_details
), expected_columns(column_name, udt_name, is_nullable, default_kind) as (
  values
    ('user_id', 'uuid', 'NO', null),
    ('patient_id', 'uuid', 'NO', null),
    ('patient_tax_code', 'text', 'YES', null),
    ('patient_address', 'text', 'YES', null),
    ('patient_postal_code', 'text', 'YES', null),
    ('patient_city', 'text', 'YES', null),
    ('patient_province', 'text', 'YES', null),
    ('patient_country', 'text', 'YES', null),
    ('billing_subject_type', 'text', 'NO', 'patient'),
    ('recipient_first_name', 'text', 'YES', null),
    ('recipient_last_name', 'text', 'YES', null),
    ('recipient_tax_code', 'text', 'YES', null),
    ('recipient_relationship', 'text', 'YES', null),
    ('recipient_address', 'text', 'YES', null),
    ('recipient_postal_code', 'text', 'YES', null),
    ('recipient_city', 'text', 'YES', null),
    ('recipient_province', 'text', 'YES', null),
    ('recipient_country', 'text', 'YES', null),
    ('administrative_email', 'text', 'YES', null),
    ('created_at', 'timestamptz', 'NO', 'now'),
    ('updated_at', 'timestamptz', 'NO', 'now')
), structure as (
  select
    (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'patient_administrative_details') = 21
      and not exists (
        select 1 from expected_columns e
        left join information_schema.columns c
          on c.table_schema = 'public' and c.table_name = 'patient_administrative_details' and c.column_name = e.column_name
        where c.column_name is null or c.udt_name <> e.udt_name or c.is_nullable <> e.is_nullable
          or (e.default_kind = 'patient' and coalesce(c.column_default, '') not like '%patient%')
          or (e.default_kind = 'now' and coalesce(c.column_default, '') <> 'now()')
          or (e.default_kind is null and c.column_default is not null)
      ) as columns_ok,
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'patient_administrative_details' and column_name = 'billing_subject_type' and is_nullable = 'NO' and column_default like '%patient%') as billing_default_ok,
    exists (select 1 from pg_constraint where conrelid = 'public.patient_administrative_details'::regclass and conname = 'patient_administrative_details_pkey' and contype = 'p' and convalidated and pg_get_constraintdef(oid, true) = 'PRIMARY KEY (user_id, patient_id)') as primary_key_ok,
    exists (
      select 1 from pg_constraint c
      where c.conrelid = 'public.patient_administrative_details'::regclass
        and c.conname = 'patient_administrative_details_patient_fk'
        and c.contype = 'f'
        and c.confrelid = 'public.patients'::regclass
        and c.conkey = array[
          (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'user_id' and not attisdropped),
          (select attnum from pg_attribute where attrelid = c.conrelid and attname = 'patient_id' and not attisdropped)
        ]::smallint[]
        and c.confkey = array[
          (select attnum from pg_attribute where attrelid = c.confrelid and attname = 'user_id' and not attisdropped),
          (select attnum from pg_attribute where attrelid = c.confrelid and attname = 'id' and not attisdropped)
        ]::smallint[]
        and c.confdeltype = 'c'
        and c.convalidated
    ) as owner_fk_cascade_ok,
    (select pg_get_constraintdef(oid, true) from pg_constraint where conrelid = 'public.patient_administrative_details'::regclass and conname = 'patient_administrative_details_patient_fk') as owner_fk_definition,
    exists (select 1 from pg_constraint where conrelid = 'public.patient_administrative_details'::regclass and conname = 'patient_administrative_details_billing_subject_check' and contype = 'c' and convalidated) as billing_check_ok,
    (select relrowsecurity from pg_class where oid = 'public.patient_administrative_details'::regclass) as rls_enabled,
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'patient_administrative_details' and roles = array['authenticated']::name[] and qual = '(user_id = auth.uid())') = 3 as own_using_policies_ok,
    (select count(*) from pg_policies where schemaname = 'public' and tablename = 'patient_administrative_details' and roles = array['authenticated']::name[] and with_check = '(user_id = auth.uid())') = 2 as own_check_policies_ok
), privileges as (
  select
    has_table_privilege('authenticated', 'public.patient_administrative_details', 'SELECT,INSERT,UPDATE,DELETE') as authenticated_crud,
    not has_table_privilege('authenticated', 'public.patient_administrative_details', 'TRUNCATE,REFERENCES,TRIGGER') as authenticated_extra_blocked,
    not has_table_privilege('anon', 'public.patient_administrative_details', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_blocked,
    not exists (select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl where c.oid = 'public.patient_administrative_details'::regclass and acl.grantee = 0) as public_blocked,
    jsonb_build_object(
      'public', (select coalesce(jsonb_agg(acl.privilege_type order by acl.privilege_type), '[]'::jsonb)
        from pg_class c cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
        where c.oid = 'public.patient_administrative_details'::regclass and acl.grantee = 0),
      'roles', (select jsonb_agg(jsonb_build_object(
        'role', role_name,
        'select', has_table_privilege(role_name, 'public.patient_administrative_details', 'SELECT'),
        'insert', has_table_privilege(role_name, 'public.patient_administrative_details', 'INSERT'),
        'update', has_table_privilege(role_name, 'public.patient_administrative_details', 'UPDATE'),
        'delete', has_table_privilege(role_name, 'public.patient_administrative_details', 'DELETE'),
        'truncate', has_table_privilege(role_name, 'public.patient_administrative_details', 'TRUNCATE'),
        'references', has_table_privilege(role_name, 'public.patient_administrative_details', 'REFERENCES'),
        'trigger', has_table_privilege(role_name, 'public.patient_administrative_details', 'TRIGGER')
      ) order by role_name) from (values ('anon'), ('authenticated'), ('service_role')) roles(role_name))
    ) as effective_privileges
)
select jsonb_build_object('021_postflight', jsonb_build_object(
  'pass', e.patients_before is not null and e.patient_fingerprint_before is not null
    and s.patients_after = e.patients_before and s.patient_fingerprint_after = e.patient_fingerprint_before
    and d.records_after = 0 and st.columns_ok and st.billing_default_ok and st.primary_key_ok
    and st.owner_fk_cascade_ok and st.billing_check_ok and st.rls_enabled
    and st.own_using_policies_ok and st.own_check_policies_ok
    and p.authenticated_crud and p.authenticated_extra_blocked and p.anon_blocked and p.public_blocked,
  'expected_snapshot_supplied', e.patients_before is not null and e.patient_fingerprint_before is not null,
  'patients_after', s.patients_after,
  'patient_fingerprint_after', s.patient_fingerprint_after,
  'records_after', d.records_after,
  'columns_ok', st.columns_ok,
  'billing_default_ok', st.billing_default_ok,
  'primary_key_ok', st.primary_key_ok,
  'owner_fk_cascade_ok', st.owner_fk_cascade_ok,
  'owner_fk_definition', st.owner_fk_definition,
  'billing_check_ok', st.billing_check_ok,
  'rls_enabled', st.rls_enabled,
  'own_using_policies_ok', st.own_using_policies_ok,
  'own_check_policies_ok', st.own_check_policies_ok,
  'authenticated_crud', p.authenticated_crud,
  'authenticated_extra_blocked', p.authenticated_extra_blocked,
  'anon_blocked', p.anon_blocked,
  'public_blocked', p.public_blocked,
  'effective_privileges', p.effective_privileges
)) from expected e cross join snapshot s cross join detail_count d cross join structure st cross join privileges p;
