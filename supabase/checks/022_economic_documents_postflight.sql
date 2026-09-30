-- Read-only production postflight for migration 022.
-- Historical strict checker: it may report false negatives for catalog expression formatting.
-- Use 023_final_simple_diagnostic.sql as the authoritative final E3A verification.
-- Fill expected only with values copied from a successful preflight.
with expected as (
  select 2::bigint as profiles_before, 18::bigint as patients_before, 25::bigint as sessions_before,
    0::bigint as payments_before, 2::bigint as appointment_services_before,
    'fdc9bcc751e669ced3cedbc39015008c'::text as profile_fingerprint_before,
    '619f71f47c276e8107783cb72decda07'::text as patient_fingerprint_before,
    '37ea164b941693ac8babdf629d179668'::text as session_fingerprint_before,
    'd41d8cd98f00b204e9800998ecf8427e'::text as payment_fingerprint_before,
    'ead875954b6de06113e59f18d3de265d'::text as appointment_service_fingerprint_before
), snapshot as (
  select
    (select count(*) from public.profiles) as profiles_after,
    (select count(*) from public.patients) as patients_after,
    (select count(*) from public.sessions) as sessions_after,
    (select count(*) from public.payments) as payments_after,
    (select count(*) from public.appointment_services) as appointment_services_after,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.profiles row_value), '')) as profile_fingerprint_after,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.patients row_value), '')) as patient_fingerprint_after,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.sessions row_value), '')) as session_fingerprint_after,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.payments row_value), '')) as payment_fingerprint_after,
    md5(coalesce((select string_agg(to_jsonb(row_value)::text, ',' order by id) from public.appointment_services row_value), '')) as appointment_service_fingerprint_after,
    (select count(*) from public.professional_document_details) as professional_details_count,
    (select count(*) from public.economic_documents) as documents_count,
    (select count(*) from public.economic_document_lines) as lines_count,
    (select count(*) from public.economic_document_sequences) as sequences_count
), expected_columns(table_name,column_name,data_type,udt_name,is_nullable,column_default) as (
  values
    ('professional_document_details','user_id','uuid','uuid','NO',null),('professional_document_details','tax_code','text','text','YES',null),('professional_document_details','vat_number','text','text','YES',null),('professional_document_details','address','text','text','YES',null),('professional_document_details','postal_code','text','text','YES',null),('professional_document_details','city','text','text','YES',null),('professional_document_details','province','text','text','YES',null),('professional_document_details','country','text','text','YES',null),('professional_document_details','created_at','timestamp with time zone','timestamptz','NO','now()'),('professional_document_details','updated_at','timestamp with time zone','timestamptz','NO','now()'),
    ('economic_documents','id','uuid','uuid','NO',null),('economic_documents','user_id','uuid','uuid','NO',null),('economic_documents','patient_id','uuid','uuid','NO',null),('economic_documents','document_type','text','text','NO','''proforma''::text'),('economic_documents','status','text','text','NO','''draft''::text'),('economic_documents','sequence_number','integer','int4','YES',null),('economic_documents','number_year','integer','int4','YES',null),('economic_documents','document_number','text','text','YES',null),('economic_documents','issue_date','date','date','YES',null),('economic_documents','professional_snapshot','jsonb','jsonb','NO','''{}''::jsonb'),('economic_documents','recipient_snapshot','jsonb','jsonb','NO','''{}''::jsonb'),('economic_documents','subtotal_cents','integer','int4','NO','0'),('economic_documents','total_cents','integer','int4','NO','0'),('economic_documents','currency_code','text','text','NO','''EUR''::text'),('economic_documents','notes','text','text','YES',null),('economic_documents','logo_included','boolean','bool','NO','false'),('economic_documents','logo_snapshot_path','text','text','YES',null),('economic_documents','pdf_storage_path','text','text','YES',null),('economic_documents','render_template_version','integer','int4','NO','1'),('economic_documents','issued_at','timestamp with time zone','timestamptz','YES',null),('economic_documents','voided_at','timestamp with time zone','timestamptz','YES',null),('economic_documents','void_reason','text','text','YES',null),('economic_documents','created_at','timestamp with time zone','timestamptz','NO','now()'),('economic_documents','updated_at','timestamp with time zone','timestamptz','NO','now()'),
    ('economic_document_lines','id','uuid','uuid','NO',null),('economic_document_lines','user_id','uuid','uuid','NO',null),('economic_document_lines','patient_id','uuid','uuid','NO',null),('economic_document_lines','document_id','uuid','uuid','NO',null),('economic_document_lines','session_id','uuid','uuid','YES',null),('economic_document_lines','service_id','uuid','uuid','YES',null),('economic_document_lines','service_name_snapshot','text','text','YES',null),('economic_document_lines','service_date_snapshot','date','date','YES',null),('economic_document_lines','description_snapshot','text','text','NO',null),('economic_document_lines','quantity','integer','int4','NO','1'),('economic_document_lines','unit_amount_cents','integer','int4','NO',null),('economic_document_lines','line_total_cents','integer','int4','NO',null),('economic_document_lines','position','integer','int4','NO',null),('economic_document_lines','created_at','timestamp with time zone','timestamptz','NO','now()'),('economic_document_lines','updated_at','timestamp with time zone','timestamptz','NO','now()'),
    ('economic_document_sequences','user_id','uuid','uuid','NO',null),('economic_document_sequences','document_type','text','text','NO',null),('economic_document_sequences','year','integer','int4','NO',null),('economic_document_sequences','last_number','integer','int4','NO','0'),('economic_document_sequences','updated_at','timestamp with time zone','timestamptz','NO','now()')
), column_check as (
  select count(*)=(select count(*) from expected_columns)
    and not exists (select 1 from expected_columns e left join information_schema.columns c on c.table_schema='public' and c.table_name=e.table_name and c.column_name=e.column_name where c.column_name is null or c.data_type<>e.data_type or c.udt_name<>e.udt_name or c.is_nullable<>e.is_nullable or c.column_default is distinct from e.column_default)
    as complete_schema_ok
  from information_schema.columns c where c.table_schema='public' and c.table_name in ('professional_document_details','economic_documents','economic_document_lines','economic_document_sequences')
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
), check_check as (
  select not exists (
    select 1 from expected_checks e
    where not exists (
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
  ) as all_checks_ok
), constraint_columns as (
  select c.conname,t.relname as table_name,c.contype,c.confrelid,c.confdeltype,c.convalidated,c.confdelsetcols,
    (select array_agg(a.attname order by key_position) from unnest(c.conkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=key.attnum) as local_columns,
    (select array_agg(a.attname order by key_position) from unnest(c.confkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=key.attnum) as foreign_columns,
    case when c.conindid<>0 then (select i.indisvalid and i.indisready from pg_index i where i.indexrelid=c.conindid) else true end as backing_index_ok
  from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public'
), key_check as (
  select
    not exists (select 1 from (values
      ('professional_document_details','professional_document_details_pkey','p',array['user_id']::name[]),
      ('economic_documents','economic_documents_pkey','p',array['id']::name[]),
      ('economic_documents','economic_documents_user_patient_id_key','u',array['user_id','patient_id','id']::name[]),
      ('economic_document_lines','economic_document_lines_pkey','p',array['id']::name[]),
      ('economic_document_lines','economic_document_lines_document_position_key','u',array['document_id','position']::name[]),
      ('economic_document_sequences','economic_document_sequences_pkey','p',array['user_id','document_type','year']::name[])
    ) e(table_name,conname,contype,columns) where not exists (select 1 from constraint_columns c where c.table_name=e.table_name and c.conname=e.conname and c.contype=e.contype and c.local_columns=e.columns and c.convalidated and c.backing_index_ok)) as primary_unique_keys_ok
), index_catalog as (
  select ci.relname as index_name,ct.relname as table_name,i.indisunique,i.indisvalid,i.indisready,
    (select array_agg(a.attname order by key_position) from unnest(i.indkey) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid=i.indrelid and a.attnum=key.attnum) as columns,
    regexp_replace(lower(coalesce(pg_get_expr(i.indpred,i.indrelid),'')),'[[:space:]()]','','g') as predicate
  from pg_index i join pg_class ci on ci.oid=i.indexrelid join pg_class ct on ct.oid=i.indrelid join pg_namespace n on n.oid=ct.relnamespace where n.nspname='public'
), index_check as (
  select not exists (select 1 from (values
    ('economic_documents_issued_sequence_unique_idx',true,array['user_id','document_type','number_year','sequence_number']::name[],'sequence_numberisnotnull'),
    ('economic_documents_document_number_unique_idx',true,array['user_id','document_number']::name[],'document_numberisnotnull'),
    ('economic_documents_user_patient_status_created_idx',false,array['user_id','patient_id','status','created_at']::name[],''),
    ('economic_document_lines_session_per_document_unique_idx',true,array['document_id','session_id']::name[],'session_idisnotnull'),
    ('economic_document_lines_user_patient_session_idx',false,array['user_id','patient_id','session_id']::name[],'session_idisnotnull')
  ) e(index_name,is_unique,columns,predicate) where not exists (select 1 from index_catalog i where i.index_name=e.index_name and i.indisunique=e.is_unique and i.columns=e.columns and i.predicate=e.predicate and i.indisvalid and i.indisready)) as explicit_indexes_ok
), fk_check as (
  select
    exists (select 1 from constraint_columns where conname='economic_documents_user_patient_fk' and local_columns=array['user_id','patient_id']::name[] and confrelid='public.patients'::regclass and foreign_columns=array['user_id','id']::name[] and confdeltype='r' and convalidated) as patient_fk_ok,
    exists (select 1 from constraint_columns where conname='economic_document_lines_document_fk' and local_columns=array['user_id','patient_id','document_id']::name[] and confrelid='public.economic_documents'::regclass and foreign_columns=array['user_id','patient_id','id']::name[] and confdeltype='c' and convalidated) as document_fk_ok,
    exists (select 1 from constraint_columns where conname='economic_document_lines_session_fk' and local_columns=array['user_id','patient_id','session_id']::name[] and confrelid='public.sessions'::regclass and foreign_columns=array['user_id','patient_id','id']::name[] and confdeltype='r' and convalidated) as session_fk_ok,
    exists (select 1 from constraint_columns c where conname='economic_document_lines_service_fk' and local_columns=array['user_id','service_id']::name[] and confrelid='public.appointment_services'::regclass and foreign_columns=array['user_id','id']::name[] and confdeltype='n' and convalidated and (select array_agg(a.attname order by key_position) from unnest(c.confdelsetcols) with ordinality key(attnum,key_position) join pg_attribute a on a.attrelid='public.economic_document_lines'::regclass and a.attnum=key.attnum)=array['service_id']::name[]) as service_fk_ok,
    exists (select 1 from constraint_columns where conname='professional_document_details_user_id_fkey' and local_columns=array['user_id']::name[] and confrelid='auth.users'::regclass and foreign_columns=array['id']::name[] and confdeltype='c' and convalidated) as professional_user_fk_ok,
    exists (select 1 from constraint_columns where conname='economic_document_sequences_user_id_fkey' and local_columns=array['user_id']::name[] and confrelid='auth.users'::regclass and foreign_columns=array['id']::name[] and confdeltype='r' and convalidated) as sequence_user_fk_ok
), trigger_check as (
  select
    exists (select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_class c on c.oid=t.tgrelid where c.oid='public.economic_document_lines'::regclass and t.tgname='economic_document_lines_identity_guard' and not t.tgisinternal and t.tgenabled='O' and t.tgtype=19 and p.oid='public.enforce_economic_document_line_identity()'::regprocedure and not p.prosecdef and p.proconfig @> array['search_path=pg_catalog, public'] and position('new.user_id is distinct from old.user_id' in lower(pg_get_functiondef(p.oid)))>0 and position('new.patient_id is distinct from old.patient_id' in lower(pg_get_functiondef(p.oid)))>0 and position('new.document_id is distinct from old.document_id' in lower(pg_get_functiondef(p.oid)))>0) as identity_trigger_ok,
    not has_function_privilege('anon','public.enforce_economic_document_line_identity()','EXECUTE')
      and not has_function_privilege('authenticated','public.enforce_economic_document_line_identity()','EXECUTE')
      and not exists (select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl where p.oid='public.enforce_economic_document_line_identity()'::regprocedure and acl.grantee=0 and acl.privilege_type='EXECUTE') as identity_function_browser_blocked
), line_policy_catalog as (
  select policyname,cmd,roles,permissive,
    regexp_replace(lower(coalesce(qual,'')),'[[:space:]()]','','g') as normalized_qual,
    regexp_replace(lower(coalesce(with_check,'')),'[[:space:]()]','','g') as normalized_with_check
  from pg_policies where schemaname='public' and tablename='economic_document_lines'
), policy_check as (
  select
    (select count(*) from pg_policies where schemaname='public' and tablename='professional_document_details' and roles=array['authenticated']::name[] and policyname in ('professional document details select own','professional document details insert own','professional document details update own','professional document details delete own'))=4
      and not exists (select 1 from pg_policies where schemaname='public' and tablename='professional_document_details' and ((cmd in ('SELECT','UPDATE','DELETE') and position('user_id = auth.uid()' in coalesce(qual,''))=0) or (cmd in ('INSERT','UPDATE') and position('user_id = auth.uid()' in coalesce(with_check,''))=0))) as professional_policies_ok,
    (select count(*) from pg_policies where schemaname='public' and tablename='economic_documents' and roles=array['authenticated']::name[] and policyname in ('economic documents select own','economic documents insert draft own','economic documents update draft own','economic documents delete draft own'))=4
      and not exists (select 1 from pg_policies where schemaname='public' and tablename='economic_documents' and ((cmd in ('SELECT','UPDATE','DELETE') and position('user_id = auth.uid()' in coalesce(qual,''))=0) or (cmd in ('INSERT','UPDATE') and position('user_id = auth.uid()' in coalesce(with_check,''))=0) or (cmd in ('INSERT','UPDATE','DELETE') and position('status = ''draft''::text' in coalesce(qual,'')||coalesce(with_check,''))=0))) as document_policies_ok,
    exists (select 1 from line_policy_catalog where policyname='economic document lines select own' and cmd='SELECT' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('user_id=auth.uid' in normalized_qual)>0)
      and exists (select 1 from line_policy_catalog where policyname='economic document lines insert draft own' and cmd='INSERT' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_with_check)>0 and position('d.id=economic_document_lines.document_id' in normalized_with_check)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_with_check)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check)>0 and position('d.status=''draft''::text' in normalized_with_check)>0)
      and exists (select 1 from line_policy_catalog where policyname='economic document lines update draft own' and cmd='UPDATE' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_qual)>0 and position('d.id=economic_document_lines.document_id' in normalized_qual)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_qual)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual)>0 and position('d.status=''draft''::text' in normalized_qual)>0 and position('economic_document_lines.user_id=auth.uid' in normalized_with_check)>0 and position('d.id=economic_document_lines.document_id' in normalized_with_check)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_with_check)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check)>0 and position('d.status=''draft''::text' in normalized_with_check)>0)
      and exists (select 1 from line_policy_catalog where policyname='economic document lines delete draft own' and cmd='DELETE' and roles=array['authenticated']::name[] and permissive='PERMISSIVE' and position('economic_document_lines.user_id=auth.uid' in normalized_qual)>0 and position('d.id=economic_document_lines.document_id' in normalized_qual)>0 and position('d.user_id=economic_document_lines.user_id' in normalized_qual)>0 and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual)>0 and position('d.status=''draft''::text' in normalized_qual)>0)
      and not exists (select 1 from line_policy_catalog where position('d.patient_id=d.patient_id' in normalized_qual)>0 or position('d.patient_id=d.patient_id' in normalized_with_check)>0) as line_policies_ok,
    (select count(*) from pg_policies where schemaname='public' and tablename='economic_document_sequences')=0 as sequence_has_no_policies
), role_privileges as (
  select table_name,role_name,privilege,has_table_privilege(role_name,format('public.%I',table_name),privilege) as allowed
  from unnest(array['professional_document_details','economic_documents','economic_document_lines','economic_document_sequences']) table_name
  cross join unnest(array['anon','authenticated','service_role']) role_name
  cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege
), privilege_check as (
  select
    not exists (select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl where c.oid in ('public.professional_document_details'::regclass,'public.economic_documents'::regclass,'public.economic_document_lines'::regclass,'public.economic_document_sequences'::regclass) and acl.grantee=0) as public_blocked,
    not exists (select 1 from role_privileges where role_name='anon' and allowed) as anon_blocked,
    not exists (select 1 from role_privileges where role_name='authenticated' and allowed<>(table_name<>'economic_document_sequences' and privilege in ('SELECT','INSERT','UPDATE','DELETE'))) as authenticated_exact,
    (select jsonb_agg(jsonb_build_object('table',table_name,'privilege',privilege,'allowed',allowed) order by table_name,privilege) from role_privileges where role_name='service_role') as service_role_snapshot
), rls_check as (
  select bool_and(relrowsecurity) as all_rls_enabled from pg_class where oid in ('public.professional_document_details'::regclass,'public.economic_documents'::regclass,'public.economic_document_lines'::regclass,'public.economic_document_sequences'::regclass)
)
select jsonb_build_object('022_postflight',jsonb_build_object(
  'pass',e.profiles_before is not null and e.patients_before is not null and e.sessions_before is not null and e.payments_before is not null and e.appointment_services_before is not null and e.profile_fingerprint_before is not null and e.patient_fingerprint_before is not null and e.session_fingerprint_before is not null and e.payment_fingerprint_before is not null and e.appointment_service_fingerprint_before is not null
    and s.profiles_after=e.profiles_before and s.patients_after=e.patients_before and s.sessions_after=e.sessions_before and s.payments_after=e.payments_before and s.appointment_services_after=e.appointment_services_before
    and s.profile_fingerprint_after=e.profile_fingerprint_before and s.patient_fingerprint_after=e.patient_fingerprint_before and s.session_fingerprint_after=e.session_fingerprint_before and s.payment_fingerprint_after=e.payment_fingerprint_before and s.appointment_service_fingerprint_after=e.appointment_service_fingerprint_before
    and s.professional_details_count=0 and s.documents_count=0 and s.lines_count=0 and s.sequences_count=0 and r.all_rls_enabled and col.complete_schema_ok and chk.all_checks_ok and k.primary_unique_keys_ok and idx.explicit_indexes_ok
    and fk.patient_fk_ok and fk.document_fk_ok and fk.session_fk_ok and fk.service_fk_ok and fk.professional_user_fk_ok and fk.sequence_user_fk_ok and trg.identity_trigger_ok and trg.identity_function_browser_blocked
    and pol.professional_policies_ok and pol.document_policies_ok and pol.line_policies_ok and pol.sequence_has_no_policies and prv.public_blocked and prv.anon_blocked and prv.authenticated_exact,
  'expected_snapshot_supplied',e.profiles_before is not null and e.patients_before is not null and e.sessions_before is not null and e.payments_before is not null and e.appointment_services_before is not null and e.profile_fingerprint_before is not null and e.patient_fingerprint_before is not null and e.session_fingerprint_before is not null and e.payment_fingerprint_before is not null and e.appointment_service_fingerprint_before is not null,
  'profiles_after',s.profiles_after,'patients_after',s.patients_after,'sessions_after',s.sessions_after,'payments_after',s.payments_after,'appointment_services_after',s.appointment_services_after,
  'profile_fingerprint_after',s.profile_fingerprint_after,'patient_fingerprint_after',s.patient_fingerprint_after,'session_fingerprint_after',s.session_fingerprint_after,'payment_fingerprint_after',s.payment_fingerprint_after,'appointment_service_fingerprint_after',s.appointment_service_fingerprint_after,
  'professional_details_count',s.professional_details_count,'documents_count',s.documents_count,'lines_count',s.lines_count,'sequences_count',s.sequences_count,
  'rls_enabled',r.all_rls_enabled,'complete_schema_ok',col.complete_schema_ok,'all_checks_ok',chk.all_checks_ok,'primary_unique_keys_ok',k.primary_unique_keys_ok,'explicit_indexes_ok',idx.explicit_indexes_ok,
  'patient_fk_ok',fk.patient_fk_ok,'document_fk_ok',fk.document_fk_ok,'session_fk_ok',fk.session_fk_ok,'service_set_null_only_service_id_ok',fk.service_fk_ok,'professional_user_fk_ok',fk.professional_user_fk_ok,'sequence_user_fk_ok',fk.sequence_user_fk_ok,
  'identity_trigger_ok',trg.identity_trigger_ok,'identity_function_browser_blocked',trg.identity_function_browser_blocked,'professional_policies_ok',pol.professional_policies_ok,'document_policies_ok',pol.document_policies_ok,'line_policies_ok',pol.line_policies_ok,'sequence_has_no_policies',pol.sequence_has_no_policies,
  'public_blocked',prv.public_blocked,'anon_blocked',prv.anon_blocked,'authenticated_exact',prv.authenticated_exact,'service_role_privileges',prv.service_role_snapshot
)) from expected e cross join snapshot s cross join column_check col cross join check_check chk cross join key_check k cross join index_check idx cross join fk_check fk cross join trigger_check trg cross join policy_check pol cross join privilege_check prv cross join rls_check r;
