import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './supabase/admin';

export type StoredNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

// Writes go through the service-role client — the caller (a dietitian or
// client session) has already been authenticated by the server action that
// triggered the event, but the RECIPIENT of the notification is the *other*
// party, so no RLS insert policy could express "either side can write" any
// more simply than just trusting the server action that's already vetted.

export async function notifyPractice(params: {
  practiceId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
}) {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from('profiles').select('id').eq('practice_id', params.practiceId);
  if (!profiles || profiles.length === 0) return;

  await admin.from('activity_notifications').insert(
    profiles.map((p) => ({
      practice_id: params.practiceId,
      recipient_profile_id: p.id,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      href: params.href ?? null,
    }))
  );
}

export async function notifyClient(params: {
  practiceId: string;
  clientId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
}) {
  const admin = createAdminClient();
  await admin.from('activity_notifications').insert({
    practice_id: params.practiceId,
    recipient_client_id: params.clientId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    href: params.href ?? null,
  });
}

// Both fetchers rely entirely on RLS (recipient_profile_id = auth.uid() /
// recipient_client_id = current_client_id()) to scope results to the caller
// — a dietitian session can never see client-targeted rows or vice versa,
// since the other policy's comparison is against a null current_*_id().

export async function getProfileNotifications(supabase: SupabaseClient): Promise<StoredNotification[]> {
  const { data } = await supabase
    .from('activity_notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getClientNotifications(supabase: SupabaseClient): Promise<StoredNotification[]> {
  const { data } = await supabase
    .from('activity_notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function markNotificationsRead(supabase: SupabaseClient) {
  await supabase.from('activity_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
}
