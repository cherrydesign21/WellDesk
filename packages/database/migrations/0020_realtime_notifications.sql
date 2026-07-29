-- Notification bells were polling every 30s + on focus, which reads as
-- "not real time" to a user actively watching. Adds the table to Supabase's
-- realtime publication so INSERTs push over websocket immediately; RLS
-- still gates delivery per-recipient exactly as it does for normal selects.
alter publication supabase_realtime add table activity_notifications;
