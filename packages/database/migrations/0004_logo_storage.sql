-- Storage bucket + RLS for practice logo uploads (module 5: Dashboard Branding).
-- Public read (logos need to render in exported PDFs and public share pages),
-- writes restricted to the uploading practice's own folder via
-- public.current_practice_id() (same helper the app tables' RLS policies use).
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Public read access to logos"
on storage.objects for select
using (bucket_id = 'logos');

create policy "Practice members can upload their own logo"
on storage.objects for insert
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Practice members can update their own logo"
on storage.objects for update
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);

create policy "Practice members can delete their own logo"
on storage.objects for delete
using (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] = public.current_practice_id()::text
);
