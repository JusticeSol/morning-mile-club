-- =====================================================================
-- 2026-10-20 — Profile photos
-- Members upload a photo from Profile → Edit profile. The app shrinks it to
-- a 512×512 JPEG first, then stores it in the "avatars" bucket under the
-- member's own folder (<user id>/...). profiles.avatar_url holds its URL.
-- The bucket is public-read: anyone with a photo's exact link can open it,
-- but nobody can list the bucket. Only you can add or delete your photos.
-- Run ONCE in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars read own" on storage.objects;
create policy "avatars read own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
