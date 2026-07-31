-- Each practice connects its own Razorpay account (Key ID + Key Secret from
-- their own dashboard) — money goes straight to their bank, WellDesk never
-- holds funds and never needs its own payment-aggregator registration.
-- key_secret is only ever read server-side (order creation, signature
-- verification) and is never sent to the browser.
alter table practices add column razorpay_key_id text;
alter table practices add column razorpay_key_secret text;

-- Links an online-collected payment back to its Razorpay transaction. Null
-- for manually-logged payments (cash/bank transfer/etc, unchanged).
alter table payments add column razorpay_order_id text;
alter table payments add column razorpay_payment_id text;
