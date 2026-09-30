-- Read-only production postflight for migration 023.
-- Historical strict checker: it may report false negatives for catalog expression formatting.
-- Use 023_final_simple_diagnostic.sql as the authoritative final E3A verification.
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
    exists (select 1 from line_policies where policyname='economic document lines select own' and cmd='SELECT' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('user_id=auth.uid' in normalized_qual)>0) as line_select_policy_ok,
    exists (select 1 from line_policies where policyname='economic document lines insert draft own' and cmd='INSERT' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_with_check)>0 and position('d.id=economic_document_lines.document_id' in normalized_with_check)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_with_check)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check)>0 and position('d.status=''draft''::text' in normalized_with_check)>0) as line_insert_policy_ok,
    exists (select 1 from line_policies where policyname='economic document lines update draft own' and cmd='UPDATE' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_qual)>0 and position('d.id=economic_document_lines.document_id' in normalized_qual)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_qual)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual)>0 and position('d.status=''draft''::text' in normalized_qual)>0) as line_update_using_ok,
    exists (select 1 from line_policies where policyname='economic document lines update draft own' and cmd='UPDATE' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_with_check)>0 and position('d.id=economic_document_lines.document_id' in normalized_with_check)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_with_check)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check)>0 and position('d.status=''draft''::text' in normalized_with_check)>0) as line_update_with_check_ok,
    exists (select 1 from line_policies where policyname='economic document lines delete draft own' and cmd='DELETE' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_qual)>0 and position('d.id=economic_document_lines.document_id' in normalized_qual)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_qual)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual)>0 and position('d.status=''draft''::text' in normalized_qual)>0) as line_delete_policy_ok,
    not exists (select 1 from line_policies where position('d.patient_id=d.patient_id' in normalized_qual)>0 or position('d.patient_id=d.patient_id' in normalized_with_check)>0) as tautology_absent,
    (select count(*) from line_policies)=4 as exactly_four_line_policies
), expected_checks(table_name,constraint_name,required_fragments) as (
  values
    ('economic_documents','economic_documents_document_type_check',string_to_array($check$document_type='proforma'::text$check$,'|')),
    ('economic_documents','economic_documents_status_check',string_to_array($check$status=anyarray|'draft'::text|'issued'::text|'voided'::text$check$,'|')),
    ('economic_documents','economic_documents_professional_snapshot_check',string_to_array($check$jsonb_typeofprofessional_snapshot='object'::text$check$,'|')),
    ('economic_documents','economic_documents_recipient_snapshot_check',string_to_array($check$jsonb_typeofrecipient_snapshot='object'::text$check$,'|')),
    ('economic_documents','economic_documents_subtotal_cents_check',string_to_array($check$subtotal_cents>=0$check$,'|')),
    ('economic_documents','economic_documents_total_cents_check',string_to_array($check$total_cents>=0$check$,'|')),
    ('economic_documents','economic_documents_currency_code_check',string_to_array($check$currency_code~'^[a-z]{3}$'::text$check$,'|')),
    ('economic_documents','economic_documents_render_template_version_check',string_to_array($check$render_template_version>0$check$,'|')),
    ('economic_documents','economic_documents_sequence_check',string_to_array($check$sequence_numberisnull|sequence_number>0$check$,'|')),
    ('economic_documents','economic_documents_year_check',string_to_array($check$number_yearisnull|number_year>=2000|number_year<=9999$check$,'|')),
    ('economic_documents','economic_documents_number_format_check',string_to_array($check$document_numberisnull|document_number=format|'pf-%s-%s'::text|number_year|sequence_number$check$,'|')),
    ('economic_documents','economic_documents_status_invariants_check',string_to_array($check$status='draft'::text|status='issued'::text|status='voided'::text|issued_atisnotnull|voided_atisnotnull$check$,'|')),
    ('economic_document_lines','economic_document_lines_quantity_check',string_to_array($check$quantity>0$check$,'|')),
    ('economic_document_lines','economic_document_lines_unit_amount_cents_check',string_to_array($check$unit_amount_cents>=0$check$,'|')),
    ('economic_document_lines','economic_document_lines_line_total_cents_check',string_to_array($check$line_total_cents>=0|line_total_cents::bigint=quantity::bigint*unit_amount_cents::bigint$check$,'|')),
    ('economic_document_lines','economic_document_lines_position_check',string_to_array($check$position>0$check$,'|')),
    ('economic_document_sequences','economic_document_sequences_document_type_check',string_to_array($check$document_type='proforma'::text$check$,'|')),
    ('economic_document_sequences','economic_document_sequences_year_check',string_to_array($check$year>=2000|year<=9999$check$,'|')),
    ('economic_document_sequences','economic_document_sequences_last_number_check',string_to_array($check$last_number>=0$check$,'|'))
), check_state as (
  select not exists (
    select 1 from expected_checks e where not exists (
      select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
      cross join lateral (
        select regexp_replace(lower(pg_get_expr(c.conbin,c.conrelid,true)),'[[:space:]()"]','','g')::text as normalized_expression
      ) actual
      where n.nspname='public' and t.relname=e.table_name and c.conname=e.constraint_name and c.contype='c' and c.convalidated
        and not exists (
          select 1 from unnest(e.required_fragments) as required(fragment)
          where strpos(actual.normalized_expression,required.fragment)=0
        )
    )
  ) as all_foundation_checks_ok
), foundation as (
  select
    exists (select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid where t.tgrelid='public.economic_document_lines'::regclass and t.tgname='economic_document_lines_identity_guard' and not t.tgisinternal and t.tgenabled='O' and t.tgtype=19 and p.oid='public.enforce_economic_document_line_identity()'::regprocedure and not p.prosecdef and position('new.user_id is distinct from old.user_id' in lower(pg_get_functiondef(p.oid)))>0 and position('new.patient_id is distinct from old.patient_id' in lower(pg_get_functiondef(p.oid)))>0 and position('new.document_id is distinct from old.document_id' in lower(pg_get_functiondef(p.oid)))>0) as identity_trigger_ok,
    exists (
      select 1 from pg_constraint c where c.conrelid='public.economic_document_lines'::regclass and c.conname='economic_document_lines_document_fk' and c.contype='f' and c.confrelid='public.economic_documents'::regclass and c.confdeltype='c' and c.convalidated
        and (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum)=array['user_id','patient_id','document_id']::name[]
        and (select array_agg(a.attname order by key_position) from unnest(c.confkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=key.attnum)=array['user_id','patient_id','id']::name[]
    ) as composite_document_fk_ok,
    (select bool_and(relrowsecurity) from pg_class where oid in ('public.professional_document_details'::regclass,'public.economic_documents'::regclass,'public.economic_document_lines'::regclass,'public.economic_document_sequences'::regclass)) as rls_enabled
), role_privileges as (
  select table_name,role_name,privilege,has_table_privilege(role_name,format('public.%I',table_name),privilege) as allowed
  from unnest(array['professional_document_details','economic_documents','economic_document_lines','economic_document_sequences']) table_name
  cross join unnest(array['anon','authenticated','service_role']) role_name
  cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege
), acl_state as (
  select
    not exists (select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl where c.oid in ('public.professional_document_details'::regclass,'public.economic_documents'::regclass,'public.economic_document_lines'::regclass,'public.economic_document_sequences'::regclass) and acl.grantee=0) as public_blocked,
    not exists (select 1 from role_privileges where role_name='anon' and allowed) as anon_blocked,
    not exists (select 1 from role_privileges where role_name='authenticated' and allowed<>(table_name<>'economic_document_sequences' and privilege in ('SELECT','INSERT','UPDATE','DELETE'))) as authenticated_exact,
    (select jsonb_agg(jsonb_build_object('table',table_name,'privilege',privilege,'allowed',allowed) order by table_name,privilege) from role_privileges where role_name='service_role') as service_role_snapshot
), unchanged as (
  select s.profiles_count=e.profiles_count and s.patients_count=e.patients_count and s.sessions_count=e.sessions_count and s.payments_count=e.payments_count and s.appointment_services_count=e.appointment_services_count
    and s.profile_fingerprint=e.profile_fingerprint and s.patient_fingerprint=e.patient_fingerprint and s.session_fingerprint=e.session_fingerprint and s.payment_fingerprint=e.payment_fingerprint and s.appointment_service_fingerprint=e.appointment_service_fingerprint as preexisting_data_unchanged
  from snapshot s cross join expected e
)
select jsonb_build_object('023_postflight',jsonb_build_object(
  'pass',p.line_select_policy_ok and p.line_insert_policy_ok and p.line_update_using_ok and p.line_update_with_check_ok and p.line_delete_policy_ok and p.tautology_absent and p.exactly_four_line_policies and c.all_foundation_checks_ok and f.identity_trigger_ok and f.composite_document_fk_ok and f.rls_enabled and a.public_blocked and a.anon_blocked and a.authenticated_exact and u.preexisting_data_unchanged and s.professional_details_count=0 and s.documents_count=0 and s.lines_count=0 and s.sequences_count=0,
  'line_select_policy_ok',p.line_select_policy_ok,'line_insert_policy_ok',p.line_insert_policy_ok,'line_update_using_ok',p.line_update_using_ok,'line_update_with_check_ok',p.line_update_with_check_ok,'line_delete_policy_ok',p.line_delete_policy_ok,'tautology_absent',p.tautology_absent,'exactly_four_line_policies',p.exactly_four_line_policies,
  'all_foundation_checks_ok',c.all_foundation_checks_ok,'identity_trigger_ok',f.identity_trigger_ok,'composite_document_fk_ok',f.composite_document_fk_ok,'rls_enabled',f.rls_enabled,
  'public_blocked',a.public_blocked,'anon_blocked',a.anon_blocked,'authenticated_exact',a.authenticated_exact,'service_role_privileges',a.service_role_snapshot,
  'preexisting_data_unchanged',u.preexisting_data_unchanged,
  'profiles_count',s.profiles_count,'patients_count',s.patients_count,'sessions_count',s.sessions_count,'payments_count',s.payments_count,'appointment_services_count',s.appointment_services_count,
  'profile_fingerprint',s.profile_fingerprint,'patient_fingerprint',s.patient_fingerprint,'session_fingerprint',s.session_fingerprint,'payment_fingerprint',s.payment_fingerprint,'appointment_service_fingerprint',s.appointment_service_fingerprint,
  'professional_details_count',s.professional_details_count,'documents_count',s.documents_count,'lines_count',s.lines_count,'sequences_count',s.sequences_count
)) from policy_state p cross join check_state c cross join foundation f cross join acl_state a cross join unchanged u cross join snapshot s;
