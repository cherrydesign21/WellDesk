-- Tracks the last time an automated "please log your numbers" reminder was
-- sent to a client, so the daily cron job doesn't nag the same person every
-- single day once they cross the inactivity threshold.
alter table clients add column last_reminder_sent_at timestamptz;
