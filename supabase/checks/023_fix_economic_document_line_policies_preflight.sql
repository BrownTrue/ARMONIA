-- Read-only production preflight for migration 023.
with expected as (
  select 2::bigint as profiles_count,18::bigint as patients_count,25::bigint as sessions_count,0::bigint as payments_count,2::bigint as appointment_services_count,
    'fdc9bcc751e669ced3cedbc39015008c'::text as profile_fingerprint,
    '619f71f47c276e8107783cb72decda07'::text as patient_fingerprint,
    '37ea164b941693ac8babdf629d179668'::text as session_fingerprint,
    'd41d8cd98f00b204e9800998ecf8427e'::text as payment_fingerprint,
    'ead875954b6de06113e59f18d3de265d'::text as appointment_service_fingerprint
), snapshot as (
  select
    (select count(*) from public.profiles) as profiles_count,(select count(*) from public.patients) as patients_count,(select count(*) from public.sessions) as sessions_count,(select count(*) from public.payments) as payments_count,(select count(*) from public.appointment_services) as appointment_services_count,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.profiles row_value),'')) as profile_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.patients row_value),'')) as patient_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.sessions row_value),'')) as session_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.payments row_value),'')) as payment_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.appointment_services row_value),'')) as appointment_service_fingerprint,
    (select count(*) from public.professional_document_details) as professional_details_count,(select count(*) from public.economic_documents) as documents_count,(select count(*) from public.economic_document_lines) as lines_count,(select count(*) from public.economic_document_sequences) as sequences_count
), line_policies as (
  select policyname,cmd,roles,permissive,
    regexp_replace(lower(coalesce(qual,'')),'[[:space:]()]','','g') as normalized_qual,
    regexp_replace(lower(coalesce(with_check,'')),'[[:space:]()]','','g') as normalized_with_check
  from pg_policies where schemaname='public' and tablename='economic_document_lines'
), policy_state as (
  select
    exists (select 1 from line_policies where policyname='economic document lines select own' and cmd='SELECT' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('user_id=auth.uid' in normalized_qual)>0) as select_policy_ok,
    exists (select 1 from line_policies where policyname='economic document lines insert draft own' and cmd='INSERT' and roles=array['authenticated']::name[] and position('d.patient_id=d.patient_id' in normalized_with_check)>0) as insert_bug_present,
    exists (select 1 from line_policies where policyname='economic document lines update draft own' and cmd='UPDATE' and roles=array['authenticated']::name[] and position('d.patient_id=d.patient_id' in normalized_qual)>0 and position('d.patient_id=d.patient_id' in normalized_with_check)>0) as update_bug_present,
    exists (select 1 from line_policies where policyname='economic document lines delete draft own' and cmd='DELETE' and roles=array['authenticated']::name[] and position('d.patient_id=d.patient_id' in normalized_qual)>0) as delete_bug_present,
    (select count(*) from line_policies)=4 as exactly_four_line_policies
), foundation as (
  select
    current_setting('server_version_num')::integer>=170000 as postgres_version_ok,
    to_regclass('public.professional_document_details') is not null and to_regclass('public.economic_documents') is not null and to_regclass('public.economic_document_lines') is not null and to_regclass('public.economic_document_sequences') is not null as tables_present,
    exists (select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid where t.tgrelid='public.economic_document_lines'::regclass and t.tgname='economic_document_lines_identity_guard' and not t.tgisinternal and t.tgenabled='O' and t.tgtype=19 and p.oid='public.enforce_economic_document_line_identity()'::regprocedure and not p.prosecdef) as identity_trigger_ok,
    exists (
      select 1 from pg_constraint c
      where c.conrelid='public.economic_document_lines'::regclass and c.conname='economic_document_lines_document_fk' and c.contype='f' and c.confrelid='public.economic_documents'::regclass and c.confdeltype='c' and c.convalidated
        and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','patient_id','document_id']::name[]
        and (select array_agg(a.attname order by key_position) from unnest(c.confkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=key.attnum)=array['user_id','patient_id','id']::name[]
    ) as composite_document_fk_ok
), unchanged as (
  select s.profiles_count=e.profiles_count and s.patients_count=e.patients_count and s.sessions_count=e.sessions_count and s.payments_count=e.payments_count and s.appointment_services_count=e.appointment_services_count
    and s.profile_fingerprint=e.profile_fingerprint and s.patient_fingerprint=e.patient_fingerprint and s.session_fingerprint=e.session_fingerprint and s.payment_fingerprint=e.payment_fingerprint and s.appointment_service_fingerprint=e.appointment_service_fingerprint as preexisting_data_unchanged
  from snapshot s cross join expected e
)
select jsonb_build_object('023_preflight',jsonb_build_object(
  'ready',f.postgres_version_ok and f.tables_present and f.identity_trigger_ok and f.composite_document_fk_ok and p.select_policy_ok and p.insert_bug_present and p.update_bug_present and p.delete_bug_present and p.exactly_four_line_policies and u.preexisting_data_unchanged and s.professional_details_count=0 and s.documents_count=0 and s.lines_count=0 and s.sequences_count=0,
  'server_version_num',current_setting('server_version_num')::integer,
  'tables_present',f.tables_present,'identity_trigger_ok',f.identity_trigger_ok,'composite_document_fk_ok',f.composite_document_fk_ok,
  'select_policy_ok',p.select_policy_ok,'insert_bug_present',p.insert_bug_present,'update_bug_present',p.update_bug_present,'delete_bug_present',p.delete_bug_present,'exactly_four_line_policies',p.exactly_four_line_policies,
  'preexisting_data_unchanged',u.preexisting_data_unchanged,
  'profiles_count',s.profiles_count,'patients_count',s.patients_count,'sessions_count',s.sessions_count,'payments_count',s.payments_count,'appointment_services_count',s.appointment_services_count,
  'profile_fingerprint',s.profile_fingerprint,'patient_fingerprint',s.patient_fingerprint,'session_fingerprint',s.session_fingerprint,'payment_fingerprint',s.payment_fingerprint,'appointment_service_fingerprint',s.appointment_service_fingerprint,
  'professional_details_count',s.professional_details_count,'documents_count',s.documents_count,'lines_count',s.lines_count,'sequences_count',s.sequences_count
)) from foundation f cross join policy_state p cross join unchanged u cross join snapshot s;
