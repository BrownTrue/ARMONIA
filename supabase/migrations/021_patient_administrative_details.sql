-- A1A: optional current administrative details for a patient.
-- Additive only: no patient row is changed and no detail row is backfilled.

begin;

create table public.patient_administrative_details (
  user_id uuid not null,
  patient_id uuid not null,
  patient_tax_code text,
  patient_address text,
  patient_postal_code text,
  patient_city text,
  patient_province text,
  patient_country text,
  billing_subject_type text not null default 'patient',
  recipient_first_name text,
  recipient_last_name text,
  recipient_tax_code text,
  recipient_relationship text,
  recipient_address text,
  recipient_postal_code text,
  recipient_city text,
  recipient_province text,
  recipient_country text,
  administrative_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patient_administrative_details_pkey primary key (user_id, patient_id),
  constraint patient_administrative_details_patient_fk
    foreign key (user_id, patient_id)
    references public.patients (user_id, id)
    on delete cascade,
  constraint patient_administrative_details_billing_subject_check
    check (billing_subject_type in ('patient', 'other'))
);

alter table public.patient_administrative_details enable row level security;

create policy "patient administrative details select own"
  on public.patient_administrative_details for select to authenticated
  using (user_id = auth.uid());

create policy "patient administrative details insert own"
  on public.patient_administrative_details for insert to authenticated
  with check (user_id = auth.uid());

create policy "patient administrative details update own"
  on public.patient_administrative_details for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "patient administrative details delete own"
  on public.patient_administrative_details for delete to authenticated
  using (user_id = auth.uid());

revoke all privileges on table public.patient_administrative_details from public, anon, authenticated;
grant select, insert, update, delete on table public.patient_administrative_details to authenticated;

comment on table public.patient_administrative_details is
  'Optional current patient and document-recipient administrative details; issued documents will own immutable snapshots.';

commit;
