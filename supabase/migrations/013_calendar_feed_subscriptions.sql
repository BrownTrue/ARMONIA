-- Private, read-only iCalendar feed subscriptions.
--
-- This migration is additive. It creates no subscriptions automatically and
-- does not modify appointments, patients, sessions, clinical data, or Google
-- Calendar tables. The application accesses subscriptions server-side only.

create table if not exists public.calendar_feed_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_encrypted text not null,
  enabled boolean not null default true,
  title_format text not null default 'abbreviated'
    check (title_format in ('abbreviated', 'full', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rotated_at timestamptz
);

alter table public.calendar_feed_subscriptions enable row level security;

revoke all on table public.calendar_feed_subscriptions
  from public, anon, authenticated;
grant select, insert, update, delete on table public.calendar_feed_subscriptions
  to service_role;

create index if not exists appointments_user_starts_at_idx
  on public.appointments (user_id, starts_at);

comment on table public.calendar_feed_subscriptions is
  'Server-only bearer subscriptions for the read-only Armonia iCalendar feed.';
comment on column public.calendar_feed_subscriptions.token_hash is
  'SHA-256 hash used to resolve a bearer token without storing it in clear text.';
comment on column public.calendar_feed_subscriptions.token_encrypted is
  'AES-GCM encrypted bearer token, recoverable only by the application server.';

