-- E3C-A: transactional proforma issuance foundation. No document is issued here.

begin;

create table public.economic_document_issuance_attempts (
  id uuid primary key,
  user_id uuid not null,
  patient_id uuid not null,
  document_id uuid not null,
  document_type text not null constraint economic_document_issuance_attempts_document_type_check check (document_type = 'proforma'),
  number_year integer not null constraint economic_document_issuance_attempts_number_year_check check (number_year between 2000 and 9999),
  sequence_number integer not null constraint economic_document_issuance_attempts_sequence_number_check check (sequence_number > 0),
  document_number text not null,
  issue_date date not null,
  status text not null default 'reserved' constraint economic_document_issuance_attempts_status_check check (status in ('reserved', 'uploaded', 'finalized', 'abandoned')),
  lease_token uuid not null,
  lease_expires_at timestamptz not null,
  pdf_storage_path text not null,
  pdf_sha256 text,
  pdf_size_bytes bigint,
  logo_snapshot_path text,
  logo_sha256 text,
  logo_size_bytes bigint,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  abandoned_at timestamptz,
  constraint economic_document_issuance_attempts_document_fk
    foreign key (user_id, patient_id, document_id)
    references public.economic_documents (user_id, patient_id, id) on delete restrict,
  constraint economic_document_issuance_attempts_number_format_check check (
    document_number = format('PF-%s-%s', number_year, lpad(sequence_number::text, 4, '0'))
  ),
  constraint economic_document_issuance_attempts_pdf_path_check check (
    pdf_storage_path = user_id::text || '/' || document_id::text || '/' || id::text || '/document.pdf'
  ),
  constraint economic_document_issuance_attempts_logo_path_check check (
    logo_snapshot_path is null
    or logo_snapshot_path = user_id::text || '/' || document_id::text || '/' || id::text || '/logo.webp'
  ),
  constraint economic_document_issuance_attempts_pdf_metadata_check check (
    (pdf_sha256 is null and pdf_size_bytes is null)
    or (pdf_sha256 ~ '^[0-9a-f]{64}$' and pdf_size_bytes > 0 and pdf_size_bytes <= 10485760)
  ),
  constraint economic_document_issuance_attempts_logo_metadata_check check (
    (logo_sha256 is null and logo_size_bytes is null)
    or (logo_snapshot_path is not null and logo_sha256 ~ '^[0-9a-f]{64}$' and logo_size_bytes > 0 and logo_size_bytes <= 2097152)
  ),
  constraint economic_document_issuance_attempts_error_code_check check (
    last_error_code is null or last_error_code ~ '^[a-z0-9_]{1,80}$'
  ),
  constraint economic_document_issuance_attempts_status_invariants_check check (
    (status = 'reserved' and pdf_sha256 is null and pdf_size_bytes is null and finalized_at is null and abandoned_at is null)
    or (status = 'uploaded' and pdf_sha256 is not null and pdf_size_bytes is not null and finalized_at is null and abandoned_at is null)
    or (status = 'finalized' and pdf_sha256 is not null and pdf_size_bytes is not null and finalized_at is not null and abandoned_at is null)
    or (status = 'abandoned' and finalized_at is null and abandoned_at is not null)
  ),
  constraint economic_document_issuance_attempts_user_sequence_key unique (user_id, document_type, number_year, sequence_number),
  constraint economic_document_issuance_attempts_user_number_key unique (user_id, document_number)
);

create unique index economic_document_issuance_attempts_one_active_idx
  on public.economic_document_issuance_attempts (user_id, document_id)
  where status in ('reserved', 'uploaded');
create index economic_document_issuance_attempts_user_status_created_idx
  on public.economic_document_issuance_attempts (user_id, status, created_at desc);

alter table public.economic_document_issuance_attempts enable row level security;
revoke all privileges on table public.economic_document_issuance_attempts from public, anon, authenticated;
grant select, insert, update, delete on table public.economic_document_issuance_attempts to service_role;

create function public.economic_document_has_active_issuance(p_user_id uuid, p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p_user_id = auth.uid() and exists (
    select 1 from public.economic_document_issuance_attempts a
    where a.user_id = p_user_id
      and a.document_id = p_document_id
      and a.status in ('reserved', 'uploaded')
  );
$$;

revoke all on function public.economic_document_has_active_issuance(uuid, uuid) from public, anon;
grant execute on function public.economic_document_has_active_issuance(uuid, uuid) to authenticated, service_role;

alter policy "economic documents update draft own" on public.economic_documents
  using (user_id = auth.uid() and status = 'draft' and not public.economic_document_has_active_issuance(user_id, id))
  with check (user_id = auth.uid() and status = 'draft' and not public.economic_document_has_active_issuance(user_id, id));
alter policy "economic documents delete draft own" on public.economic_documents
  using (user_id = auth.uid() and status = 'draft' and not public.economic_document_has_active_issuance(user_id, id));

alter policy "economic document lines insert draft own" on public.economic_document_lines
  with check (
    economic_document_lines.user_id = auth.uid()
    and not public.economic_document_has_active_issuance(economic_document_lines.user_id, economic_document_lines.document_id)
    and exists (select 1 from public.economic_documents d where d.id = economic_document_lines.document_id and d.user_id = economic_document_lines.user_id and d.patient_id = economic_document_lines.patient_id and d.status = 'draft')
  );
alter policy "economic document lines update draft own" on public.economic_document_lines
  using (
    economic_document_lines.user_id = auth.uid()
    and not public.economic_document_has_active_issuance(economic_document_lines.user_id, economic_document_lines.document_id)
    and exists (select 1 from public.economic_documents d where d.id = economic_document_lines.document_id and d.user_id = economic_document_lines.user_id and d.patient_id = economic_document_lines.patient_id and d.status = 'draft')
  )
  with check (
    economic_document_lines.user_id = auth.uid()
    and not public.economic_document_has_active_issuance(economic_document_lines.user_id, economic_document_lines.document_id)
    and exists (select 1 from public.economic_documents d where d.id = economic_document_lines.document_id and d.user_id = economic_document_lines.user_id and d.patient_id = economic_document_lines.patient_id and d.status = 'draft')
  );
alter policy "economic document lines delete draft own" on public.economic_document_lines
  using (
    economic_document_lines.user_id = auth.uid()
    and not public.economic_document_has_active_issuance(economic_document_lines.user_id, economic_document_lines.document_id)
    and exists (select 1 from public.economic_documents d where d.id = economic_document_lines.document_id and d.user_id = economic_document_lines.user_id and d.patient_id = economic_document_lines.patient_id and d.status = 'draft')
  );

create function public.reserve_economic_document_issuance(
  p_user_id uuid, p_document_id uuid, p_attempt_id uuid, p_lease_token uuid,
  p_issue_date date, p_lease_seconds integer default 900
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_document public.economic_documents%rowtype;
  v_attempt public.economic_document_issuance_attempts%rowtype;
  v_line_count integer;
  v_total bigint;
  v_sequence integer;
  v_year integer;
  v_now timestamptz := clock_timestamp();
  v_lines jsonb;
begin
  if p_user_id is null or p_document_id is null or p_attempt_id is null or p_lease_token is null
    or p_issue_date is null or p_lease_seconds not between 300 and 3600 then
    raise exception using errcode = '22023', message = 'invalid_issuance_reservation';
  end if;

  select * into v_document from public.economic_documents
  where user_id = p_user_id and id = p_document_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'economic_document_not_found'; end if;
  if v_document.status <> 'draft' then raise exception using errcode = '23514', message = 'economic_document_not_draft'; end if;

  perform 1 from public.economic_document_lines l
  where l.user_id = p_user_id and l.document_id = p_document_id order by l.id for update;
  select count(*), coalesce(sum(line_total_cents::bigint), 0),
         coalesce(jsonb_agg(to_jsonb(l) order by l.position), '[]'::jsonb)
    into v_line_count, v_total, v_lines
  from public.economic_document_lines l
  where l.user_id = p_user_id and l.document_id = p_document_id;
  if v_line_count = 0 then raise exception using errcode = '23514', message = 'economic_document_has_no_lines'; end if;
  if v_total > 2147483647 then raise exception using errcode = '22003', message = 'economic_document_total_too_large'; end if;
  if exists (
    select 1 from public.economic_document_lines l
    where l.user_id = p_user_id and l.document_id = p_document_id and btrim(l.description_snapshot) = ''
  ) then raise exception using errcode = '23514', message = 'economic_document_line_description_required'; end if;
  if jsonb_typeof(v_document.professional_snapshot) <> 'object' or v_document.professional_snapshot = '{}'::jsonb
    or jsonb_typeof(v_document.recipient_snapshot) <> 'object' or v_document.recipient_snapshot = '{}'::jsonb then
    raise exception using errcode = '23514', message = 'economic_document_snapshots_incomplete';
  end if;
  if nullif(btrim(v_document.professional_snapshot->>'professionalName'),'') is null
    or nullif(btrim(v_document.professional_snapshot->>'profession'),'') is null
    or (nullif(btrim(v_document.professional_snapshot->>'taxCode'),'') is null and nullif(btrim(v_document.professional_snapshot->>'vatNumber'),'') is null)
    or nullif(btrim(v_document.professional_snapshot->>'address'),'') is null
    or nullif(btrim(v_document.professional_snapshot->>'postalCode'),'') is null
    or nullif(btrim(v_document.professional_snapshot->>'city'),'') is null
    or nullif(btrim(v_document.professional_snapshot->>'country'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'firstName'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'lastName'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'address'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'postalCode'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'city'),'') is null
    or nullif(btrim(v_document.recipient_snapshot->>'country'),'') is null then
    raise exception using errcode = '23514', message = 'economic_document_required_fields_missing';
  end if;
  if exists (
    select 1 from public.economic_document_lines source_line
    join public.economic_document_lines issued_line on issued_line.user_id = source_line.user_id and issued_line.session_id = source_line.session_id
    join public.economic_documents issued_document on issued_document.user_id = issued_line.user_id and issued_document.id = issued_line.document_id
    where source_line.user_id = p_user_id and source_line.document_id = p_document_id
      and source_line.session_id is not null and issued_document.status = 'issued' and issued_document.id <> p_document_id
  ) then raise exception using errcode = '23505', message = 'session_already_documented'; end if;

  update public.economic_documents set subtotal_cents = v_total::integer, total_cents = v_total::integer, updated_at = v_now
  where user_id = p_user_id and id = p_document_id returning * into v_document;

  select * into v_attempt from public.economic_document_issuance_attempts
  where user_id = p_user_id and document_id = p_document_id and status in ('reserved', 'uploaded') for update;
  if found then
    update public.economic_document_issuance_attempts
      set lease_token = p_lease_token, lease_expires_at = v_now + make_interval(secs => p_lease_seconds), updated_at = v_now
      where id = v_attempt.id returning * into v_attempt;
  else
    v_year := extract(year from p_issue_date)::integer;
    insert into public.economic_document_sequences(user_id, document_type, year, last_number, updated_at)
      values (p_user_id, v_document.document_type, v_year, 1, v_now)
      on conflict (user_id, document_type, year) do update
        set last_number = public.economic_document_sequences.last_number + 1, updated_at = excluded.updated_at
      returning last_number into v_sequence;
    insert into public.economic_document_issuance_attempts(
      id,user_id,patient_id,document_id,document_type,number_year,sequence_number,document_number,issue_date,
      lease_token,lease_expires_at,pdf_storage_path,logo_snapshot_path
    ) values (
      p_attempt_id,p_user_id,v_document.patient_id,p_document_id,v_document.document_type,v_year,v_sequence,
      format('PF-%s-%s',v_year,lpad(v_sequence::text,4,'0')),p_issue_date,p_lease_token,
      v_now + make_interval(secs => p_lease_seconds),
      p_user_id::text||'/'||p_document_id::text||'/'||p_attempt_id::text||'/document.pdf',
      case when v_document.logo_included then p_user_id::text||'/'||p_document_id::text||'/'||p_attempt_id::text||'/logo.webp' end
    ) returning * into v_attempt;
  end if;
  return jsonb_build_object('attempt',to_jsonb(v_attempt),'document',to_jsonb(v_document),'lines',v_lines);
end;
$$;

create function public.mark_economic_document_issuance_uploaded(
  p_user_id uuid, p_attempt_id uuid, p_lease_token uuid,
  p_pdf_storage_path text, p_pdf_sha256 text, p_pdf_size_bytes bigint,
  p_logo_snapshot_path text, p_logo_sha256 text, p_logo_size_bytes bigint
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_attempt public.economic_document_issuance_attempts%rowtype;
begin
  select * into v_attempt from public.economic_document_issuance_attempts where user_id=p_user_id and id=p_attempt_id for update;
  if not found then raise exception using errcode='P0002',message='issuance_attempt_not_found'; end if;
  if v_attempt.lease_token <> p_lease_token or v_attempt.lease_expires_at < clock_timestamp() then raise exception using errcode='42501',message='issuance_lease_invalid'; end if;
  if v_attempt.status not in ('reserved','uploaded','finalized') then raise exception using errcode='23514',message='issuance_attempt_not_uploadable'; end if;
  if p_pdf_storage_path is distinct from v_attempt.pdf_storage_path or p_pdf_sha256 is null or p_pdf_sha256 !~ '^[0-9a-f]{64}$'
    or p_pdf_size_bytes is null or p_pdf_size_bytes not between 1 and 10485760 then raise exception using errcode='22023',message='invalid_pdf_metadata'; end if;
  if (v_attempt.logo_snapshot_path is null and (p_logo_snapshot_path is not null or p_logo_sha256 is not null or p_logo_size_bytes is not null))
    or (v_attempt.logo_snapshot_path is not null and (p_logo_snapshot_path is distinct from v_attempt.logo_snapshot_path or p_logo_sha256 is null
      or p_logo_sha256 !~ '^[0-9a-f]{64}$' or p_logo_size_bytes is null or p_logo_size_bytes not between 1 and 2097152)) then
    raise exception using errcode='22023',message='invalid_logo_metadata';
  end if;
  if v_attempt.status in ('uploaded','finalized') then
    if v_attempt.pdf_sha256 is distinct from p_pdf_sha256 or v_attempt.pdf_size_bytes is distinct from p_pdf_size_bytes
      or v_attempt.logo_sha256 is distinct from p_logo_sha256 or v_attempt.logo_size_bytes is distinct from p_logo_size_bytes then
      raise exception using errcode='23514',message='uploaded_metadata_mismatch';
    end if;
    return true;
  end if;
  update public.economic_document_issuance_attempts set status='uploaded',pdf_sha256=p_pdf_sha256,pdf_size_bytes=p_pdf_size_bytes,
    logo_sha256=p_logo_sha256,logo_size_bytes=p_logo_size_bytes,last_error_code=null,updated_at=clock_timestamp() where id=p_attempt_id;
  return true;
end;
$$;

create function public.finalize_economic_document_issuance(p_user_id uuid,p_attempt_id uuid,p_lease_token uuid)
returns public.economic_documents language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_attempt public.economic_document_issuance_attempts%rowtype;
  v_document public.economic_documents%rowtype;
  v_total bigint;
  v_line_count integer;
  v_now timestamptz := clock_timestamp();
begin
  select * into v_attempt from public.economic_document_issuance_attempts where user_id=p_user_id and id=p_attempt_id for update;
  if not found then raise exception using errcode='P0002',message='issuance_attempt_not_found'; end if;
  if v_attempt.lease_token <> p_lease_token then raise exception using errcode='42501',message='issuance_lease_invalid'; end if;
  if v_attempt.status='finalized' then
    select * into v_document from public.economic_documents where user_id=p_user_id and id=v_attempt.document_id;
    if v_document.status='issued' and v_document.document_number=v_attempt.document_number and v_document.pdf_storage_path=v_attempt.pdf_storage_path then return v_document; end if;
    raise exception using errcode='23514',message='finalized_issuance_inconsistent';
  end if;
  if v_attempt.status <> 'uploaded' then raise exception using errcode='23514',message='issuance_attempt_not_uploaded'; end if;
  if v_attempt.lease_expires_at < v_now then raise exception using errcode='42501',message='issuance_lease_expired'; end if;
  select * into v_document from public.economic_documents where user_id=p_user_id and id=v_attempt.document_id for update;
  if not found then raise exception using errcode='P0002',message='economic_document_not_found'; end if;
  if v_document.status <> 'draft' then raise exception using errcode='23514',message='economic_document_not_draft'; end if;

  perform s.id from public.sessions s where s.user_id=p_user_id and s.id in (
    select l.session_id from public.economic_document_lines l where l.user_id=p_user_id and l.document_id=v_attempt.document_id and l.session_id is not null
  ) order by s.id for update;
  if exists (
    select 1 from public.economic_document_lines source_line
    join public.economic_document_lines issued_line on issued_line.user_id=source_line.user_id and issued_line.session_id=source_line.session_id
    join public.economic_documents issued_document on issued_document.user_id=issued_line.user_id and issued_document.id=issued_line.document_id
    where source_line.user_id=p_user_id and source_line.document_id=v_attempt.document_id and source_line.session_id is not null
      and issued_document.status='issued' and issued_document.id<>v_attempt.document_id
  ) then raise exception using errcode='23505',message='session_already_documented'; end if;
  select count(*),coalesce(sum(line_total_cents::bigint),0) into v_line_count,v_total from public.economic_document_lines
    where user_id=p_user_id and document_id=v_attempt.document_id;
  if v_line_count=0 or v_total>2147483647 then raise exception using errcode='23514',message='economic_document_lines_invalid'; end if;

  update public.economic_documents set status='issued',sequence_number=v_attempt.sequence_number,number_year=v_attempt.number_year,
    document_number=v_attempt.document_number,issue_date=v_attempt.issue_date,subtotal_cents=v_total::integer,total_cents=v_total::integer,
    logo_snapshot_path=v_attempt.logo_snapshot_path,pdf_storage_path=v_attempt.pdf_storage_path,issued_at=v_now,updated_at=v_now
    where user_id=p_user_id and id=v_attempt.document_id returning * into v_document;
  update public.economic_document_issuance_attempts set status='finalized',last_error_code=null,finalized_at=v_now,updated_at=v_now
    where user_id=p_user_id and id=p_attempt_id;
  return v_document;
end;
$$;

create function public.record_economic_document_issuance_error(p_user_id uuid,p_attempt_id uuid,p_lease_token uuid,p_error_code text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_error_code !~ '^[a-z0-9_]{1,80}$' then raise exception using errcode='22023',message='invalid_issuance_error_code'; end if;
  update public.economic_document_issuance_attempts set last_error_code=p_error_code,updated_at=clock_timestamp()
  where user_id=p_user_id and id=p_attempt_id and lease_token=p_lease_token and status in ('reserved','uploaded');
  if not found then raise exception using errcode='P0002',message='active_issuance_attempt_not_found'; end if;
  return true;
end;
$$;

create function public.abandon_economic_document_issuance(p_user_id uuid,p_attempt_id uuid,p_lease_token uuid,p_error_code text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_error_code is not null and p_error_code !~ '^[a-z0-9_]{1,80}$' then raise exception using errcode='22023',message='invalid_issuance_error_code'; end if;
  update public.economic_document_issuance_attempts set status='abandoned',last_error_code=p_error_code,abandoned_at=clock_timestamp(),updated_at=clock_timestamp()
  where user_id=p_user_id and id=p_attempt_id and lease_token=p_lease_token and status in ('reserved','uploaded');
  if not found then raise exception using errcode='P0002',message='active_issuance_attempt_not_found'; end if;
  return true;
end;
$$;

create function public.void_economic_document(p_user_id uuid,p_document_id uuid,p_reason text)
returns public.economic_documents language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_document public.economic_documents%rowtype; v_now timestamptz:=clock_timestamp();
begin
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then raise exception using errcode='22023',message='void_reason_required'; end if;
  select * into v_document from public.economic_documents where user_id=p_user_id and id=p_document_id for update;
  if not found then raise exception using errcode='P0002',message='economic_document_not_found'; end if;
  if v_document.status<>'issued' then raise exception using errcode='23514',message='economic_document_not_issued'; end if;
  update public.economic_documents set status='voided',void_reason=btrim(p_reason),voided_at=v_now,updated_at=v_now
    where user_id=p_user_id and id=p_document_id returning * into v_document;
  return v_document;
end;
$$;

revoke all on function public.reserve_economic_document_issuance(uuid,uuid,uuid,uuid,date,integer) from public,anon,authenticated;
revoke all on function public.mark_economic_document_issuance_uploaded(uuid,uuid,uuid,text,text,bigint,text,text,bigint) from public,anon,authenticated;
revoke all on function public.finalize_economic_document_issuance(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.record_economic_document_issuance_error(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.abandon_economic_document_issuance(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.void_economic_document(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_economic_document_issuance(uuid,uuid,uuid,uuid,date,integer) to service_role;
grant execute on function public.mark_economic_document_issuance_uploaded(uuid,uuid,uuid,text,text,bigint,text,text,bigint) to service_role;
grant execute on function public.finalize_economic_document_issuance(uuid,uuid,uuid) to service_role;
grant execute on function public.record_economic_document_issuance_error(uuid,uuid,uuid,text) to service_role;
grant execute on function public.abandon_economic_document_issuance(uuid,uuid,uuid,text) to service_role;
grant execute on function public.void_economic_document(uuid,uuid,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('economic-documents','economic-documents',false,10485760,array['application/pdf','image/webp']::text[]);

comment on table public.economic_document_issuance_attempts is 'Persistent server-only proforma issuance attempts; reserved numbers are never reused.';

commit;
