begin;

alter table public.appointments
  add column recurrence_position integer null;

-- One-time legacy backfill: the original occurrence order was never stored.
-- Freeze the current chronological order as the canonical series order from
-- this migration onward; the appointment id is the deterministic tie-breaker.
with ranked_occurrences as (
  select
    id,
    row_number() over (
      partition by recurrence_series_id
      order by starts_at, id
    ) - 1 as recurrence_position_rank
  from public.appointments
  where recurrence_series_id is not null
)
update public.appointments as appointment
set recurrence_position = ranked.recurrence_position_rank::integer
from ranked_occurrences as ranked
where appointment.id = ranked.id;

alter table public.appointments
  add constraint appointments_recurrence_position_check
  check (
    recurrence_position is null
    or (
      recurrence_series_id is not null
      and recurrence_position >= 0
    )
  );

create unique index appointments_recurrence_series_position_unique
  on public.appointments (recurrence_series_id, recurrence_position)
  where recurrence_series_id is not null
    and recurrence_position is not null;

comment on column public.appointments.recurrence_position is
  'Immutable zero-based occurrence position within a materialized recurrence series. Legacy series are ordered once by current starts_at and id during migration 032.';

commit;
