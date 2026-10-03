begin;

alter table public.appointment_services
  add column color text null;

alter table public.appointment_services
  add constraint appointment_services_color_check
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.profiles
  add column calendar_color_mode text not null default 'location';

alter table public.profiles
  add constraint profiles_calendar_color_mode_check
  check (calendar_color_mode in ('location', 'service'));

comment on column public.appointment_services.color is
  'Optional calendar color in #RRGGBB format. Existing services remain uncolored.';

comment on column public.profiles.calendar_color_mode is
  'Determines whether calendar appointments use location or service colors.';

commit;
