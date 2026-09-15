-- Google Calendar production token store and synchronization state.
-- Additive migration: it does not alter existing clinical tables or data.

create table if not exists public.google_calendar_connections (
  user_id uuid primary key
    references auth.users(id) on delete cascade,

  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  token_expires_at timestamptz not null,

  calendar_id text not null,

  name_format text not null default 'first_initial'
    check (
      name_format in (
        'first_initial',
        'full',
        'initials'
      )
    ),

  reminder_minutes integer not null default 30
    check (
      reminder_minutes between 0 and 40320
    ),

  sync_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.google_calendar_connections is
  'Server-only encrypted Google OAuth connection and calendar preferences.';

comment on column public.google_calendar_connections.access_token_ciphertext is
  'AES-256-GCM encrypted access token envelope. Never exposed to the browser.';

comment on column public.google_calendar_connections.refresh_token_ciphertext is
  'AES-256-GCM encrypted refresh token envelope. Never exposed to the browser.';


create table if not exists public.google_calendar_event_links (
  user_id uuid not null
    references auth.users(id) on delete cascade,

  -- Deliberately not a foreign key: the mapping must survive temporarily
  -- after appointment deletion so Google deletion can be retried safely.
  appointment_id uuid not null,

  google_event_id text,

  desired_action text not null default 'upsert'
    check (
      desired_action in (
        'upsert',
        'delete'
      )
    ),

  sync_status text not null default 'pending'
    check (
      sync_status in (
        'pending',
        'syncing',
        'synced',
        'error'
      )
    ),

  attempt_count integer not null default 0
    check (attempt_count >= 0),

  last_error text,
  last_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, appointment_id)
);

create unique index if not exists
  google_calendar_event_links_user_event_unique
on public.google_calendar_event_links (user_id, google_event_id)
where google_event_id is not null;

create index if not exists
  google_calendar_event_links_pending_idx
on public.google_calendar_event_links (user_id, sync_status, updated_at)
where sync_status in ('pending', 'error');

comment on table public.google_calendar_event_links is
  'Server-only Google event mappings and retryable synchronization state.';


alter table public.google_calendar_connections
  enable row level security;

alter table public.google_calendar_event_links
  enable row level security;


-- OAuth tokens and synchronization internals must never be reachable
-- through the browser Supabase client, including by their owner.
revoke all on table public.google_calendar_connections
  from anon, authenticated;

revoke all on table public.google_calendar_event_links
  from anon, authenticated;

-- No authenticated-user RLS policies are deliberately created.
-- Server-side access will use the service role after independently
-- validating the currently authenticated Supabase user.
