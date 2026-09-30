-- READ-ONLY preflight for migration 024. Run manually before applying the migration.
with snapshot as (
  select
    (select count(*) from public.profiles) as profiles_count,
    (select count(*) from public.patients) as patients_count,
    (select count(*) from public.sessions) as sessions_count,
    (select count(*) from public.payments) as payments_count,
    (select count(*) from public.economic_documents) as documents_count,
    (select count(*) from public.economic_document_lines) as lines_count,
    (select count(*) from public.economic_document_sequences) as sequences_count,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.id),'')) from (select * from public.economic_documents) x) as documents_fingerprint,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.id),'')) from (select * from public.economic_document_lines) x) as lines_fingerprint,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.user_id,x.document_type,x.year),'')) from (select * from public.economic_document_sequences) x) as sequences_fingerprint
), checks as (
  select
    current_setting('server_version_num')::integer >= 150000 as supported_postgres,
    to_regclass('public.economic_documents') is not null
      and to_regclass('public.economic_document_lines') is not null
      and to_regclass('public.economic_document_sequences') is not null as foundation_present,
    to_regclass('public.economic_document_issuance_attempts') is null as attempts_absent,
    not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (
      'economic_document_has_active_issuance','reserve_economic_document_issuance','mark_economic_document_issuance_uploaded',
      'finalize_economic_document_issuance','record_economic_document_issuance_error','abandon_economic_document_issuance','void_economic_document')) as functions_absent,
    not exists (select 1 from storage.buckets where id='economic-documents') as bucket_absent,
    not exists (select 1 from pg_constraint where conname in (
      'economic_document_issuance_attempts_pkey','economic_document_issuance_attempts_document_fk',
      'economic_document_issuance_attempts_document_type_check','economic_document_issuance_attempts_number_year_check',
      'economic_document_issuance_attempts_sequence_number_check',
      'economic_document_issuance_attempts_number_format_check','economic_document_issuance_attempts_pdf_path_check',
      'economic_document_issuance_attempts_logo_path_check','economic_document_issuance_attempts_pdf_metadata_check',
      'economic_document_issuance_attempts_logo_metadata_check','economic_document_issuance_attempts_error_code_check',
      'economic_document_issuance_attempts_status_check','economic_document_issuance_attempts_status_invariants_check',
      'economic_document_issuance_attempts_user_sequence_key',
      'economic_document_issuance_attempts_user_number_key')) as constraint_names_free,
    not exists (select 1 from pg_class where relname in (
      'economic_document_issuance_attempts_pkey','economic_document_issuance_attempts_user_sequence_key',
      'economic_document_issuance_attempts_user_number_key','economic_document_issuance_attempts_one_active_idx',
      'economic_document_issuance_attempts_user_status_created_idx')) as index_names_free,
    (select count(*)=4 from pg_policies where schemaname='public' and tablename='economic_document_lines') as four_line_policies,
    (select count(*)=3 from pg_policies where schemaname='public' and tablename='economic_document_lines'
      and policyname in ('economic document lines insert draft own','economic document lines update draft own','economic document lines delete draft own')
      and lower(coalesce(qual,'')||' '||coalesce(with_check,'')) like '%economic_document_lines.patient_id%'
      and lower(coalesce(qual,'')||' '||coalesce(with_check,'')) not like '%d.patient_id = d.patient_id%') as corrected_line_policies,
    exists (select 1 from pg_policies where schemaname='public' and tablename='economic_documents' and policyname='economic documents update draft own' and coalesce(qual,'') like '%status = ''draft''%')
      and exists (select 1 from pg_policies where schemaname='public' and tablename='economic_documents' and policyname='economic documents delete draft own' and coalesce(qual,'') like '%status = ''draft''%') as draft_policies_expected,
    exists (select 1 from pg_constraint where conname='economic_documents_user_patient_id_key' and convalidated) as owner_safe_document_key,
    exists (select 1 from pg_constraint where conname='economic_document_lines_document_fk' and convalidated)
      and exists (select 1 from pg_constraint where conname='economic_document_lines_session_fk' and convalidated) as owner_safe_line_keys,
    exists (select 1 from pg_constraint where conname='economic_document_sequences_pkey' and convalidated) as sequence_foundation_ok
)
select jsonb_build_object(
  'ready', supported_postgres and foundation_present and attempts_absent and functions_absent and bucket_absent
    and constraint_names_free and index_names_free and four_line_policies and corrected_line_policies and draft_policies_expected
    and owner_safe_document_key and owner_safe_line_keys and sequence_foundation_ok,
  'server_version_num', current_setting('server_version_num')::integer,
  'checks', to_jsonb(checks),
  'snapshot', to_jsonb(snapshot)
)
from checks cross join snapshot;
