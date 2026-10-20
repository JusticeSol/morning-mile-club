-- =====================================================================
-- 2026-10-20 — Photo of the week
-- Admins post the Maryland Mall group photo on a run's admin page; members
-- see it on the home page. One photo per run (posting again replaces it).
-- Files live in the public-read "run-photos" bucket under <run id>/...;
-- run_photos holds the path and caption. Only admins can add or delete.
-- Run ONCE in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('run-photos', 'run-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "run photos admin read" on storage.objects;
create policy "run photos admin read" on storage.objects for select to authenticated
  using (bucket_id = 'run-photos' and is_admin());

drop policy if exists "run photos admin upload" on storage.objects;
create policy "run photos admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'run-photos' and is_admin());

drop policy if exists "run photos admin delete" on storage.objects;
create policy "run photos admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'run-photos' and is_admin());

-- Only admins post photos for now (members could upload their own later).
drop policy if exists "upload own photos" on run_photos;
drop policy if exists "admin photos" on run_photos;
create policy "admin photos" on run_photos for all to authenticated
  using (is_admin()) with check (is_admin());
