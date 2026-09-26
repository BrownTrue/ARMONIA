-- Therapeutic Library V2: dormant quota and upload reservation foundation.
-- Additive only. Existing materials, objects and browser Storage policies are unchanged.

create table if not exists public.user_storage_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quota_bytes bigint not null default 1073741824 check (quota_bytes > 0),
  used_bytes bigint not null default 0 check (used_bytes >= 0),
  reserved_bytes bigint not null default 0 check (reserved_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.storage_upload_reservations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null unique,
  expected_bytes bigint not null check (expected_bytes > 0 and expected_bytes <= 20971520),
  object_path text not null unique,
  extension text not null check (extension in ('pdf','png','jpg','jpeg','mp3','m4a','wav','docx')),
  mime_type text not null,
  status text not null default 'pending' check (status in ('pending','cleanup_required','committed','released','failed')),
  failure_code text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  check (object_path like user_id::text || '/' || material_id::text || '/%')
);

create index if not exists storage_upload_reservations_user_status_idx
  on public.storage_upload_reservations (user_id, status, expires_at);

alter table public.user_storage_accounts enable row level security;
alter table public.storage_upload_reservations enable row level security;

revoke all on table public.user_storage_accounts from public, anon, authenticated;
revoke all on table public.storage_upload_reservations from public, anon, authenticated;
grant select, insert, update, delete on table public.user_storage_accounts to service_role;
grant select, insert, update, delete on table public.storage_upload_reservations to service_role;

create or replace function public.reserve_therapeutic_storage_upload(
  p_user_id uuid,
  p_reservation_id uuid,
  p_material_id uuid,
  p_expected_bytes bigint,
  p_object_path text,
  p_extension text,
  p_mime_type text,
  p_ttl_seconds integer default 10800
) returns public.storage_upload_reservations
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  account public.user_storage_accounts%rowtype;
  reservation public.storage_upload_reservations%rowtype;
begin
  if p_expected_bytes <= 0 or p_expected_bytes > 20971520 then raise exception 'invalid_file_size'; end if;
  -- Signed upload tokens currently live for two hours; require a later cleanup
  -- horizon so absence is never trusted while a token can still upload.
  if p_ttl_seconds < 7200 or p_ttl_seconds > 14400 then raise exception 'invalid_reservation_ttl'; end if;
  if p_object_path not like p_user_id::text || '/' || p_material_id::text || '/%' then raise exception 'invalid_object_path'; end if;

  insert into public.user_storage_accounts (user_id)
  select p_user_id
  where not exists (select 1 from public.user_storage_accounts where user_id = p_user_id)
    and not exists (select 1 from public.materials where user_id = p_user_id and storage_path is not null)
  on conflict (user_id) do nothing;

  select * into account from public.user_storage_accounts where user_id = p_user_id for update;
  if not found then raise exception 'storage_account_requires_reconciliation'; end if;

  -- Expiry alone never releases authoritative bytes: an object may already
  -- exist. Server-side cleanup must verify absence/removal first.
  update public.storage_upload_reservations
     set status = 'cleanup_required', failure_code = 'expired_cleanup_required'
   where user_id = p_user_id and status = 'pending' and expires_at <= now();

  if account.used_bytes + account.reserved_bytes + p_expected_bytes > account.quota_bytes then
    raise exception 'storage_quota_exceeded';
  end if;

  insert into public.storage_upload_reservations
    (id,user_id,material_id,expected_bytes,object_path,extension,mime_type,expires_at)
  values
    (p_reservation_id,p_user_id,p_material_id,p_expected_bytes,p_object_path,p_extension,p_mime_type,now() + make_interval(secs => p_ttl_seconds))
  returning * into reservation;

  update public.user_storage_accounts
     set reserved_bytes = reserved_bytes + p_expected_bytes, updated_at = now()
   where user_id = p_user_id;
  return reservation;
end;
$$;

create or replace function public.release_therapeutic_storage_reservation(
  p_user_id uuid,
  p_reservation_id uuid,
  p_failure_code text default null
) returns boolean
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare reservation public.storage_upload_reservations%rowtype;
begin
  -- Global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  select * into reservation from public.storage_upload_reservations
   where id = p_reservation_id and user_id = p_user_id for update;
  if not found or reservation.status not in ('pending','cleanup_required') then return false; end if;
  update public.user_storage_accounts
     set reserved_bytes = greatest(0, reserved_bytes - reservation.expected_bytes), updated_at = now()
   where user_id = p_user_id;
  update public.storage_upload_reservations
     set status = case when p_failure_code is null or p_failure_code = 'expired_cleaned' then 'released' else 'failed' end,
         failure_code = p_failure_code, completed_at = now()
   where id = p_reservation_id;
  return true;
end;
$$;

create or replace function public.require_therapeutic_storage_cleanup(
  p_user_id uuid,
  p_reservation_id uuid,
  p_failure_code text default 'cleanup_required'
) returns boolean
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  -- Global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  update public.storage_upload_reservations
     set status = 'cleanup_required', failure_code = p_failure_code, completed_at = null
   where id = p_reservation_id and user_id = p_user_id
     and status in ('pending','cleanup_required');
  return found;
end;
$$;

create or replace function public.claim_expired_therapeutic_storage_cleanup(
  p_user_id uuid
) returns setof public.storage_upload_reservations
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  -- Global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  update public.storage_upload_reservations
     set status = 'cleanup_required', failure_code = 'expired_cleanup_required'
   where user_id = p_user_id and status = 'pending' and expires_at <= now();
  return query
    select * from public.storage_upload_reservations
     where user_id = p_user_id and status = 'cleanup_required'
     order by created_at
     for update skip locked;
end;
$$;

create or replace function public.commit_therapeutic_storage_upload(
  p_user_id uuid,
  p_reservation_id uuid,
  p_verified_bytes bigint,
  p_title text,
  p_description text,
  p_category text,
  p_tags text[],
  p_file_name text,
  p_patient_ids uuid[],
  p_is_favorite boolean default false
) returns uuid
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare reservation public.storage_upload_reservations%rowtype;
declare valid_patient_count integer;
begin
  -- Global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  select * into reservation from public.storage_upload_reservations
   where id = p_reservation_id and user_id = p_user_id for update;
  if not found then raise exception 'reservation_not_available'; end if;
  if reservation.status = 'committed' then
    if exists (
      select 1 from public.materials
       where id = reservation.material_id and user_id = p_user_id
    ) then return reservation.material_id;
    end if;
    raise exception 'committed_material_missing';
  end if;
  if reservation.status <> 'pending' then raise exception 'reservation_not_available'; end if;
  if reservation.expires_at <= now() then raise exception 'reservation_expired'; end if;
  if p_verified_bytes <> reservation.expected_bytes or p_verified_bytes > 20971520 then raise exception 'verified_size_mismatch'; end if;
  if nullif(btrim(p_title), '') is null then raise exception 'material_title_required'; end if;

  select count(*) into valid_patient_count from public.patients
   where user_id = p_user_id and id = any(coalesce(p_patient_ids, '{}'::uuid[]));
  if valid_patient_count <> cardinality(coalesce(p_patient_ids, '{}'::uuid[])) then raise exception 'invalid_patient_association'; end if;

  insert into public.materials
    (id,user_id,title,description,category,tags,file_name,storage_path,mime_type,file_size,external_url,is_favorite,updated_at)
  values
    (reservation.material_id,p_user_id,btrim(p_title),nullif(btrim(p_description),''),p_category,coalesce(p_tags,'{}'),p_file_name,reservation.object_path,reservation.mime_type,p_verified_bytes,null,p_is_favorite,now());

  insert into public.patient_materials (patient_id,material_id)
  select unnest(coalesce(p_patient_ids, '{}'::uuid[])), reservation.material_id;

  update public.user_storage_accounts
     set reserved_bytes = greatest(0, reserved_bytes - reservation.expected_bytes),
         used_bytes = used_bytes + p_verified_bytes, updated_at = now()
   where user_id = p_user_id;
  update public.storage_upload_reservations
     set status = 'committed', completed_at = now(), failure_code = null
   where id = p_reservation_id;
  return reservation.material_id;
end;
$$;

create or replace function public.delete_therapeutic_material_record(
  p_user_id uuid,
  p_material_id uuid
) returns boolean
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare bytes bigint;
begin
  -- Global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  select coalesce(file_size,0) into bytes from public.materials
   where id = p_material_id and user_id = p_user_id for update;
  if not found then return false; end if;
  delete from public.materials where id = p_material_id and user_id = p_user_id;
  update public.user_storage_accounts
     set used_bytes = greatest(0, used_bytes - bytes), updated_at = now()
   where user_id = p_user_id;
  return true;
end;
$$;

create or replace function public.initialize_user_storage_account(
  p_user_id uuid,
  p_verified_used_bytes bigint,
  p_quota_bytes bigint default 1073741824
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_verified_used_bytes < 0 or p_quota_bytes <= 0 then raise exception 'invalid_storage_account_values'; end if;
  if exists (
    select 1 from public.storage_upload_reservations
     where user_id = p_user_id and status in ('pending','cleanup_required')
  ) then raise exception 'active_storage_reservations'; end if;
  insert into public.user_storage_accounts (user_id,quota_bytes,used_bytes,reserved_bytes,updated_at)
  values (p_user_id,p_quota_bytes,p_verified_used_bytes,0,now());
end;
$$;

create or replace function public.reconcile_user_storage_account(
  p_user_id uuid,
  p_verified_used_bytes bigint,
  p_quota_bytes bigint default null
) returns void
language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if p_verified_used_bytes < 0 or (p_quota_bytes is not null and p_quota_bytes <= 0) then raise exception 'invalid_storage_account_values'; end if;
  -- Explicit repair path; global lock order: account -> reservation -> material.
  perform 1 from public.user_storage_accounts where user_id = p_user_id for update;
  if not found then raise exception 'storage_account_not_initialized'; end if;
  if exists (
    select 1 from public.storage_upload_reservations
     where user_id = p_user_id and status in ('pending','cleanup_required')
  ) then raise exception 'active_storage_reservations'; end if;
  update public.user_storage_accounts
     set used_bytes = p_verified_used_bytes,
         quota_bytes = coalesce(p_quota_bytes, quota_bytes),
         updated_at = now()
   where user_id = p_user_id;
end;
$$;

revoke all on function public.reserve_therapeutic_storage_upload(uuid,uuid,uuid,bigint,text,text,text,integer) from public, anon, authenticated;
revoke all on function public.release_therapeutic_storage_reservation(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.require_therapeutic_storage_cleanup(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.claim_expired_therapeutic_storage_cleanup(uuid) from public, anon, authenticated;
revoke all on function public.commit_therapeutic_storage_upload(uuid,uuid,bigint,text,text,text,text[],text,uuid[],boolean) from public, anon, authenticated;
revoke all on function public.delete_therapeutic_material_record(uuid,uuid) from public, anon, authenticated;
revoke all on function public.initialize_user_storage_account(uuid,bigint,bigint) from public, anon, authenticated;
revoke all on function public.reconcile_user_storage_account(uuid,bigint,bigint) from public, anon, authenticated;
grant execute on function public.reserve_therapeutic_storage_upload(uuid,uuid,uuid,bigint,text,text,text,integer) to service_role;
grant execute on function public.release_therapeutic_storage_reservation(uuid,uuid,text) to service_role;
grant execute on function public.require_therapeutic_storage_cleanup(uuid,uuid,text) to service_role;
grant execute on function public.claim_expired_therapeutic_storage_cleanup(uuid) to service_role;
grant execute on function public.commit_therapeutic_storage_upload(uuid,uuid,bigint,text,text,text,text[],text,uuid[],boolean) to service_role;
grant execute on function public.delete_therapeutic_material_record(uuid,uuid) to service_role;
grant execute on function public.initialize_user_storage_account(uuid,bigint,bigint) to service_role;
grant execute on function public.reconcile_user_storage_account(uuid,bigint,bigint) to service_role;

comment on table public.user_storage_accounts is 'Server-only authoritative quota counters for Therapeutic Library Storage V2.';
comment on table public.storage_upload_reservations is 'Short-lived atomic byte reservations for direct signed Storage uploads.';
