begin;

alter table public.patient_worksheets
  add column assigned_home_at timestamptz;

comment on column public.patient_worksheets.assigned_home_at is
  'Timestamp facoltativo che indica quando la scheda è stata segnata come assegnata a casa.';

commit;
