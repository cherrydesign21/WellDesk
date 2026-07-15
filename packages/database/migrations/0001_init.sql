-- Dietitian Practice Management Platform
-- Schema v1 — multi-tenant (practice_id on every tenant-owned table)
-- Target: Supabase Postgres. RLS policies are sketched at the bottom;
-- finalize them alongside Module 1 (Auth) once auth.uid() flows are wired up.

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('owner', 'assistant');
create type client_gender as enum ('male', 'female', 'other');
create type client_status as enum ('active', 'expired', 'paused', 'archived');
create type plan_type as enum ('1_month', '3_month', '6_month', '1_year', 'custom');
create type enrollment_status as enum ('active', 'expired', 'paused');
create type payment_mode as enum ('cash', 'upi', 'card', 'online', 'other');
create type alert_type as enum ('expiry', 'inactive', 'overdue_payment');
create type alert_status as enum ('pending', 'sent', 'failed', 'dismissed');
create type weight_unit_pref as enum ('kg', 'lbs');

-- ============================================================
-- TENANT ROOT
-- ============================================================
create table practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  logo_url text,
  primary_color text not null default '#0EA5E9',
  font_choice text not null default 'inter',
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  owner_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- extends auth.users with practice membership + role
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  practice_id uuid not null references practices(id) on delete cascade,
  role user_role not null default 'owner',
  full_name text not null,
  phone text,
  avatar_url text,
  weight_unit_pref weight_unit_pref not null default 'kg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_practice on profiles(practice_id);

-- auto-provision a practice + owner profile whenever someone signs up.
-- practice_name / full_name are passed as auth signup metadata (see apps/web register action).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_practice_id uuid;
begin
  insert into public.practices (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'practice_name', 'My Practice'), new.id)
  returning id into new_practice_id;

  insert into public.profiles (id, practice_id, role, full_name)
  values (new.id, new_practice_id, 'owner', coalesce(new.raw_user_meta_data->>'full_name', new.email));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  full_name text not null,
  dob date,
  gender client_gender,
  phone text,
  email text,
  address text,
  photo_url text,
  status client_status not null default 'active',
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index idx_clients_practice on clients(practice_id);
create index idx_clients_status on clients(practice_id, status);
create index idx_clients_phone on clients(practice_id, phone);
create index idx_clients_email on clients(practice_id, lower(email));
-- fast trigram search backing the AJAX name/phone/email search (module 7)
create extension if not exists pg_trgm;
create index idx_clients_name_trgm on clients using gin (full_name gin_trgm_ops);

-- ============================================================
-- ENROLLMENTS (plan cycles — module 8)
-- ============================================================
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  cycle_number int not null,
  plan_type plan_type not null,
  custom_duration_days int,                     -- required when plan_type = 'custom'
  start_date date not null,
  expiry_date date not null,
  status enrollment_status not null default 'active',
  plan_amount numeric(10,2) not null default 0,
  paused_at timestamptz,
  paused_days_total int not null default 0,      -- accumulated, added back to expiry on resume
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, cycle_number),
  check (plan_type <> 'custom' or custom_duration_days is not null)
);

create index idx_enrollments_client on enrollments(client_id);
create index idx_enrollments_practice_status on enrollments(practice_id, status);
create index idx_enrollments_expiry on enrollments(practice_id, expiry_date) where status = 'active';

-- ============================================================
-- HEALTH METRICS (per-visit, no fixed frequency — module 2)
-- ============================================================
create table health_metrics (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  recorded_at timestamptz not null default now(),
  systolic_bp int,
  diastolic_bp int,
  blood_sugar_fasting numeric(5,1),
  blood_sugar_post_meal numeric(5,1),
  weight_kg numeric(5,2),                         -- canonical unit; display pref lives on profiles
  height_cm numeric(5,1),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  hips_cm numeric(5,1),
  body_fat_pct numeric(4,1),
  target_weight_kg numeric(5,2),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_metrics_client_recorded on health_metrics(client_id, recorded_at desc);

-- ============================================================
-- DIET PLANS (module 3) — templates and client plans share one table
-- ============================================================
create table diet_plans (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  is_template boolean not null default false,
  name text not null,
  plan_date date not null default current_date,
  version int not null default 1,
  supersedes_plan_id uuid references diet_plans(id),
  status text not null default 'active' check (status in ('active', 'superseded', 'archived')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_template and client_id is null) or (not is_template and client_id is not null))
);

create index idx_diet_plans_client on diet_plans(client_id);
create index idx_diet_plans_templates on diet_plans(practice_id) where is_template;

create table diet_plan_meals (
  id uuid primary key default gen_random_uuid(),
  diet_plan_id uuid not null references diet_plans(id) on delete cascade,
  slot_name text not null,          -- 'Breakfast', 'Mid-Morning', ... fully customizable
  slot_order int not null default 0
);

create index idx_diet_plan_meals_plan on diet_plan_meals(diet_plan_id, slot_order);

create table diet_plan_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references diet_plan_meals(id) on delete cascade,
  food_item text not null,
  quantity text,
  calories numeric(6,1),
  notes text,
  item_order int not null default 0
);

create index idx_diet_plan_items_meal on diet_plan_meal_items(meal_id, item_order);

-- ============================================================
-- PAYMENTS (module 4)
-- ============================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  mode payment_mode not null,
  reference_no text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_payments_client on payments(client_id);
create index idx_payments_enrollment on payments(enrollment_id);
create index idx_payments_practice_date on payments(practice_id, payment_date);

-- derived payment status per enrollment — never stored, always computed
create view v_enrollment_payment_status as
select
  e.id as enrollment_id,
  e.practice_id,
  e.client_id,
  e.plan_amount,
  coalesce(sum(p.amount), 0) as amount_paid,
  e.plan_amount - coalesce(sum(p.amount), 0) as amount_due,
  case
    when coalesce(sum(p.amount), 0) >= e.plan_amount then 'paid'
    when coalesce(sum(p.amount), 0) > 0 then 'partial'
    when e.status = 'active' and e.expiry_date < current_date then 'overdue'
    else 'unpaid'
  end as payment_status
from enrollments e
left join payments p on p.enrollment_id = e.id
group by e.id;

-- ============================================================
-- NOTIFICATIONS / ALERTS (module 9)
-- ============================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references practices(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  type alert_type not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  message text,
  triggered_at timestamptz not null default now(),
  sent_at timestamptz,
  status alert_status not null default 'pending'
);

create index idx_notifications_practice_status on notifications(practice_id, status);

-- ============================================================
-- HELPER VIEWS backing module 9's alerts
-- ============================================================
create view v_expiring_clients as
select c.*, e.expiry_date, e.id as enrollment_id
from clients c
join enrollments e on e.client_id = c.id and e.status = 'active'
where e.expiry_date <= current_date + interval '30 days'
  and c.status = 'active';

create view v_inactive_clients as
select c.*
from clients c
where c.status = 'active'
  and not exists (
    select 1 from health_metrics hm
    where hm.client_id = c.id
      and hm.recorded_at >= now() - interval '14 days'
  );

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- security definer + bypasses RLS on the profiles lookup itself, so it's safe
-- to call from within other tables' policies without recursion.
create or replace function public.current_practice_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select practice_id from public.profiles where id = auth.uid()
$$;

alter table practices enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table enrollments enable row level security;
alter table health_metrics enable row level security;
alter table diet_plans enable row level security;
alter table diet_plan_meals enable row level security;
alter table diet_plan_meal_items enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;

-- practices: members can read/update their own practice; row creation only
-- happens via the handle_new_user trigger (security definer, bypasses RLS).
create policy practices_select on practices
  for select using (id = public.current_practice_id());
create policy practices_update on practices
  for update using (id = public.current_practice_id())
  with check (id = public.current_practice_id());

-- profiles: members can see everyone in their practice, but only edit themselves.
-- inserts happen only via the signup trigger.
create policy profiles_select on profiles
  for select using (practice_id = public.current_practice_id());
create policy profiles_update_self on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- standard tenant isolation for every practice_id-scoped table.
create policy tenant_isolation_clients on clients
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy tenant_isolation_enrollments on enrollments
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy tenant_isolation_health_metrics on health_metrics
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy tenant_isolation_diet_plans on diet_plans
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy tenant_isolation_payments on payments
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

create policy tenant_isolation_notifications on notifications
  for all using (practice_id = public.current_practice_id())
  with check (practice_id = public.current_practice_id());

-- diet_plan_meals / diet_plan_meal_items don't carry practice_id directly —
-- isolation is enforced by joining up to the parent diet_plans row instead.
create policy tenant_isolation_diet_plan_meals on diet_plan_meals
  for all using (
    exists (select 1 from diet_plans dp where dp.id = diet_plan_meals.diet_plan_id
      and dp.practice_id = public.current_practice_id())
  )
  with check (
    exists (select 1 from diet_plans dp where dp.id = diet_plan_meals.diet_plan_id
      and dp.practice_id = public.current_practice_id())
  );

create policy tenant_isolation_diet_plan_meal_items on diet_plan_meal_items
  for all using (
    exists (select 1 from diet_plan_meals m join diet_plans dp on dp.id = m.diet_plan_id
      where m.id = diet_plan_meal_items.meal_id and dp.practice_id = public.current_practice_id())
  )
  with check (
    exists (select 1 from diet_plan_meals m join diet_plans dp on dp.id = m.diet_plan_id
      where m.id = diet_plan_meal_items.meal_id and dp.practice_id = public.current_practice_id())
  );
