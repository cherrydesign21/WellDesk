-- Client Portal (Phase 2): clients can log in and view their own data.
alter table clients add column user_id uuid unique references auth.users(id) on delete set null;
create index idx_clients_user on clients(user_id) where user_id is not null;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clients where user_id = auth.uid()
$$;

create policy client_self_select on clients
  for select using (id = public.current_client_id());

create policy client_practice_select on practices
  for select using (
    id = (select practice_id from clients where user_id = auth.uid())
  );

create policy client_enrollments_select on enrollments
  for select using (client_id = public.current_client_id());

create policy client_health_metrics_select on health_metrics
  for select using (client_id = public.current_client_id());

create policy client_diet_plans_select on diet_plans
  for select using (client_id = public.current_client_id());

create policy client_diet_plan_meals_select on diet_plan_meals
  for select using (
    exists (select 1 from diet_plans dp where dp.id = diet_plan_meals.diet_plan_id
      and dp.client_id = public.current_client_id())
  );

create policy client_diet_plan_meal_items_select on diet_plan_meal_items
  for select using (
    exists (select 1 from diet_plan_meals m join diet_plans dp on dp.id = m.diet_plan_id
      where m.id = diet_plan_meal_items.meal_id and dp.client_id = public.current_client_id())
  );

create policy client_payments_select on payments
  for select using (client_id = public.current_client_id());
