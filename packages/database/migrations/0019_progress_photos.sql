-- Progress photos: clients (or their dietitian) can upload periodic photos.
-- Unlike avatars/logos this bucket is private (photos are sensitive) — read
-- access goes through short-lived signed URLs generated server-side, gated
-- by the same RLS the bucket enforces on storage.objects.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Path convention: {practice_id}/{client_id}/{filename}
create policy "Practice members can read progress photos"
on storage.objects for select
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Clients can read their own progress photos"
on storage.objects for select
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[2] = public.current_client_id()::text
);

create policy "Practice members can upload progress photos"
on storage.objects for insert
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Clients can upload their own progress photos"
on storage.objects for insert
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[2] = public.current_client_id()::text
);

create policy "Practice members can delete progress photos"
on storage.objects for delete
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Clients can delete their own progress photos"
on storage.objects for delete
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[2] = public.current_client_id()::text
);

create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by_type text not null check (uploaded_by_type in ('profile', 'client')),
  uploaded_by_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint progress_photos_uploader_consistency check (
    (uploaded_by_type = 'profile' and uploaded_by_profile_id is not null)
    or (uploaded_by_type = 'client' and uploaded_by_profile_id is null)
  )
);

create index idx_progress_photos_client_created on progress_photos(client_id, created_at desc);

alter table progress_photos enable row level security;

create policy progress_photos_practice_select on progress_photos
  for select using (practice_id = public.current_practice_id());

create policy progress_photos_practice_insert on progress_photos
  for insert with check (
    practice_id = public.current_practice_id()
    and uploaded_by_type = 'profile'
    and uploaded_by_profile_id = auth.uid()
    and client_id in (select id from clients where practice_id = public.current_practice_id())
  );

create policy progress_photos_practice_delete on progress_photos
  for delete using (practice_id = public.current_practice_id());

create policy progress_photos_client_select on progress_photos
  for select using (client_id = public.current_client_id());

create policy progress_photos_client_insert on progress_photos
  for insert with check (
    client_id = public.current_client_id()
    and uploaded_by_type = 'client'
    and practice_id = (select practice_id from clients where id = public.current_client_id())
  );

create policy progress_photos_client_delete on progress_photos
  for delete using (client_id = public.current_client_id());
