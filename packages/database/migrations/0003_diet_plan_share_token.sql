-- Public, unauthenticated read-only share links for diet plans
-- (module 3: "Share via WhatsApp link or Email"). The token itself is the
-- access control — the public share page looks up by exact token match
-- using the service_role key, never by listing all shared plans.
alter table diet_plans add column share_token text unique;
create index idx_diet_plans_share_token on diet_plans(share_token) where share_token is not null;
