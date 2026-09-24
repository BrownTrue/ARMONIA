-- Clinical pathways for the authenticated application client.
-- Additive and backward-compatible: no existing patient rows are changed.

alter table public.patients
  add constraint patients_user_id_id_key unique (user_id, id);

create table public.clinical_pathways (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null,
  title text,
  status text not null default 'active'
    check (status in ('active', 'closed')),
  started_on date not null,
  closed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clinical_pathways_user_patient_fk
    foreign key (user_id, patient_id)
    references public.patients (user_id, id)
    on delete cascade,

  constraint clinical_pathways_dates_check
    check (closed_on is null or closed_on >= started_on),

  constraint clinical_pathways_status_dates_check
    check (
      (status = 'active' and closed_on is null)
      or
      (status = 'closed' and closed_on is not null)
    ),

  constraint clinical_pathways_user_patient_id_key
    unique (user_id, patient_id, id)
);

create unique index clinical_pathways_one_active_per_patient_idx
  on public.clinical_pathways (user_id, patient_id)
  where status = 'active';

create index clinical_pathways_user_patient_started_idx
  on public.clinical_pathways (user_id, patient_id, started_on desc);

create index clinical_pathways_user_status_idx
  on public.clinical_pathways (user_id, status);

alter table public.clinical_pathways enable row level security;

create policy "clinical pathways select own"
  on public.clinical_pathways for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.user_id = auth.uid() and p.id = clinical_pathways.patient_id
    )
  );

create policy "clinical pathways insert own"
  on public.clinical_pathways for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.user_id = auth.uid() and p.id = clinical_pathways.patient_id
    )
  );

create policy "clinical pathways update own"
  on public.clinical_pathways for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.patients p
      where p.user_id = auth.uid() and p.id = clinical_pathways.patient_id
    )
  );

create policy "clinical pathways delete own"
  on public.clinical_pathways for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.clinical_pathways from anon;
grant select, insert, update, delete
  on table public.clinical_pathways
  to authenticated;
