-- Patient Worksheets V1: concrete worksheet snapshots linked to one patient.
-- Additive only: recipes, templates, materials and clinical records are unchanged.

begin;

create table public.patient_worksheets (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  patient_id uuid not null,
  schema_version integer not null default 1,
  title text not null,
  worksheet_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint patient_worksheets_pkey primary key (id),
  constraint patient_worksheets_user_id_id_key unique (user_id, id),
  constraint patient_worksheets_patient_fkey foreign key (user_id, patient_id)
    references public.patients (user_id, id) on delete cascade,
  constraint patient_worksheets_schema_version_check check (schema_version >= 1),
  constraint patient_worksheets_title_check check (length(btrim(title)) between 1 and 120),
  constraint patient_worksheets_snapshot_check check (jsonb_typeof(worksheet_snapshot) = 'object')
);

create index patient_worksheets_user_patient_updated_idx
  on public.patient_worksheets (user_id, patient_id, updated_at desc);

alter table public.patient_worksheets enable row level security;

create policy "patient worksheets select own"
  on public.patient_worksheets for select to authenticated
  using (user_id = auth.uid());

create policy "patient worksheets insert own"
  on public.patient_worksheets for insert to authenticated
  with check (user_id = auth.uid());

create policy "patient worksheets update own"
  on public.patient_worksheets for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "patient worksheets delete own"
  on public.patient_worksheets for delete to authenticated
  using (user_id = auth.uid());

revoke all privileges on table public.patient_worksheets from public, anon, authenticated;
grant select, insert, update, delete on table public.patient_worksheets to authenticated;

comment on table public.patient_worksheets is
  'Concrete versioned worksheet snapshots linked to one patient; not recipes, templates or homework records.';

commit;
