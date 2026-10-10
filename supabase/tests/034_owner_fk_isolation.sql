-- PostgreSQL >=15; ONLY a new disposable local database named
-- armonia_owner_fk_test*. Uses the actual 034 migration, not a simulated FK.
-- Fixture covers these FKs only; it does not reproduce Supabase RLS or 033/economy triggers.
-- Example (database already created locally):
-- psql -X -v ON_ERROR_STOP=1 -d armonia_owner_fk_test -f supabase/tests/034_owner_fk_isolation.sql
\set ON_ERROR_STOP on
do $$ begin
  if current_database() not like 'armonia_owner_fk_test%' then
    raise exception 'Use a disposable local armonia_owner_fk_test database only';
  end if;
  if current_setting('server_version_num')::integer < 150000 then
    raise exception 'PostgreSQL >=15 required';
  end if;
  if to_regclass('public.patients') is not null or to_regclass('public.appointments') is not null
     or to_regclass('public.goals') is not null or to_regclass('public.sessions') is not null then
    raise exception 'Fixture requires an empty database; no existing tables will be changed';
  end if;
end $$;
create table public.patients (id uuid primary key, user_id uuid not null,
  constraint patients_user_id_id_key unique (user_id,id));
create table public.appointments (id uuid primary key, user_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade);
create table public.goals (id uuid primary key, user_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade);
create table public.sessions (id uuid primary key, user_id uuid not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  constraint sessions_user_patient_id_key unique(user_id,patient_id,id));
create index sessions_user_appointment_idx on public.sessions(user_id,appointment_id)
  where appointment_id is not null;
\ir ../migrations/034_owner_fk_isolation.sql

begin;
create temporary table owner_fk_test_context (id integer);
create function pg_temp.expect_fk_rejection(statement text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when foreign_key_violation then return;
  end;
  raise exception 'Expected foreign_key_violation: %', statement;
end $$;
create function pg_temp.assert_true(condition boolean, message text) returns void language plpgsql as $$
begin if condition is distinct from true then raise exception '%', message; end if; end $$;

-- A=...0001, B=...0002. Two patients belong to A and one to B.
insert into public.patients values
  ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000002');
insert into public.appointments values
  ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000012'),
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000021');
insert into public.goals values
  ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011');
insert into public.sessions values
  ('00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000402','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',null);

-- Cross-account patient rejected for each child table (INSERT and UPDATE).
do $$ declare t text; begin
  foreach t in array array['appointments','goals','sessions'] loop
    perform pg_temp.expect_fk_rejection(format(
      'insert into public.%I (id,user_id,patient_id) values (%L,%L,%L)', t,
      '00000000-0000-4000-8000-000000000999','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000021'));
    perform pg_temp.expect_fk_rejection(format(
      'update public.%I set patient_id=%L where user_id=%L', t,
      '00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001'));
  end loop;
end $$;
-- Foreign appointment and same-owner/different-patient appointment rejected.
select pg_temp.expect_fk_rejection($q$update public.sessions set appointment_id='00000000-0000-4000-8000-000000000201' where id='00000000-0000-4000-8000-000000000402'$q$);
select pg_temp.expect_fk_rejection($q$update public.sessions set appointment_id='00000000-0000-4000-8000-000000000102' where id='00000000-0000-4000-8000-000000000402'$q$);
-- Parent patient changes cannot rewrite clinical history silently.
select pg_temp.expect_fk_rejection($q$update public.appointments set patient_id='00000000-0000-4000-8000-000000000012' where id='00000000-0000-4000-8000-000000000101'$q$);

delete from public.appointments where id='00000000-0000-4000-8000-000000000101';
select pg_temp.assert_true((select appointment_id is null
  and user_id='00000000-0000-4000-8000-000000000001'
  and patient_id='00000000-0000-4000-8000-000000000011'
  from public.sessions where id='00000000-0000-4000-8000-000000000401'), 'Session must survive with only appointment_id cleared');
select pg_temp.assert_true((select count(*)=2 from public.sessions), 'Unlinked session must remain valid');

delete from public.patients where id='00000000-0000-4000-8000-000000000011';
select pg_temp.assert_true((select count(*)=0 from public.sessions), 'Patient deletion must cascade sessions');
select pg_temp.assert_true((select count(*)=0 from public.goals), 'Patient deletion must cascade goals');
-- Also exercise deletion with a still-linked appointment/session in the same cascade.
insert into public.sessions values
  ('00000000-0000-4000-8000-000000000403','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000102');
delete from public.patients where id='00000000-0000-4000-8000-000000000012';
select pg_temp.assert_true((select count(*)=0 from public.sessions), 'Patient deletion must cascade a linked session');
select pg_temp.assert_true((select count(*)=1 from public.appointments), 'Patient deletion must cascade only its appointments');
select pg_temp.assert_true((select count(*)=1 from public.patients), 'Other owner must remain intact');
rollback;
\echo 'Owner FK enforcement tests PASS (fixture schema remains in the disposable database)'
