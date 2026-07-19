-- Platform super-admin (cross-tenant oversight + practice suspend/edit/delete).
-- No self-service grant path — is_super_admin is only ever set by a direct
-- SQL update, same as this migration's own DDL.
alter table profiles add column is_super_admin boolean not null default false;
alter table practices add column suspended_at timestamptz;
