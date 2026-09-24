begin;

alter table public.clinical_assessments
  drop constraint if exists clinical_assessments_module_type_check,
  drop constraint if exists clinical_assessments_assessment_type_check,
  drop constraint if exists clinical_assessments_schema_version_check;

alter table public.clinical_assessments
  alter column module_type drop not null;

alter table public.clinical_assessments
  drop constraint if exists clinical_assessments_version_shape_check;

alter table public.clinical_assessments
  add constraint clinical_assessments_version_shape_check
  check (
    (
      schema_version = 1
      and module_type is not null
      and module_type = 'language_communication'
      and assessment_type = 'initial'
    )
    or
    (
      schema_version = 2
      and module_type is null
      and assessment_type in (
        'initial',
        'reassessment',
        'interim',
        'other'
      )
    )
  )
  not valid;

alter table public.clinical_assessments
  validate constraint clinical_assessments_version_shape_check;

comment on column public.clinical_assessments.module_type is
  'V1 single-module discriminator; NULL for multi-module V2 assessments whose modules live in data.modules.';

comment on constraint clinical_assessments_version_shape_check
  on public.clinical_assessments is
  'Keeps V1 and V2 discriminants mutually consistent without inspecting versioned JSONB payloads.';

commit;
