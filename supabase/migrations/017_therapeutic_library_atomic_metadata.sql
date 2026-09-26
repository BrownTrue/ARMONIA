-- Atomic metadata and patient-association writes for therapeutic materials.
-- This migration is additive and must be applied manually before deploying the
-- route that calls this function.

create or replace function public.save_therapeutic_material_metadata(
  p_user_id uuid,
  p_material_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_tags text[],
  p_external_url text,
  p_patient_ids uuid[],
  p_is_favorite boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  existing_material public.materials%rowtype;
  requested_patient_count bigint;
  owned_patient_count bigint;
begin
  if p_user_id is null or p_material_id is null then
    raise exception 'invalid_material_request';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'material_title_required';
  end if;

  select count(distinct patient_id)
    into requested_patient_count
    from unnest(coalesce(p_patient_ids, array[]::uuid[])) as requested(patient_id);

  select count(*)
    into owned_patient_count
    from public.patients
   where user_id = p_user_id
     and id = any(coalesce(p_patient_ids, array[]::uuid[]));

  if owned_patient_count <> requested_patient_count then
    raise exception 'invalid_patient_association';
  end if;

  select *
    into existing_material
    from public.materials
   where id = p_material_id
     and user_id = p_user_id
   for update;

  if found then
    if existing_material.storage_path is null then
      if nullif(btrim(p_external_url), '') is null
         or btrim(p_external_url) !~* '^https?://[^[:space:]]+$' then
        raise exception 'invalid_external_url';
      end if;

      update public.materials
         set title = btrim(p_title),
             description = nullif(btrim(coalesce(p_description, '')), ''),
             category = coalesce(nullif(btrim(p_category), ''), 'altro'),
             tags = coalesce(p_tags, array[]::text[]),
             external_url = btrim(p_external_url),
             is_favorite = coalesce(p_is_favorite, false),
             updated_at = now()
       where id = p_material_id and user_id = p_user_id;
    else
      update public.materials
         set title = btrim(p_title),
             description = nullif(btrim(coalesce(p_description, '')), ''),
             category = coalesce(nullif(btrim(p_category), ''), 'altro'),
             tags = coalesce(p_tags, array[]::text[]),
             is_favorite = coalesce(p_is_favorite, false),
             updated_at = now()
       where id = p_material_id and user_id = p_user_id;
    end if;
  else
    if nullif(btrim(p_external_url), '') is null
       or btrim(p_external_url) !~* '^https?://[^[:space:]]+$' then
      raise exception 'invalid_external_url';
    end if;

    insert into public.materials (
      id, user_id, title, description, category, tags, file_name,
      storage_path, mime_type, file_size, external_url, is_favorite
    ) values (
      p_material_id, p_user_id, btrim(p_title),
      nullif(btrim(coalesce(p_description, '')), ''),
      coalesce(nullif(btrim(p_category), ''), 'altro'),
      coalesce(p_tags, array[]::text[]), null, null, null, 0,
      btrim(p_external_url), coalesce(p_is_favorite, false)
    );
  end if;

  delete from public.patient_materials where material_id = p_material_id;

  insert into public.patient_materials (patient_id, material_id)
  select distinct patient_id, p_material_id
    from unnest(coalesce(p_patient_ids, array[]::uuid[])) as requested(patient_id);

  return p_material_id;
end;
$$;

revoke all on function public.save_therapeutic_material_metadata(uuid, uuid, text, text, text, text[], text, uuid[], boolean) from public, anon, authenticated;
grant execute on function public.save_therapeutic_material_metadata(uuid, uuid, text, text, text, text[], text, uuid[], boolean) to service_role;
