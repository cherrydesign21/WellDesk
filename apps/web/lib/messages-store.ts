import type { SupabaseClient } from '@supabase/supabase-js';

export type MessageRow = {
  id: string;
  sender_type: 'profile' | 'client';
  sender_profile_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

// Both callers rely on RLS (practice_id = current_practice_id() /
// client_id = current_client_id()) to scope access — the explicit
// .eq('client_id', ...) below just narrows to one thread within that scope.
export async function getThreadMessages(supabase: SupabaseClient, clientId: string): Promise<MessageRow[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_type, sender_profile_id, body, read_at, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function sendMessageAsProfile(
  supabase: SupabaseClient,
  params: { practiceId: string; clientId: string; profileId: string; body: string }
) {
  return supabase.from('messages').insert({
    practice_id: params.practiceId,
    client_id: params.clientId,
    sender_type: 'profile',
    sender_profile_id: params.profileId,
    body: params.body,
  });
}

export async function sendMessageAsClient(
  supabase: SupabaseClient,
  params: { practiceId: string; clientId: string; body: string }
) {
  return supabase.from('messages').insert({
    practice_id: params.practiceId,
    client_id: params.clientId,
    sender_type: 'client',
    body: params.body,
  });
}

// Marks messages sent by the OTHER party as read — a profile reading a
// thread clears the client's unread messages, and vice versa.
export async function markThreadRead(supabase: SupabaseClient, clientId: string, readerType: 'profile' | 'client') {
  const otherType = readerType === 'profile' ? 'client' : 'profile';
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('sender_type', otherType)
    .is('read_at', null);
}

export type InboxThreadSummary = {
  clientId: string;
  lastBody: string;
  lastCreatedAt: string;
  lastSenderType: 'profile' | 'client';
  unreadCount: number;
};

// Aggregated in JS rather than SQL — practice-scale message volume makes a
// single ordered fetch + client_id grouping simpler than a DISTINCT ON/RPC.
export async function getInboxSummaries(supabase: SupabaseClient): Promise<InboxThreadSummary[]> {
  const { data: messages } = await supabase
    .from('messages')
    .select('client_id, sender_type, body, read_at, created_at')
    .order('created_at', { ascending: false });

  const byClient = new Map<string, InboxThreadSummary>();
  for (const m of messages ?? []) {
    const existing = byClient.get(m.client_id);
    if (!existing) {
      byClient.set(m.client_id, {
        clientId: m.client_id,
        lastBody: m.body,
        lastCreatedAt: m.created_at,
        lastSenderType: m.sender_type,
        unreadCount: m.sender_type === 'client' && !m.read_at ? 1 : 0,
      });
    } else if (m.sender_type === 'client' && !m.read_at) {
      existing.unreadCount += 1;
    }
  }
  return Array.from(byClient.values());
}
