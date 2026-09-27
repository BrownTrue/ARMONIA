-- Calendar V2 foundations: user-owned locations, services and optional
-- appointment snapshots. Additive and backward-compatible: existing
-- appointments remain unchanged and receive no automatic backfill.

create table public.appointment_locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  address text,
  city text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointment_locations_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint appointment_locations_color_check
    check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint appointment_locations_display_order_check
    check (display_order >= 0),
  constraint appointment_locations_user_id_id_key
    unique (user_id, id)
);

create table public.appointment_services (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  default_duration_minutes integer not null default 45,
  default_price_cents integer,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointment_services_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint appointment_services_duration_check
    check (default_duration_minutes between 5 and 1440),
  constraint appointment_services_price_check
    check (default_price_cents is null or default_price_cents >= 0),
  constraint appointment_services_display_order_check
    check (display_order >= 0),
  constraint appointment_services_user_id_id_key
    unique (user_id, id)
);

alter table public.appointments
  add column location_id uuid,
  add column service_id uuid,
  add column location_name_snapshot text,
  add column service_name_snapshot text,
  add column effective_price_cents integer;

alter table public.appointments
  add constraint appointments_location_owner_fk
    foreign key (user_id, location_id)
    references public.appointment_locations (user_id, id)
    on delete restrict,
  add constraint appointments_service_owner_fk
    foreign key (user_id, service_id)
    references public.appointment_services (user_id, id)
    on delete restrict,
  add constraint appointments_effective_price_check
    check (effective_price_cents is null or effective_price_cents >= 0);

create index appointment_locations_user_active_order_idx
  on public.appointment_locations (user_id, is_active, display_order, name);

create index appointment_services_user_active_order_idx
  on public.appointment_services (user_id, is_active, display_order, name);

create index appointments_user_location_starts_idx
  on public.appointments (user_id, location_id, starts_at)
  where location_id is not null;

create index appointments_user_service_starts_idx
  on public.appointments (user_id, service_id, starts_at)
  where service_id is not null;

alter table public.appointment_locations enable row level security;
alter table public.appointment_services enable row level security;

create policy "appointment locations select own"
  on public.appointment_locations for select
  to authenticated
  using (user_id = auth.uid());

create policy "appointment locations insert own"
  on public.appointment_locations for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "appointment locations update own"
  on public.appointment_locations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "appointment locations delete own"
  on public.appointment_locations for delete
  to authenticated
  using (user_id = auth.uid());

create policy "appointment services select own"
  on public.appointment_services for select
  to authenticated
  using (user_id = auth.uid());

create policy "appointment services insert own"
  on public.appointment_services for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "appointment services update own"
  on public.appointment_services for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "appointment services delete own"
  on public.appointment_services for delete
  to authenticated
  using (user_id = auth.uid());

revoke all on table public.appointment_locations
  from public, anon, authenticated;
revoke all on table public.appointment_services
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.appointment_locations
  to authenticated;
grant select, insert, update, delete
  on table public.appointment_services
  to authenticated;

comment on table public.appointment_locations is
  'User-owned appointment locations. Historical references are preserved by restrictive foreign keys.';
comment on table public.appointment_services is
  'User-owned appointment service defaults. Appointments retain effective duration, price and name snapshots.';
comment on column public.appointments.effective_price_cents is
  'Effective appointment price in euro cents. NULL means not specified; zero means free.';
