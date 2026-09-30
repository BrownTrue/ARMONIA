-- Read-only diagnostic for the two failed migration 022 postflight aggregates.
-- Returns catalog metadata and booleans only; no application rows are read.
with line_policies as (
  select
    policyname,
    cmd,
    roles,
    permissive,
    qual,
    with_check,
    regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g') as normalized_qual,
    regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g') as normalized_with_check
  from pg_policies
  where schemaname = 'public'
    and tablename = 'economic_document_lines'
), line_policy_subchecks as (
  select
    exists (
      select 1 from line_policies
      where policyname = 'economic document lines select own'
        and cmd = 'SELECT'
        and roles = array['authenticated']::name[]
        and permissive = 'PERMISSIVE'
        and position('user_id=auth.uid' in normalized_qual) > 0
    ) as line_select_policy_ok,
    exists (
      select 1 from line_policies
      where policyname = 'economic document lines insert draft own'
        and cmd = 'INSERT'
        and roles = array['authenticated']::name[]
        and permissive = 'PERMISSIVE'
        and position('user_id=auth.uid' in normalized_with_check) > 0
        and position('d.id=economic_document_lines.document_id' in normalized_with_check) > 0
        and position('d.user_id=auth.uid' in normalized_with_check) > 0
        and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check) > 0
        and position('d.status=''draft''::text' in normalized_with_check) > 0
    ) as line_insert_policy_ok,
    exists (
      select 1 from line_policies
      where policyname = 'economic document lines update draft own'
        and cmd = 'UPDATE'
        and roles = array['authenticated']::name[]
        and permissive = 'PERMISSIVE'
        and position('user_id=auth.uid' in normalized_qual) > 0
        and position('d.id=economic_document_lines.document_id' in normalized_qual) > 0
        and position('d.user_id=auth.uid' in normalized_qual) > 0
        and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual) > 0
        and position('d.status=''draft''::text' in normalized_qual) > 0
    ) as line_update_using_ok,
    exists (
      select 1 from line_policies
      where policyname = 'economic document lines update draft own'
        and cmd = 'UPDATE'
        and roles = array['authenticated']::name[]
        and permissive = 'PERMISSIVE'
        and position('user_id=auth.uid' in normalized_with_check) > 0
        and position('d.id=economic_document_lines.document_id' in normalized_with_check) > 0
        and position('d.user_id=auth.uid' in normalized_with_check) > 0
        and position('d.patient_id=economic_document_lines.patient_id' in normalized_with_check) > 0
        and position('d.status=''draft''::text' in normalized_with_check) > 0
    ) as line_update_with_check_ok,
    exists (
      select 1 from line_policies
      where policyname = 'economic document lines delete draft own'
        and cmd = 'DELETE'
        and roles = array['authenticated']::name[]
        and permissive = 'PERMISSIVE'
        and position('user_id=auth.uid' in normalized_qual) > 0
        and position('d.id=economic_document_lines.document_id' in normalized_qual) > 0
        and position('d.user_id=auth.uid' in normalized_qual) > 0
        and position('d.patient_id=economic_document_lines.patient_id' in normalized_qual) > 0
        and position('d.status=''draft''::text' in normalized_qual) > 0
    ) as line_delete_policy_ok,
    not exists (
      select 1 from line_policies
      where position('d.patient_id=d.patient_id' in normalized_qual) > 0
         or position('d.patient_id=d.patient_id' in normalized_with_check) > 0
    ) as patient_id_outer_reference_ok,
    not exists (
      select 1 from line_policies
      where position('d.id=d.document_id' in normalized_qual) > 0
         or position('d.id=d.document_id' in normalized_with_check) > 0
    ) as document_id_outer_reference_ok
), check_catalog as (
  select
    table_class.relname as table_name,
    constraint_row.conname as constraint_name,
    constraint_row.convalidated as validated,
    pg_get_constraintdef(constraint_row.oid, true) as constraint_definition,
    pg_get_expr(constraint_row.conbin, constraint_row.conrelid, true) as catalog_expression,
    regexp_replace(lower(pg_get_expr(constraint_row.conbin, constraint_row.conrelid, true)), '[[:space:]()]', '', 'g') as normalized_expression
  from pg_constraint constraint_row
  join pg_class table_class on table_class.oid = constraint_row.conrelid
  join pg_namespace table_namespace on table_namespace.oid = table_class.relnamespace
  where table_namespace.nspname = 'public'
    and table_class.relname in ('economic_documents', 'economic_document_lines', 'economic_document_sequences')
    and constraint_row.contype = 'c'
), expected_checks(check_key, table_name, constraint_name, required_fragments) as (
  values
    ('document_type_check_ok', 'economic_documents', 'economic_documents_document_type_check', array['document_type=anyarray[''proforma''::text]']),
    ('status_check_ok', 'economic_documents', 'economic_documents_status_check', array['status=anyarray[''draft''::text,''issued''::text,''voided''::text]']),
    ('sequence_check_ok', 'economic_documents', 'economic_documents_sequence_check', array['sequence_numberisnull', 'sequence_number>0']),
    ('year_check_ok', 'economic_documents', 'economic_documents_year_check', array['number_yearisnull', 'number_year>=2000', 'number_year<=9999']),
    ('number_format_check_ok', 'economic_documents', 'economic_documents_number_format_check', array['document_numberisnull', 'document_number=format', '''pf-%s-%s''::text', 'number_year', 'sequence_number']),
    ('professional_snapshot_check_ok', 'economic_documents', 'economic_documents_professional_snapshot_check', array['jsonb_typeofprofessional_snapshot=''object''::text']),
    ('recipient_snapshot_check_ok', 'economic_documents', 'economic_documents_recipient_snapshot_check', array['jsonb_typeofrecipient_snapshot=''object''::text']),
    ('subtotal_check_ok', 'economic_documents', 'economic_documents_subtotal_cents_check', array['subtotal_cents>=0']),
    ('total_check_ok', 'economic_documents', 'economic_documents_total_cents_check', array['total_cents>=0']),
    ('currency_check_ok', 'economic_documents', 'economic_documents_currency_code_check', array['currency_code~''^[a-z]{3}$''::text']),
    ('render_template_version_check_ok', 'economic_documents', 'economic_documents_render_template_version_check', array['render_template_version>0']),
    ('status_invariants_check_ok', 'economic_documents', 'economic_documents_status_invariants_check', array['status=''draft''::text', 'status=''issued''::text', 'status=''voided''::text', 'issued_atisnotnull', 'voided_atisnotnull']),
    ('line_quantity_check_ok', 'economic_document_lines', 'economic_document_lines_quantity_check', array['quantity>0']),
    ('line_unit_amount_check_ok', 'economic_document_lines', 'economic_document_lines_unit_amount_cents_check', array['unit_amount_cents>=0']),
    ('line_total_check_ok', 'economic_document_lines', 'economic_document_lines_line_total_cents_check', array['line_total_cents>=0', 'line_total_cents::bigint=quantity::bigint*unit_amount_cents::bigint']),
    ('line_position_check_ok', 'economic_document_lines', 'economic_document_lines_position_check', array['position>0']),
    ('sequence_document_type_check_ok', 'economic_document_sequences', 'economic_document_sequences_document_type_check', array['document_type=anyarray[''proforma''::text]']),
    ('sequence_year_check_ok', 'economic_document_sequences', 'economic_document_sequences_year_check', array['year>=2000', 'year<=9999']),
    ('sequence_last_number_check_ok', 'economic_document_sequences', 'economic_document_sequences_last_number_check', array['last_number>=0'])
), check_results as (
  select
    expected.check_key,
    exists (
      select 1
      from check_catalog actual
      where actual.table_name = expected.table_name
        and actual.constraint_name = expected.constraint_name
        and actual.validated
        and not exists (
          select 1 from unnest(expected.required_fragments) as required(fragment)
          where strpos(actual.normalized_expression, required.fragment) = 0
        )
    ) as check_ok
  from expected_checks expected
), diagnostic as (
  select jsonb_build_object(
    'actual_line_policies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'policyname', policyname,
        'cmd', cmd,
        'roles', roles,
        'permissive', permissive,
        'qual', qual,
        'with_check', with_check
      ) order by policyname)
      from line_policies
    ), '[]'::jsonb),
    'line_policy_subchecks', (select to_jsonb(line_policy_subchecks) from line_policy_subchecks),
    'actual_check_constraints', coalesce((
      select jsonb_agg(jsonb_build_object(
        'table_name', table_name,
        'constraint_name', constraint_name,
        'validated', validated,
        'constraint_definition', constraint_definition,
        'catalog_expression', catalog_expression
      ) order by table_name, constraint_name)
      from check_catalog
    ), '[]'::jsonb),
    'check_subchecks', coalesce((
      select jsonb_object_agg(check_key, check_ok order by check_key)
      from check_results
    ), '{}'::jsonb),
    'diagnosis_hints', jsonb_build_array(
      'If patient_id_outer_reference_ok is false and the catalog shows d.patient_id = d.patient_id, the unqualified patient_id was captured by the inner relation. The composite document foreign key still enforces line owner, patient and document consistency.',
      'If a CHECK is present and validated in actual_check_constraints but its subcheck is false, compare catalog_expression with the required fragments: this indicates a checker normalization mismatch rather than a missing constraint.',
      'If a named CHECK is absent, unvalidated or semantically different, a corrective migration must be evaluated; migration 022 must remain immutable.'
    )
  ) as value
)
select jsonb_build_object('022_failure_diagnostic', value)
from diagnostic;
