-- Minimal direct table privileges required by the server-side Therapeutic Library V2 routes.
-- Quota mutations and storage-backed material deletion remain inside the
-- SECURITY DEFINER functions introduced by migration 014.

grant select, insert, update on table public.materials to service_role;
grant insert, delete on table public.patient_materials to service_role;
grant select on table public.patients to service_role;
