-- In-app messaging between a practice's staff and a client. One thread per
-- client (small practices don't need multi-thread/subject support). Unlike
-- activity_notifications, direct client- and profile-authenticated inserts
-- are safe here — a message only ever touches the sender's own row scope,
-- so no service-role indirection is needed.
create table messages (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  sender_type text not null check (sender_type in ('profile', 'client')),
  sender_profile_id uuid references profiles(id) on delete set null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_sender_profile_consistency check (
    (sender_type = 'profile' and sender_profile_id is not null)
    or (sender_type = 'client' and sender_profile_id is null)
  )
);

create index idx_messages_client_created on messages(client_id, created_at);
create index idx_messages_practice_created on messages(practice_id, created_at desc);

alter table messages enable row level security;

create policy messages_practice_select on messages
  for select using (practice_id = public.current_practice_id());

create policy messages_practice_insert on messages
  for insert with check (
    practice_id = public.current_practice_id()
    and sender_type = 'profile'
    and sender_profile_id = auth.uid()
    and client_id in (select id from clients where practice_id = public.current_practice_id())
  );

create policy messages_practice_update on messages
  for update using (practice_id = public.current_practice_id());

create policy messages_client_select on messages
  for select using (client_id = public.current_client_id());

create policy messages_client_insert on messages
  for insert with check (
    client_id = public.current_client_id()
    and sender_type = 'client'
    and practice_id = (select practice_id from clients where id = public.current_client_id())
  );

create policy messages_client_update on messages
  for update using (client_id = public.current_client_id());
