-- Therapeutic Library V2 cutover. Apply only after the signed-upload flow is deployed and verified.
-- Reading remains private and available to the owning authenticated user.

update storage.buckets
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array[
      'application/pdf','image/png','image/jpeg','audio/mpeg','audio/mp3',
      'audio/mp4','audio/x-m4a','audio/m4a','audio/wav','audio/x-wav','audio/wave',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
where id = 'therapy-materials';

drop policy if exists "private material write" on storage.objects;
drop policy if exists "private material update" on storage.objects;
drop policy if exists "private material delete" on storage.objects;

-- All material writes become server-owned. The authenticated role retains
-- SELECT (subject to RLS), but cannot forge ownership/storage accounting or
-- insert external-link rows outside the authenticated application endpoint.
revoke all privileges on table public.materials from authenticated;
grant select on table public.materials to authenticated;

-- Upload and delete mutations now require short-lived signed upload credentials
-- or the server-side service role. Material deletion is also server-owned.
-- The existing owner-scoped SELECT policy remains.
