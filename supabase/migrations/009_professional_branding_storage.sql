-- Private per-user professional logo storage.
-- Additive only: no existing tables or objects are changed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-branding',
  'professional-branding',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do nothing;

create policy "professional branding read own logo"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'professional-branding'
    and name = auth.uid()::text || '/logo.webp'
  );

create policy "professional branding insert own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'professional-branding'
    and name = auth.uid()::text || '/logo.webp'
  );

create policy "professional branding update own logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'professional-branding'
    and name = auth.uid()::text || '/logo.webp'
  )
  with check (
    bucket_id = 'professional-branding'
    and name = auth.uid()::text || '/logo.webp'
  );

create policy "professional branding delete own logo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'professional-branding'
    and name = auth.uid()::text || '/logo.webp'
  );
