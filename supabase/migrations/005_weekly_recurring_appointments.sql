-- Weekly recurring appointments.
-- Each occurrence remains an independent appointment; this nullable identifier
-- only groups occurrences that were created as part of the same series.

alter table public.appointments
  add column if not exists recurrence_series_id uuid;

create index if not exists appointments_user_recurrence_series_idx
  on public.appointments (user_id, recurrence_series_id)
  where recurrence_series_id is not null;

comment on column public.appointments.recurrence_series_id is
  'Shared identifier for independently editable appointment occurrences in one recurrence series.';

-- The existing "own appointments" RLS policy continues to isolate rows by
-- user_id. The table-level authenticated grant from migration 003 also covers
-- this nullable column, so no broader policy or privilege is introduced here.
