-- Gender on the dietitian's own profile (collected at signup). Reuses the
-- existing client_gender enum — it's not client-specific, just a shared
-- male/female/other domain type — rather than defining a duplicate one.
alter table profiles add column gender client_gender;

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

  insert into public.profiles (id, practice_id, role, full_name, gender)
  values (
    new.id,
    new_practice_id,
    'owner',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    (new.raw_user_meta_data->>'gender')::client_gender
  );

  return new;
end;
$$;
