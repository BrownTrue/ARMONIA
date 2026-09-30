-- Read-only production preflight for migration 022. Do not run migrations from this file.
with snapshot as (
  select
    (select count(*) from public.profiles) as profiles_before,
    (select count(*) from public.patients) as patients_before,
    (select count(*) from public.sessions) as sessions_before,
    (select count(*) from public.payments) as payments_before,
    (select count(*) from public.appointment_services) as appointment_services_before,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.profiles row_value), '')) as profile_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.patients row_value), '')) as patient_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.sessions row_value), '')) as session_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.payments row_value), '')) as payment_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.appointment_services row_value), '')) as appointment_service_fingerprint
), owner_keys as (
  select
    exists (select 1 from pg_constraint c join pg_index i on i.indexrelid=c.conindid where c.conrelid='public.patients'::regclass and c.contype='u' and c.convalidated and i.indisvalid and i.indisready and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','id']::name[]) as patient_owner_key_ok,
    exists (select 1 from pg_constraint c join pg_index i on i.indexrelid=c.conindid where c.conrelid='public.sessions'::regclass and c.contype='u' and c.convalidated and i.indisvalid and i.indisready and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','patient_id','id']::name[]) as session_owner_patient_key_ok,
    exists (select 1 from pg_constraint c join pg_index i on i.indexrelid=c.conindid where c.conrelid='public.appointment_services'::regclass and c.contype='u' and c.convalidated and i.indisvalid and i.indisready and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','id']::name[]) as service_owner_key_ok
), collisions as (
  select
    not exists (select 1 from pg_constraint where conname in ('professional_document_details_pkey','economic_documents_pkey','economic_documents_user_patient_fk','economic_documents_user_patient_id_key','economic_documents_sequence_check','economic_documents_year_check','economic_documents_number_format_check','economic_documents_status_invariants_check','economic_document_lines_pkey','economic_document_lines_document_fk','economic_document_lines_session_fk','economic_document_lines_service_fk','economic_document_lines_document_position_key','economic_document_sequences_pkey')) as constraint_names_free,
    not exists (select 1 from pg_class where relkind='i' and relname in ('professional_document_details_pkey','economic_documents_pkey','economic_documents_user_patient_id_key','economic_document_lines_pkey','economic_document_lines_document_position_key','economic_document_sequences_pkey','economic_documents_issued_sequence_unique_idx','economic_documents_document_number_unique_idx','economic_documents_user_patient_status_created_idx','economic_document_lines_session_per_document_unique_idx','economic_document_lines_user_patient_session_idx')) as index_names_free,
    to_regprocedure('public.enforce_economic_document_line_identity()') is null as function_name_free,
    not exists (select 1 from pg_trigger where not tgisinternal and tgname='economic_document_lines_identity_guard') as trigger_name_free,
    not exists (select 1 from pg_policies where schemaname='public' and policyname in ('professional document details select own','professional document details insert own','professional document details update own','professional document details delete own','economic documents select own','economic documents insert draft own','economic documents update draft own','economic documents delete draft own','economic document lines select own','economic document lines insert draft own','economic document lines update draft own','economic document lines delete draft own')) as policy_names_free
), prerequisites as (
  select current_setting('server_version_num')::integer>=170000 as postgres_version_ok,
    to_regclass('public.professional_document_details') is null as professional_details_absent,
    to_regclass('public.economic_documents') is null as documents_absent,
    to_regclass('public.economic_document_lines') is null as lines_absent,
    to_regclass('public.economic_document_sequences') is null as sequences_absent,
    (select relrowsecurity from pg_class where oid='public.patients'::regclass) as patients_rls_enabled,
    (select relrowsecurity from pg_class where oid='public.sessions'::regclass) as sessions_rls_enabled
), security as (
  select jsonb_build_object('acl',jsonb_build_object('profiles',(select relacl from pg_class where oid='public.profiles'::regclass),'patients',(select relacl from pg_class where oid='public.patients'::regclass),'sessions',(select relacl from pg_class where oid='public.sessions'::regclass),'payments',(select relacl from pg_class where oid='public.payments'::regclass),'appointment_services',(select relacl from pg_class where oid='public.appointment_services'::regclass)),'default_privileges',coalesce((select jsonb_agg(jsonb_build_object('owner',r.rolname,'schema',coalesce(n.nspname,'ALL'),'object_type',d.defaclobjtype,'acl',d.defaclacl)) from pg_default_acl d join pg_roles r on r.oid=d.defaclrole left join pg_namespace n on n.oid=d.defaclnamespace where d.defaclnamespace=0 or n.nspname='public'),'[]'::jsonb)) as value
)
select jsonb_build_object('022_preflight',jsonb_build_object(
  'ready',p.postgres_version_ok and p.professional_details_absent and p.documents_absent and p.lines_absent and p.sequences_absent and o.patient_owner_key_ok and o.session_owner_patient_key_ok and o.service_owner_key_ok and p.patients_rls_enabled and p.sessions_rls_enabled and c.constraint_names_free and c.index_names_free and c.function_name_free and c.trigger_name_free and c.policy_names_free,
  'server_version_num',current_setting('server_version_num')::integer,
  'profiles_before',s.profiles_before,'patients_before',s.patients_before,'sessions_before',s.sessions_before,'payments_before',s.payments_before,'appointment_services_before',s.appointment_services_before,
  'profile_fingerprint',s.profile_fingerprint,'patient_fingerprint',s.patient_fingerprint,'session_fingerprint',s.session_fingerprint,'payment_fingerprint',s.payment_fingerprint,'appointment_service_fingerprint',s.appointment_service_fingerprint,
  'postgres_version_ok',p.postgres_version_ok,'professional_details_absent',p.professional_details_absent,'documents_absent',p.documents_absent,'lines_absent',p.lines_absent,'sequences_absent',p.sequences_absent,
  'patient_owner_key_ok',o.patient_owner_key_ok,'session_owner_patient_key_ok',o.session_owner_patient_key_ok,'service_owner_key_ok',o.service_owner_key_ok,'patients_rls_enabled',p.patients_rls_enabled,'sessions_rls_enabled',p.sessions_rls_enabled,
  'constraint_names_free',c.constraint_names_free,'index_names_free',c.index_names_free,'function_name_free',c.function_name_free,'trigger_name_free',c.trigger_name_free,'policy_names_free',c.policy_names_free,'security',sec.value
)) from snapshot s cross join owner_keys o cross join collisions c cross join prerequisites p cross join security sec;
