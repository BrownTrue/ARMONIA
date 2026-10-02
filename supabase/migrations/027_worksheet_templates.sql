-- Exercise Lab V1: private reusable multi-activity worksheet templates.
-- Additive only: recipes, worksheet drafts and content-bank records are unchanged.

begin;

create table public.worksheet_templates (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null default 1,
  name text not null,
  description text,
  template_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint worksheet_templates_pkey primary key (id),
  constraint worksheet_templates_user_id_id_key unique (user_id, id),
  constraint worksheet_templates_schema_version_check check (schema_version >= 1),
  constraint worksheet_templates_name_check check (length(btrim(name)) between 1 and 120),
  constraint worksheet_templates_description_check check (description is null or length(description) <= 500),
  constraint worksheet_templates_data_check check (jsonb_typeof(template_data) = 'object')
);

create index worksheet_templates_user_updated_idx
  on public.worksheet_templates (user_id, updated_at desc);

alter table public.worksheet_templates enable row level security;

create policy "worksheet templates select own"
  on public.worksheet_templates for select to authenticated
  using (user_id = auth.uid());

create policy "worksheet templates insert own"
  on public.worksheet_templates for insert to authenticated
  with check (user_id = auth.uid());

create policy "worksheet templates update own"
  on public.worksheet_templates for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "worksheet templates delete own"
  on public.worksheet_templates for delete to authenticated
  using (user_id = auth.uid());

revoke all privileges on table public.worksheet_templates from public, anon, authenticated;
grant select, insert, update, delete on table public.worksheet_templates to authenticated;

comment on table public.worksheet_templates is
  'Private reusable multi-activity worksheet configurations; never patient, session or printed-document records.';

commit;
