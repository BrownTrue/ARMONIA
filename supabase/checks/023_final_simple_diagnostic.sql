-- Read-only final diagnostic for the E3A foundation after migrations 022 and 023.
with expected as (
  select
    2::bigint as profiles_count,
    18::bigint as patients_count,
    25::bigint as sessions_count,
    0::bigint as payments_count,
    2::bigint as appointment_services_count,
    'fdc9bcc751e669ced3cedbc39015008c'::text as profile_fingerprint,
    '619f71f47c276e8107783cb72decda07'::text as patient_fingerprint,
    '37ea164b941693ac8babdf629d179668'::text as session_fingerprint,
    'd41d8cd98f00b204e9800998ecf8427e'::text as payment_fingerprint,
    'ead875954b6de06113e59f18d3de265d'::text as appointment_service_fingerprint
), snapshot as (
  select
    (select count(*) from public.profiles) as profiles_count,
    (select count(*) from public.patients) as patients_count,
    (select count(*) from public.sessions) as sessions_count,
    (select count(*) from public.payments) as payments_count,
    (select count(*) from public.appointment_services) as appointment_services_count,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.profiles row_value),'')) as profile_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.patients row_value),'')) as patient_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.sessions row_value),'')) as session_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.payments row_value),'')) as payment_fingerprint,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text,',' order by id) from public.appointment_services row_value),'')) as appointment_service_fingerprint,
    (select count(*) from public.professional_document_details) as professional_details_count,
    (select count(*) from public.economic_documents) as documents_count,
    (select count(*) from public.economic_document_lines) as lines_count,
    (select count(*) from public.economic_document_sequences) as sequences_count
), actual_line_policies as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'policyname',policyname,
    'cmd',cmd,
    'roles',roles,
    'qual',qual,
    'with_check',with_check
  ) order by policyname),'[]'::jsonb) as value
  from pg_policies
  where schemaname='public' and tablename='economic_document_lines'
), actual_foundation_checks as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'table_name',t.relname,
    'constraint_name',c.conname,
    'validated',c.convalidated,
    'definition',pg_get_constraintdef(c.oid,true)
  ) order by t.relname,c.conname),'[]'::jsonb) as value
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public'
    and t.relname in ('economic_documents','economic_document_lines','economic_document_sequences')
    and c.contype='c'
), role_privileges as (
  select table_name,role_name,privilege,
    has_table_privilege(role_name,format('public.%I',table_name),privilege) as allowed
  from unnest(array['professional_document_details','economic_documents','economic_document_lines','economic_document_sequences']) table_name
  cross join unnest(array['anon','authenticated']) role_name
  cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege
), structural_guards as (
  select
    (select count(*)=4 from pg_policies where schemaname='public' and tablename='economic_document_lines') as exactly_four_line_policies,
    exists (
      select 1
      from pg_trigger t
      join pg_proc p on p.oid=t.tgfoid
      where t.tgrelid='public.economic_document_lines'::regclass
        and t.tgname='economic_document_lines_identity_guard'
        and not t.tgisinternal
        and t.tgenabled='O'
        and t.tgtype=19
        and p.oid='public.enforce_economic_document_line_identity()'::regprocedure
        and not p.prosecdef
    ) as identity_trigger_ok,
    exists (
      select 1
      from pg_constraint c
      where c.conrelid='public.economic_document_lines'::regclass
        and c.conname='economic_document_lines_document_fk'
        and c.contype='f'
        and c.confrelid='public.economic_documents'::regclass
        and c.confdeltype='c'
        and c.convalidated
        and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','patient_id','document_id']::name[]
        and (select array_agg(a.attname order by key_position) from unnest(c.confkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=key.attnum)=array['user_id','patient_id','id']::name[]
    ) as composite_document_fk_ok,
    (select bool_and(relrowsecurity) from pg_class where oid in (
      'public.professional_document_details'::regclass,
      'public.economic_documents'::regclass,
      'public.economic_document_lines'::regclass,
      'public.economic_document_sequences'::regclass
    )) as rls_enabled,
    not exists (select 1 from role_privileges where role_name='anon' and allowed) as anon_blocked,
    not exists (
      select 1
      from pg_class c
      cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl
      where c.oid in (
        'public.professional_document_details'::regclass,
        'public.economic_documents'::regclass,
        'public.economic_document_lines'::regclass,
        'public.economic_document_sequences'::regclass
      ) and acl.grantee=0
    ) as public_blocked,
    not exists (
      select 1
      from role_privileges
      where role_name='authenticated'
        and allowed<>(table_name<>'economic_document_sequences' and privilege in ('SELECT','INSERT','UPDATE','DELETE'))
    ) as authenticated_exact
), data_guards as (
  select
    s.professional_details_count=0 and s.documents_count=0 and s.lines_count=0 and s.sequences_count=0 as all_new_tables_empty,
    s.profiles_count=e.profiles_count
      and s.patients_count=e.patients_count
      and s.sessions_count=e.sessions_count
      and s.payments_count=e.payments_count
      and s.appointment_services_count=e.appointment_services_count
      and s.profile_fingerprint=e.profile_fingerprint
      and s.patient_fingerprint=e.patient_fingerprint
      and s.session_fingerprint=e.session_fingerprint
      and s.payment_fingerprint=e.payment_fingerprint
      and s.appointment_service_fingerprint=e.appointment_service_fingerprint as preexisting_data_unchanged
  from snapshot s cross join expected e
)
select jsonb_build_object(
  'actual_line_policies',p.value,
  'actual_foundation_checks',c.value,
  'structural_guards',jsonb_build_object(
    'exactly_four_line_policies',g.exactly_four_line_policies,
    'identity_trigger_ok',g.identity_trigger_ok,
    'composite_document_fk_ok',g.composite_document_fk_ok,
    'rls_enabled',g.rls_enabled,
    'anon_blocked',g.anon_blocked,
    'public_blocked',g.public_blocked,
    'authenticated_exact',g.authenticated_exact,
    'all_new_tables_empty',d.all_new_tables_empty,
    'preexisting_data_unchanged',d.preexisting_data_unchanged
  )
)
from actual_line_policies p
cross join actual_foundation_checks c
cross join structural_guards g
cross join data_guards d;
