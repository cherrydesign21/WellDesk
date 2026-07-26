-- The trigger fired on every auth.users insert, with no way to tell a real
-- dietitian registration apart from an admin-created client-portal account
-- (inviteClientToPortal already tags those with portal_client: true in
-- user_metadata — the trigger just never checked it). Every invited client
-- was silently getting their own phantom practice + owner profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_practice_id uuid;
begin
  if coalesce(new.raw_user_meta_data->>'portal_client', 'false') = 'true' then
    return new;
  end if;

  insert into public.practices (name, owner_user_id)
  values (coalesce(new.raw_user_meta_data->>'practice_name', 'My Practice'), new.id)
  returning id into new_practice_id;

  insert into public.profiles (id, practice_id, role, full_name)
  values (new.id, new_practice_id, 'owner', coalesce(new.raw_user_meta_data->>'full_name', new.email));

  return new;
end;
$$;
