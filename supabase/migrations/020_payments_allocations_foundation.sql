-- E2A: payments are money received; allocations attribute that money to sessions.
-- Additive only: no existing session is updated and no payment is backfilled.

begin;

alter table public.sessions
  add constraint sessions_user_patient_id_key unique (user_id, patient_id, id);

create table public.payments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  patient_id uuid not null,
  amount_cents integer not null check (amount_cents > 0),
  paid_at timestamptz not null,
  method text not null check (method in ('cash', 'bank_transfer', 'card', 'other')),
  note text,
  status text not null default 'active' check (status in ('active', 'voided')),
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_voided_at_check check (
    (status = 'active' and voided_at is null)
    or (status = 'voided' and voided_at is not null)
  ),
  constraint payments_user_patient_fk
    foreign key (user_id, patient_id)
    references public.patients (user_id, id)
    on delete restrict,
  constraint payments_user_patient_id_key unique (user_id, patient_id, id)
);

create table public.payment_allocations (
  user_id uuid not null,
  patient_id uuid not null,
  payment_id uuid not null,
  session_id uuid not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  primary key (payment_id, session_id),
  constraint payment_allocations_payment_fk
    foreign key (user_id, patient_id, payment_id)
    references public.payments (user_id, patient_id, id)
    on delete restrict,
  constraint payment_allocations_session_fk
    foreign key (user_id, patient_id, session_id)
    references public.sessions (user_id, patient_id, id)
    on delete restrict
);

create index payments_user_patient_paid_idx
  on public.payments (user_id, patient_id, paid_at desc);
create index payments_user_status_paid_idx
  on public.payments (user_id, status, paid_at desc);
create index payment_allocations_user_session_idx
  on public.payment_allocations (user_id, session_id);

alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;

create policy "payments select own"
  on public.payments for select to authenticated
  using (user_id = auth.uid());

create policy "payment allocations select own"
  on public.payment_allocations for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.payments from public, anon, authenticated;
revoke all on table public.payment_allocations from public, anon, authenticated;
grant select on table public.payments to authenticated;
grant select on table public.payment_allocations to authenticated;

create or replace function public.create_economic_payment(
  p_payment_id uuid,
  p_patient_id uuid,
  p_amount_cents integer,
  p_paid_at timestamptz,
  p_method text,
  p_note text,
  p_allocations jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_allocation record;
  v_session public.sessions%rowtype;
  v_total integer := 0;
  v_existing integer;
begin
  if v_user_id is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'invalid_payment_amount' using errcode = '22023'; end if;
  if p_paid_at is null then raise exception 'invalid_paid_at' using errcode = '22023'; end if;
  if p_method is null or p_method not in ('cash', 'bank_transfer', 'card', 'other') then raise exception 'invalid_payment_method' using errcode = '22023'; end if;
  if p_allocations is null or jsonb_typeof(p_allocations) <> 'array' then raise exception 'invalid_allocations' using errcode = '22023'; end if;

  perform 1 from public.patients p where p.user_id = v_user_id and p.id = p_patient_id for update;
  if not found then raise exception 'patient_not_found' using errcode = 'P0002'; end if;

  if exists (
    select 1 from (
      select allocation.session_id
      from jsonb_to_recordset(p_allocations) as allocation(session_id uuid, amount_cents integer)
      group by allocation.session_id having count(*) > 1
    ) duplicates
  ) then raise exception 'duplicate_session_allocation' using errcode = '23505'; end if;

  -- Session row locks serialize concurrent payments and price changes.
  for v_allocation in
    select allocation.session_id, allocation.amount_cents
    from jsonb_to_recordset(p_allocations) as allocation(session_id uuid, amount_cents integer)
    order by allocation.session_id
  loop
    if v_allocation.session_id is null or v_allocation.amount_cents is null or v_allocation.amount_cents <= 0 then
      raise exception 'invalid_allocation' using errcode = '22023';
    end if;
    select * into v_session
      from public.sessions s
      where s.user_id = v_user_id and s.patient_id = p_patient_id and s.id = v_allocation.session_id
      for update;
    if not found then raise exception 'session_not_found_or_patient_mismatch' using errcode = 'P0002'; end if;
    if v_session.effective_price_cents is null or v_session.effective_price_cents <= 0 then
      raise exception 'session_price_not_allocatable' using errcode = '23514';
    end if;
    select coalesce(sum(a.amount_cents), 0)::integer into v_existing
      from public.payment_allocations a
      join public.payments p on p.user_id = a.user_id and p.patient_id = a.patient_id and p.id = a.payment_id
      where a.user_id = v_user_id and a.session_id = v_session.id and p.status = 'active';
    if v_existing + v_allocation.amount_cents > v_session.effective_price_cents then
      raise exception 'session_overallocated' using errcode = '23514';
    end if;
    v_total := v_total + v_allocation.amount_cents;
  end loop;

  if v_total > p_amount_cents then raise exception 'payment_overallocated' using errcode = '23514'; end if;

  insert into public.payments (id, user_id, patient_id, amount_cents, paid_at, method, note)
  values (p_payment_id, v_user_id, p_patient_id, p_amount_cents, p_paid_at, p_method, nullif(btrim(p_note), ''));

  insert into public.payment_allocations (user_id, patient_id, payment_id, session_id, amount_cents)
  select v_user_id, p_patient_id, p_payment_id, allocation.session_id, allocation.amount_cents
  from jsonb_to_recordset(p_allocations) as allocation(session_id uuid, amount_cents integer);

  return p_payment_id;
end;
$$;

create or replace function public.void_economic_payment(p_payment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  select status into v_status from public.payments
    where user_id = v_user_id and id = p_payment_id for update;
  if not found then raise exception 'payment_not_found' using errcode = 'P0002'; end if;
  if v_status = 'voided' then return false; end if;
  update public.payments
    set status = 'voided', voided_at = now(), updated_at = now()
    where user_id = v_user_id and id = p_payment_id;
  return true;
end;
$$;

create or replace function public.enforce_session_payment_floor()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_allocated integer;
begin
  if new.effective_price_cents is not distinct from old.effective_price_cents then return new; end if;
  select coalesce(sum(a.amount_cents), 0)::integer into v_allocated
    from public.payment_allocations a
    join public.payments p on p.user_id = a.user_id and p.patient_id = a.patient_id and p.id = a.payment_id
    where a.user_id = old.user_id and a.session_id = old.id and p.status = 'active';
  if v_allocated > 0 and (new.effective_price_cents is null or new.effective_price_cents < v_allocated) then
    raise exception 'session_price_below_allocated_amount' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger sessions_enforce_payment_floor
before update of effective_price_cents on public.sessions
for each row execute function public.enforce_session_payment_floor();

revoke all on function public.create_economic_payment(uuid, uuid, integer, timestamptz, text, text, jsonb) from public, anon;
revoke all on function public.void_economic_payment(uuid) from public, anon;
revoke all on function public.enforce_session_payment_floor() from public, anon, authenticated;
grant execute on function public.create_economic_payment(uuid, uuid, integer, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.void_economic_payment(uuid) to authenticated;

comment on table public.payments is 'Money actually received from one patient; unallocated remainder is patient credit.';
comment on table public.payment_allocations is 'Portions of payments attributed to delivered sessions; payment state is derived, never stored on sessions.';

commit;
