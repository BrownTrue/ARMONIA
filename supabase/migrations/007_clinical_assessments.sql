-- Versioned clinical assessments. Payload details remain application-validated.

create table public.clinical_assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null,
  clinical_pathway_id uuid not null,
  module_type text not null
    check (module_type = 'language_communication'),
  assessment_type text not null
    check (assessment_type = 'initial'),
  status text not null default 'draft'
    check (status in ('draft', 'completed')),
  schema_version integer not null default 1
    check (schema_version = 1),
  clinical_date date,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clinical_assessments_user_patient_fk
    foreign key (user_id, patient_id)
    references public.patients (user_id, id)
    on delete cascade,

  constraint clinical_assessments_pathway_fk
    foreign key (user_id, patient_id, clinical_pathway_id)
    references public.clinical_pathways (user_id, patient_id, id)
    on delete no action,

  constraint clinical_assessments_completed_date_check
    check (status = 'draft' or clinical_date is not null)
);

create index clinical_assessments_user_patient_date_idx
  on public.clinical_assessments (user_id, patient_id, clinical_date desc, created_at desc);

create index clinical_assessments_user_pathway_idx
  on public.clinical_assessments (user_id, clinical_pathway_id, status);

alter table public.clinical_assessments enable row level security;

create policy "clinical assessments select own"
  on public.clinical_assessments for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.user_id = auth.uid() and p.id = clinical_assessments.patient_id
    )
    and exists (
      select 1 from public.clinical_pathways cp
      where cp.user_id = auth.uid()
        and cp.patient_id = clinical_assessments.patient_id
        and cp.id = clinical_assessments.clinical_pathway_id
    )
  );

create policy "clinical assessments insert own"
  on public.clinical_assessments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.clinical_pathways cp
      where cp.user_id = auth.uid()
        and cp.patient_id = clinical_assessments.patient_id
        and cp.id = clinical_assessments.clinical_pathway_id
    )
  );

create policy "clinical assessments update own"
  on public.clinical_assessments for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.clinical_pathways cp
      where cp.user_id = auth.uid()
        and cp.patient_id = clinical_assessments.patient_id
        and cp.id = clinical_assessments.clinical_pathway_id
    )
  );

create policy "clinical assessments delete own"
  on public.clinical_assessments for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.clinical_assessments from anon;
grant select, insert, update, delete
  on table public.clinical_assessments
  to authenticated;
