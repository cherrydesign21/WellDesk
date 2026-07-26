-- Client portal (Phase 3): the portal was read-only for clients so far — no
-- policy let them log their own health metrics, update their own contact
-- info, or upload their own avatar. These are additive, alongside the
-- existing client_*_select policies from 0005.

create policy client_health_metrics_insert on health_metrics
  for insert with check (client_id = public.current_client_id());

create policy client_self_update on clients
  for update using (id = public.current_client_id())
  with check (id = public.current_client_id());

-- Avatar bucket writes were scoped to current_practice_id(), which is only
-- ever set for dietitian/staff profiles — clients have no profiles row, so
-- current_practice_id() is null for them and the existing policies never
-- match. Resolve the client's own practice directly instead.
create policy "Clients can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select practice_id::text from public.clients where user_id = auth.uid()
  )
);

create policy "Clients can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (
    select practice_id::text from public.clients where user_id = auth.uid()
  )
);
