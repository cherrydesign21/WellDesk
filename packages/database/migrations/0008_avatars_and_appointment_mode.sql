-- Avatar uploads (dietitian's own profile photo + client photos, both set
-- by the acting dietitian). Same shape as the logos bucket in 0004.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public read access to avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Practice members can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Practice members can update avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Practice members can delete avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

-- Meeting mode for the dashboard's "Today's Schedule" (video / in-person / phone).
create type appointment_mode as enum ('video', 'in_person', 'phone');
alter table appointments add column mode appointment_mode not null default 'in_person';
