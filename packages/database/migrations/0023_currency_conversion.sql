-- Every payment/enrollment now remembers the currency it was actually
-- entered in. Until this migration, practices.currency was unselectable
-- (always its schema default), so every pre-existing row was, in effect,
-- entered as INR regardless of what a practice's currency preference has
-- since been changed to — that's why the backfill below is a flat 'INR',
-- not a copy of each practice's current currency.
alter table payments add column currency text not null default 'INR';
alter table enrollments add column currency text not null default 'INR';

-- Cached exchange rates so every currency-aware page doesn't hit the FX
-- API on every request. One row per base currency; refetched lazily by
-- lib/fx-rates.ts whenever the cached row is more than 24h old.
create table fx_rates (
  base_currency text primary key,
  rates jsonb not null,
  fetched_at timestamptz not null default now()
);

-- A payment always inherits its enrollment's currency (not the practice's
-- possibly-since-changed current preference) so plan_amount and its
-- payments stay in one currency and this view's arithmetic (a plain
-- subtraction) never mixes units. Exposing e.currency here lets every
-- consumer convert amount_paid/amount_due/plan_amount to the practice's
-- current display currency without a second query.
-- currency is appended at the END of the column list, not inserted after
-- plan_amount — CREATE OR REPLACE VIEW only allows adding new columns at
-- the end; it errors if replacing the view would reorder or rename any
-- existing output column.
create or replace view v_enrollment_payment_status as
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
  end as payment_status,
  e.currency
from enrollments e
left join payments p on p.enrollment_id = e.id
group by e.id;
