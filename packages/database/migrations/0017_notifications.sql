-- Real, persisted notifications (distinct from the header bell's existing
-- "needs attention" feed, which is a live computed query with no read
-- state, and distinct from the older unused `notifications` table from an
-- earlier alert design — named activity_notifications to avoid colliding
-- with that one). Writes always go through the service-role client from
-- trusted server actions, so there is no insert policy — only read/update
-- for the recipient themselves.
create table activity_notifications (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  recipient_profile_id uuid references profiles(id) on delete cascade,
  recipient_client_id uuid references clients(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint activity_notifications_one_recipient check (
    (recipient_profile_id is not null)::int + (recipient_client_id is not null)::int = 1
  )
);

create index idx_activity_notifications_profile on activity_notifications(recipient_profile_id, created_at desc);
create index idx_activity_notifications_client on activity_notifications(recipient_client_id, created_at desc);

alter table activity_notifications enable row level security;

create policy activity_notifications_profile_select on activity_notifications
  for select using (recipient_profile_id = auth.uid());

create policy activity_notifications_profile_update on activity_notifications
  for update using (recipient_profile_id = auth.uid());

create policy activity_notifications_client_select on activity_notifications
  for select using (recipient_client_id = public.current_client_id());

create policy activity_notifications_client_update on activity_notifications
  for update using (recipient_client_id = public.current_client_id());
