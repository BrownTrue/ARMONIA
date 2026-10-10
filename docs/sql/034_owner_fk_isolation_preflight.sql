-- READ ONLY. Run manually with visibility across all accounts, not an RLS-filtered user.
-- Does not extract names, notes or clinical payloads. Do not run the migration
-- if blockers exist or the live definitions differ from the versioned schema.
select current_setting('server_version') as server_version,
       current_setting('server_version_num')::integer >= 150000 as supports_selective_set_null;

select c.conrelid::regclass::text as table_name, c.conname, c.contype,
       c.convalidated, c.condeferrable, pg_get_constraintdef(c.oid, true) as definition
from pg_constraint c
where c.conrelid in ('public.patients'::regclass, 'public.appointments'::regclass,
                    'public.goals'::regclass, 'public.sessions'::regclass,
                    'public.session_goals'::regclass, 'public.session_materials'::regclass,
                    'public.patient_materials'::regclass)
   or c.confrelid in ('public.patients'::regclass, 'public.appointments'::regclass,
                     'public.goals'::regclass, 'public.sessions'::regclass)
order by table_name, c.conname;

select table_name, column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public' and table_name in ('patients','appointments','goals','sessions')
  and column_name in ('id','user_id','patient_id','appointment_id')
order by table_name, ordinal_position;

select i.indrelid::regclass::text as table_name, i.indexrelid::regclass::text as index_name,
       i.indisunique, i.indisvalid, pg_get_indexdef(i.indexrelid) as definition
from pg_index i
where i.indrelid in ('public.patients'::regclass, 'public.appointments'::regclass,
                    'public.goals'::regclass, 'public.sessions'::regclass)
order by table_name, index_name;

select t.tgrelid::regclass::text as table_name, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid, true) as definition
from pg_trigger t
where not t.tgisinternal and t.tgrelid in ('public.patients'::regclass,
  'public.appointments'::regclass, 'public.goals'::regclass, 'public.sessions'::regclass)
order by table_name, t.tgname;

-- All three counts other than total must be zero before applying 034.
with children as (
  select 'appointments'::text as table_name, user_id, patient_id from public.appointments
  union all select 'goals', user_id, patient_id from public.goals
  union all select 'sessions', user_id, patient_id from public.sessions
)
select c.table_name, count(*) as total,
  count(*) filter (where c.user_id is null or c.patient_id is null) as invalid_nulls,
  count(*) filter (where c.patient_id is not null and p.id is null) as missing_patient,
  count(*) filter (where p.id is not null and c.user_id is distinct from p.user_id) as different_owner
from children c left join public.patients p on p.id = c.patient_id
group by c.table_name order by c.table_name;

select count(*) as total_sessions,
  count(*) filter (where s.appointment_id is null) as legitimate_unlinked_sessions,
  count(*) filter (where s.appointment_id is not null and a.id is null) as missing_appointment,
  count(*) filter (where a.id is not null and s.user_id is distinct from a.user_id) as different_owner,
  count(*) filter (where a.id is not null and s.user_id = a.user_id
    and s.patient_id is distinct from a.patient_id) as same_owner_different_patient,
  count(*) filter (where s.appointment_id is not null and (a.id is null
    or s.user_id is distinct from a.user_id or s.patient_id is distinct from a.patient_id)) as blocking_rows
from public.sessions s left join public.appointments a on a.id = s.appointment_id;

select 'session_goals' as relation, count(*) as total,
  count(*) filter (where s.id is null or g.id is null) as missing_reference,
  count(*) filter (where s.id is not null and g.id is not null
    and s.user_id is distinct from g.user_id) as different_owner,
  count(*) filter (where s.id is not null and g.id is not null
    and s.user_id = g.user_id and s.patient_id is distinct from g.patient_id) as same_owner_different_patient
from public.session_goals x left join public.sessions s on s.id=x.session_id
left join public.goals g on g.id=x.goal_id
union all
select 'session_materials', count(*),
  count(*) filter (where s.id is null or m.id is null),
  count(*) filter (where s.id is not null and m.id is not null and s.user_id is distinct from m.user_id),
  null::bigint
from public.session_materials x left join public.sessions s on s.id=x.session_id
left join public.materials m on m.id=x.material_id
union all
select 'patient_materials', count(*),
  count(*) filter (where p.id is null or m.id is null),
  count(*) filter (where p.id is not null and m.id is not null and p.user_id is distinct from m.user_id),
  null::bigint
from public.patient_materials x left join public.patients p on p.id=x.patient_id
left join public.materials m on m.id=x.material_id;

-- Must be zero. Normally guaranteed by the existing primary key.
select count(*) as duplicate_appointment_identity_groups
from (select user_id, patient_id, id from public.appointments
      group by user_id, patient_id, id having count(*) > 1) duplicates;
