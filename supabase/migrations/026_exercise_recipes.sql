-- Exercise Lab V1: private reusable configurations for one activity.
-- Additive only: worksheets, exercise drafts and content-bank records are unchanged.

begin;

create table public.exercise_recipes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null default 1,
  kind text not null,
  name text not null,
  description text,
  configuration jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint exercise_recipes_pkey primary key (id),
  constraint exercise_recipes_user_id_id_key unique (user_id, id),
  constraint exercise_recipes_schema_version_check check (schema_version >= 1),
  constraint exercise_recipes_kind_check check (length(btrim(kind)) > 0),
  constraint exercise_recipes_name_check check (length(btrim(name)) between 1 and 120),
  constraint exercise_recipes_description_check check (description is null or length(description) <= 500),
  constraint exercise_recipes_configuration_check check (jsonb_typeof(configuration) = 'object')
);

create index exercise_recipes_user_updated_idx
  on public.exercise_recipes (user_id, updated_at desc);

alter table public.exercise_recipes enable row level security;

create policy "exercise recipes select own"
  on public.exercise_recipes for select to authenticated
  using (user_id = auth.uid());

create policy "exercise recipes insert own"
  on public.exercise_recipes for insert to authenticated
  with check (user_id = auth.uid());

create policy "exercise recipes update own"
  on public.exercise_recipes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "exercise recipes delete own"
  on public.exercise_recipes for delete to authenticated
  using (user_id = auth.uid());

revoke all privileges on table public.exercise_recipes from public, anon, authenticated;
grant select, insert, update, delete on table public.exercise_recipes to authenticated;

comment on table public.exercise_recipes is
  'Private reusable Exercise Lab activity configurations; never Worksheet or patient snapshots.';

commit;
