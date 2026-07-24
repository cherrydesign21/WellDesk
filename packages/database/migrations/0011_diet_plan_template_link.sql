-- Tracks which template a client plan was started from, so the Templates
-- list/detail pages can show who currently has each template assigned.
-- Nullable: plans created from scratch (no template) simply leave this null.
alter table diet_plans add column template_id uuid references diet_plans(id) on delete set null;

create index idx_diet_plans_template on diet_plans(template_id) where template_id is not null;
