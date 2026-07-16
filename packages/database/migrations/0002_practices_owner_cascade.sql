-- practices.owner_user_id had no ON DELETE behavior, so deleting a practice
-- owner's auth user failed with a foreign key violation. Deleting the owner
-- now cascades to their practice (and everything under it).
alter table practices drop constraint practices_owner_user_id_fkey;
alter table practices add constraint practices_owner_user_id_fkey
  foreign key (owner_user_id) references auth.users(id) on delete cascade;
