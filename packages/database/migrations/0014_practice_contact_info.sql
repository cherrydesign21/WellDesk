-- Branding settings dropped per-practice primary_color/font_choice controls
-- (the whole app now uses WellDesk's fixed identity everywhere, dashboard
-- and portal alike) in favor of a contact phone/email clients can see in
-- their own portal if they want to reach their dietitian directly.
alter table practices add column contact_phone text;
alter table practices add column contact_email text;
