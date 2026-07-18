-- Appointment / Visit Scheduler (Phase 2)
create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text,
  status appointment_status not null default 'scheduled',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_practice_starts on appointments(practice_id, starts_at);
create index idx_appointments_client on appointments(client_id);

alter table appointments enable row level security;

create policy tenant_isolation_appointments on appointments
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy client_appointments_select on appointments
  for select using (client_id = public.current_client_id());
