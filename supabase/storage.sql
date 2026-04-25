-- =====================================================
-- FANTASIX — SUPABASE STORAGE BUCKETS
-- Run this in Supabase SQL Editor AFTER schema.sql
-- =====================================================

-- Public buckets (images are publicly readable)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('team-logos',     'team-logos',     true, 2097152,  array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('player-avatars', 'player-avatars', true, 2097152,  array['image/jpeg','image/png','image/webp']),
  ('tournament-logos','tournament-logos',true,2097152, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Storage RLS: public read, admin write
create policy "public_read_team_logos"
  on storage.objects for select
  using (bucket_id = 'team-logos');

create policy "admin_upload_team_logos"
  on storage.objects for insert
  with check (
    bucket_id = 'team-logos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "admin_update_team_logos"
  on storage.objects for update
  using (
    bucket_id = 'team-logos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "admin_delete_team_logos"
  on storage.objects for delete
  using (
    bucket_id = 'team-logos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Same pattern for player avatars
create policy "public_read_player_avatars"
  on storage.objects for select
  using (bucket_id = 'player-avatars');

create policy "admin_upload_player_avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'player-avatars'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "admin_update_player_avatars"
  on storage.objects for update
  using (
    bucket_id = 'player-avatars'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "admin_delete_player_avatars"
  on storage.objects for delete
  using (
    bucket_id = 'player-avatars'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Same pattern for tournament logos
create policy "public_read_tournament_logos"
  on storage.objects for select
  using (bucket_id = 'tournament-logos');

create policy "admin_upload_tournament_logos"
  on storage.objects for insert
  with check (
    bucket_id = 'tournament-logos'
    and (select role from public.profiles where id = auth.uid()) = 'admin'
  );
