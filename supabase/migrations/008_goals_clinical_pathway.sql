-- Optional Goal association with an existing ClinicalPathway.
-- Existing goals remain unassociated; no backfill is performed.

alter table public.goals
  add column clinical_pathway_id uuid;

alter table public.goals
  add constraint goals_clinical_pathway_fk
  foreign key (user_id, patient_id, clinical_pathway_id)
  references public.clinical_pathways (user_id, patient_id, id)
  on delete no action;

create index goals_user_pathway_status_idx
  on public.goals (user_id, clinical_pathway_id, status)
  where clinical_pathway_id is not null;

comment on column public.goals.clinical_pathway_id is
  'Optional clinical pathway association. NULL keeps the goal independent.';

-- The existing "own goals" RLS policy continues to isolate rows by user_id.
-- The composite foreign key additionally guarantees that any associated
-- pathway belongs to the same user and patient.
-- Migration 003 already grants authenticated CRUD on public.goals, including
-- columns added later, so no new table privilege is required here.

