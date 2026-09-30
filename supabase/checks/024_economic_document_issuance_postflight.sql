-- READ-ONLY postflight for migration 024. Fill expected from the real preflight before running.
with expected as (
  select
    2::bigint as profiles_count,
    18::bigint as patients_count,
    25::bigint as sessions_count,
    0::bigint as payments_count,
    0::bigint as documents_count,
    0::bigint as lines_count,
    0::bigint as sequences_count,
    'd41d8cd98f00b204e9800998ecf8427e'::text as documents_fingerprint,
    'd41d8cd98f00b204e9800998ecf8427e'::text as lines_fingerprint,
    'd41d8cd98f00b204e9800998ecf8427e'::text as sequences_fingerprint
), actual as (
  select
    (select count(*) from public.profiles) as profiles_count,
    (select count(*) from public.patients) as patients_count,
    (select count(*) from public.sessions) as sessions_count,
    (select count(*) from public.payments) as payments_count,
    (select count(*) from public.economic_documents) as documents_count,
    (select count(*) from public.economic_document_lines) as lines_count,
    (select count(*) from public.economic_document_sequences) as sequences_count,
    (select count(*) from public.economic_document_issuance_attempts) as attempts_count,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.id),'')) from (select * from public.economic_documents) x) as documents_fingerprint,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.id),'')) from (select * from public.economic_document_lines) x) as lines_fingerprint,
    (select md5(coalesce(string_agg(row_to_json(x)::text,'|' order by x.user_id,x.document_type,x.year),'')) from (select * from public.economic_document_sequences) x) as sequences_fingerprint
), checks as (
  select
    to_regclass('public.economic_document_issuance_attempts') is not null as attempts_present,
    (select relrowsecurity from pg_class where oid='public.economic_document_issuance_attempts'::regclass) as attempts_rls,
    not has_table_privilege('anon','public.economic_document_issuance_attempts','SELECT')
      and not has_table_privilege('anon','public.economic_document_issuance_attempts','INSERT')
      and not has_table_privilege('anon','public.economic_document_issuance_attempts','UPDATE')
      and not has_table_privilege('anon','public.economic_document_issuance_attempts','DELETE')
      and not has_table_privilege('authenticated','public.economic_document_issuance_attempts','SELECT')
      and not has_table_privilege('authenticated','public.economic_document_issuance_attempts','INSERT')
      and not has_table_privilege('authenticated','public.economic_document_issuance_attempts','UPDATE')
      and not has_table_privilege('authenticated','public.economic_document_issuance_attempts','DELETE') as browser_blocked,
    exists (select 1 from pg_indexes where schemaname='public' and indexname='economic_document_issuance_attempts_one_active_idx' and indexdef like '%WHERE (status = ANY%') as one_active_index,
    exists (select 1 from pg_constraint where conname='economic_document_issuance_attempts_document_fk' and convalidated) as owner_safe_fk,
    exists (select 1 from pg_constraint where conrelid='public.economic_document_issuance_attempts'::regclass
      and conname='economic_document_issuance_attempts_status_check' and contype='c' and convalidated)
      and exists (select 1 from pg_constraint where conrelid='public.economic_document_issuance_attempts'::regclass
      and conname='economic_document_issuance_attempts_status_invariants_check' and contype='c' and convalidated) as status_constraints_ok,
    (select count(distinct p.proname)=7 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in (
      'economic_document_has_active_issuance','reserve_economic_document_issuance','mark_economic_document_issuance_uploaded',
      'finalize_economic_document_issuance','record_economic_document_issuance_error','abandon_economic_document_issuance','void_economic_document')) as functions_present,
    (select count(distinct p.proname)=7 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in (
        'economic_document_has_active_issuance','reserve_economic_document_issuance','mark_economic_document_issuance_uploaded',
        'finalize_economic_document_issuance','record_economic_document_issuance_error','abandon_economic_document_issuance','void_economic_document')
      and p.prosecdef and p.proconfig @> array['search_path=pg_catalog, public']::text[]) as functions_hardened,
    not exists (
      select 1 from information_schema.routine_privileges rp
      where rp.specific_schema='public' and rp.routine_name in (
        'reserve_economic_document_issuance','mark_economic_document_issuance_uploaded','finalize_economic_document_issuance',
        'record_economic_document_issuance_error','abandon_economic_document_issuance','void_economic_document')
        and rp.grantee in ('PUBLIC','anon','authenticated')
    ) as mutation_rpcs_server_only,
    exists (select 1 from storage.buckets where id='economic-documents' and public=false and file_size_limit=10485760
      and allowed_mime_types @> array['application/pdf','image/webp']::text[]) as private_bucket_ok,
    not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
      and (coalesce(qual,'')||coalesce(with_check,'')) like '%economic-documents%') as no_browser_storage_policy,
    (select count(*)=4 from pg_policies where schemaname='public' and tablename='economic_document_lines') as foundation_line_policies_present,
    (select count(*)=3 from pg_policies where schemaname='public' and tablename='economic_document_lines'
      and policyname in ('economic document lines insert draft own','economic document lines update draft own','economic document lines delete draft own')
      and lower(coalesce(qual,'')||' '||coalesce(with_check,'')) like '%economic_document_lines.patient_id%'
      and lower(coalesce(qual,'')||' '||coalesce(with_check,'')) not like '%d.patient_id = d.patient_id%') as corrected_line_policies_preserved,
    exists (select 1 from pg_policies where schemaname='public' and tablename='economic_documents' and policyname='economic documents update draft own' and coalesce(qual,'') like '%economic_document_has_active_issuance%')
      and exists (select 1 from pg_policies where schemaname='public' and tablename='economic_documents' and policyname='economic documents delete draft own' and coalesce(qual,'') like '%economic_document_has_active_issuance%') as draft_guard_present
), unchanged as (
  select expected.profiles_count=actual.profiles_count and expected.patients_count=actual.patients_count
    and expected.sessions_count=actual.sessions_count and expected.payments_count=actual.payments_count
    and expected.documents_count=actual.documents_count and expected.lines_count=actual.lines_count
    and expected.sequences_count=actual.sequences_count and expected.documents_fingerprint=actual.documents_fingerprint
    and expected.lines_fingerprint=actual.lines_fingerprint and expected.sequences_fingerprint=actual.sequences_fingerprint as preexisting_data_unchanged
  from expected cross join actual
)
select jsonb_build_object(
  'pass', coalesce(attempts_present and attempts_rls and browser_blocked and one_active_index and owner_safe_fk and status_constraints_ok and functions_present and functions_hardened
    and mutation_rpcs_server_only and private_bucket_ok and no_browser_storage_policy and foundation_line_policies_present and corrected_line_policies_preserved
    and draft_guard_present and preexisting_data_unchanged and actual.attempts_count=0, false),
  'checks', to_jsonb(checks)||to_jsonb(unchanged),
  'actual', to_jsonb(actual)
)
from checks cross join unchanged cross join actual;
