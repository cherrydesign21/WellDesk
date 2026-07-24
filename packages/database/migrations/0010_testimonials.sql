-- Auth-page testimonials (login/signup carousel), managed by the super
-- admin. All writes go through the admin panel's service-role client (same
-- pattern as practices/clients elsewhere in /admin), so RLS here only needs
-- to allow anonymous read access for the pre-auth login/signup pages.
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

create policy "Public read access to active testimonials"
on testimonials for select
using (is_active = true);

insert into testimonials (quote, author, display_order)
values (
  'Life is more easy with this tool. Now I am able to manage clients anywhere with simple login details Thank you Welldesk',
  'Ritika - Dietitian',
  0
);
