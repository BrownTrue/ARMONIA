-- RLS decides which rows are accessible; these grants allow authenticated
-- users to reach the tables so that the policies can be evaluated.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.patients,
  public.appointments,
  public.goals,
  public.sessions,
  public.materials,
  public.session_goals,
  public.session_materials,
  public.patient_materials
to authenticated;

