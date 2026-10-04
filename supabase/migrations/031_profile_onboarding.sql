begin;

alter table public.profiles
  add column onboarding_completed_at timestamptz null;

comment on column public.profiles.onboarding_completed_at is
  'When the user completed the initial ARMONIA onboarding. Legacy profiles are marked at migration time.';

update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;

commit;
