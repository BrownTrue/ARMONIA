-- Read-only production preflight for migration 021.
with snapshot as (
  select count(*) as patients_before,
    md5(coalesce(string_agg(jsonb_build_array(
      id, user_id, first_name, last_name, birth_date, phone, guardian_name,
      school, school_class, referral_reason, notes, status,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US')
    )::text, ',' order by id), '')) as patient_fingerprint
  from public.patients
), prerequisites as (
  select
    to_regclass('public.patient_administrative_details') is null as table_absent,
    exists (select 1 from pg_constraint where conrelid = 'public.patients'::regclass and conname = 'patients_user_id_id_key' and contype = 'u' and convalidated) as patient_owner_key_ok,
    (select relrowsecurity from pg_class where oid = 'public.patients'::regclass) as patients_rls_enabled,
    to_regclass('public.patient_administrative_details_pkey') is null as pkey_index_name_collision_absent,
    not exists (select 1 from pg_constraint where conname in ('patient_administrative_details_pkey', 'patient_administrative_details_patient_fk', 'patient_administrative_details_billing_subject_check')) as constraint_names_free,
    not exists (select 1 from pg_policies where schemaname = 'public' and policyname like 'patient administrative details %') as policy_names_free
), security as (
  select jsonb_build_object(
    'patients_acl', (select relacl from pg_class where oid = 'public.patients'::regclass),
    'patients_policies', coalesce((select jsonb_agg(to_jsonb(p) order by policyname) from pg_policies p where schemaname = 'public' and tablename = 'patients'), '[]'::jsonb),
    'default_privileges', coalesce((select jsonb_agg(jsonb_build_object('owner', r.rolname, 'schema', coalesce(n.nspname, 'ALL'), 'object_type', d.defaclobjtype, 'acl', d.defaclacl)) from pg_default_acl d join pg_roles r on r.oid = d.defaclrole left join pg_namespace n on n.oid = d.defaclnamespace where d.defaclnamespace = 0 or n.nspname = 'public'), '[]'::jsonb)
  ) as value
)
select jsonb_build_object('021_preflight', jsonb_build_object(
  'ready', p.table_absent and p.patient_owner_key_ok and p.patients_rls_enabled and p.pkey_index_name_collision_absent and p.constraint_names_free and p.policy_names_free,
  'server_version_num', current_setting('server_version_num')::integer,
  'version', version(),
  'patients_before', s.patients_before,
  'patient_fingerprint', s.patient_fingerprint,
  'table_absent', p.table_absent,
  'patient_owner_key_ok', p.patient_owner_key_ok,
  'patients_rls_enabled', p.patients_rls_enabled,
  'pkey_index_name_collision_absent', p.pkey_index_name_collision_absent,
  'constraint_names_free', p.constraint_names_free,
  'policy_names_free', p.policy_names_free,
  'security', sec.value
)) from snapshot s cross join prerequisites p cross join security sec;
