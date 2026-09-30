-- E3A: economic proforma foundation. Additive only; no backfill and no issuance flow.

begin;

create table public.professional_document_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tax_code text,
  vat_number text,
  address text,
  postal_code text,
  city text,
  province text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.economic_documents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  patient_id uuid not null,
  document_type text not null default 'proforma' check (document_type in ('proforma')),
  status text not null default 'draft' check (status in ('draft', 'issued', 'voided')),
  sequence_number integer,
  number_year integer,
  document_number text,
  issue_date date,
  professional_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(professional_snapshot) = 'object'),
  recipient_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(recipient_snapshot) = 'object'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  notes text,
  logo_included boolean not null default false,
  logo_snapshot_path text,
  pdf_storage_path text,
  render_template_version integer not null default 1 check (render_template_version > 0),
  issued_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint economic_documents_user_patient_fk foreign key (user_id, patient_id)
    references public.patients (user_id, id) on delete restrict,
  constraint economic_documents_user_patient_id_key unique (user_id, patient_id, id),
  constraint economic_documents_sequence_check check (sequence_number is null or sequence_number > 0),
  constraint economic_documents_year_check check (number_year is null or number_year between 2000 and 9999),
  constraint economic_documents_number_format_check check (
    document_number is null or document_number = format('PF-%s-%s', number_year, lpad(sequence_number::text, 4, '0'))
  ),
  constraint economic_documents_status_invariants_check check (
    (status = 'draft' and sequence_number is null and number_year is null and document_number is null and issue_date is null and issued_at is null and voided_at is null)
    or (status = 'issued' and sequence_number is not null and number_year is not null and document_number is not null and issue_date is not null and issued_at is not null and voided_at is null)
    or (status = 'voided' and sequence_number is not null and number_year is not null and document_number is not null and issue_date is not null and issued_at is not null and voided_at is not null)
  )
);

create unique index economic_documents_issued_sequence_unique_idx
  on public.economic_documents (user_id, document_type, number_year, sequence_number)
  where sequence_number is not null;
create unique index economic_documents_document_number_unique_idx
  on public.economic_documents (user_id, document_number)
  where document_number is not null;
create index economic_documents_user_patient_status_created_idx
  on public.economic_documents (user_id, patient_id, status, created_at desc);

create table public.economic_document_lines (
  id uuid primary key,
  user_id uuid not null,
  patient_id uuid not null,
  document_id uuid not null,
  session_id uuid,
  service_id uuid,
  service_name_snapshot text,
  service_date_snapshot date,
  description_snapshot text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_amount_cents integer not null check (unit_amount_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0 and line_total_cents::bigint = quantity::bigint * unit_amount_cents::bigint),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint economic_document_lines_document_fk foreign key (user_id, patient_id, document_id)
    references public.economic_documents (user_id, patient_id, id) on delete cascade,
  constraint economic_document_lines_session_fk foreign key (user_id, patient_id, session_id)
    references public.sessions (user_id, patient_id, id) on delete restrict,
  constraint economic_document_lines_service_fk foreign key (user_id, service_id)
    references public.appointment_services (user_id, id) on delete set null (service_id),
  constraint economic_document_lines_document_position_key unique (document_id, position)
);

create unique index economic_document_lines_session_per_document_unique_idx
  on public.economic_document_lines (document_id, session_id)
  where session_id is not null;
create index economic_document_lines_user_patient_session_idx
  on public.economic_document_lines (user_id, patient_id, session_id)
  where session_id is not null;

create function public.enforce_economic_document_line_identity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.patient_id is distinct from old.patient_id
    or new.document_id is distinct from old.document_id then
    raise exception using
      errcode = '23514',
      message = 'economic_document_line_identity_immutable';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_economic_document_line_identity() from public, anon, authenticated;

create trigger economic_document_lines_identity_guard
before update on public.economic_document_lines
for each row execute function public.enforce_economic_document_line_identity();

create table public.economic_document_sequences (
  user_id uuid not null references auth.users(id) on delete restrict,
  document_type text not null check (document_type in ('proforma')),
  year integer not null check (year between 2000 and 9999),
  last_number integer not null default 0 check (last_number >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, document_type, year)
);

alter table public.professional_document_details enable row level security;
alter table public.economic_documents enable row level security;
alter table public.economic_document_lines enable row level security;
alter table public.economic_document_sequences enable row level security;

create policy "professional document details select own" on public.professional_document_details for select to authenticated using (user_id = auth.uid());
create policy "professional document details insert own" on public.professional_document_details for insert to authenticated with check (user_id = auth.uid());
create policy "professional document details update own" on public.professional_document_details for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "professional document details delete own" on public.professional_document_details for delete to authenticated using (user_id = auth.uid());

create policy "economic documents select own" on public.economic_documents for select to authenticated using (user_id = auth.uid());
create policy "economic documents insert draft own" on public.economic_documents for insert to authenticated with check (user_id = auth.uid() and status = 'draft');
create policy "economic documents update draft own" on public.economic_documents for update to authenticated using (user_id = auth.uid() and status = 'draft') with check (user_id = auth.uid() and status = 'draft');
create policy "economic documents delete draft own" on public.economic_documents for delete to authenticated using (user_id = auth.uid() and status = 'draft');

create policy "economic document lines select own" on public.economic_document_lines for select to authenticated using (user_id = auth.uid());
create policy "economic document lines insert draft own" on public.economic_document_lines for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.economic_documents d where d.id = document_id and d.user_id = auth.uid() and d.patient_id = patient_id and d.status = 'draft')
);
create policy "economic document lines update draft own" on public.economic_document_lines for update to authenticated using (
  user_id = auth.uid() and exists (select 1 from public.economic_documents d where d.id = document_id and d.user_id = auth.uid() and d.patient_id = patient_id and d.status = 'draft')
) with check (
  user_id = auth.uid() and exists (select 1 from public.economic_documents d where d.id = document_id and d.user_id = auth.uid() and d.patient_id = patient_id and d.status = 'draft')
);
create policy "economic document lines delete draft own" on public.economic_document_lines for delete to authenticated using (
  user_id = auth.uid() and exists (select 1 from public.economic_documents d where d.id = document_id and d.user_id = auth.uid() and d.patient_id = patient_id and d.status = 'draft')
);

revoke all privileges on table public.professional_document_details from public, anon, authenticated;
revoke all privileges on table public.economic_documents from public, anon, authenticated;
revoke all privileges on table public.economic_document_lines from public, anon, authenticated;
revoke all privileges on table public.economic_document_sequences from public, anon, authenticated;
grant select, insert, update, delete on table public.professional_document_details to authenticated;
grant select, insert, update, delete on table public.economic_documents to authenticated;
grant select, insert, update, delete on table public.economic_document_lines to authenticated;

comment on table public.professional_document_details is 'Optional current professional administrative data for economic document snapshots.';
comment on table public.economic_documents is 'Economic documents, initially proforma only. Issuance and PDF persistence are added in E3C.';
comment on table public.economic_document_lines is 'Immutable-at-issue economic line snapshots; browser mutation is limited to draft documents.';
comment on table public.economic_document_sequences is 'Private per-user annual sequence state for future atomic proforma issuance.';

commit;
