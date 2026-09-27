-- E1 economic foundation: a session is the historical source of the
-- service actually delivered. Existing sessions remain unchanged.

begin;

alter table public.sessions
  add column service_id uuid,
  add column service_name_snapshot text,
  add column effective_price_cents integer;

alter table public.sessions
  add constraint sessions_service_owner_fk
    foreign key (user_id, service_id)
    references public.appointment_services (user_id, id)
    on delete set null (service_id),
  add constraint sessions_effective_price_check
    check (effective_price_cents is null or effective_price_cents >= 0);

create index sessions_user_service_occurred_idx
  on public.sessions (user_id, service_id, occurred_at)
  where service_id is not null;

comment on column public.sessions.service_id is
  'Optional current catalog reference for the service delivered in this session.';
comment on column public.sessions.service_name_snapshot is
  'Historical service name copied when the session is recorded; independent from the catalog.';
comment on column public.sessions.effective_price_cents is
  'Historical delivered price in euro cents. NULL means not specified; zero means free.';

commit;
