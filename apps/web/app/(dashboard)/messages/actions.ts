'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { notifyClient } from '@/lib/notifications-store';
import {
  getThreadMessages,
  sendMessageAsProfile,
  markThreadRead,
  getInboxSummaries,
} from '@/lib/messages-store';
import { messageSchema, type MessageInput } from '@welldesk/shared';

export async function fetchThreadMessages(clientId: string) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return [];

  const messages = await getThreadMessages(supabase, clientId);
  await markThreadRead(supabase, clientId, 'profile');
  return messages;
}

export async function fetchInboxSummaries() {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return [];
  return getInboxSummaries(supabase);
}

export async function sendProfileMessage(clientId: string, values: MessageInput) {
  const parsed = messageSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { profile } = result;

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, user_id')
    .eq('id', clientId)
    .single();

  if (!client) {
    return { error: 'Client not found' };
  }

  const { error } = await sendMessageAsProfile(supabase, {
    practiceId: profile.practice_id,
    clientId,
    profileId: profile.id,
    body: parsed.data.body,
  });

  if (error) {
    return { error: error.message };
  }

  if (client.user_id) {
    await notifyClient({
      practiceId: profile.practice_id,
      clientId,
      type: 'message_received',
      title: `New message from ${profile.full_name}`,
      body: parsed.data.body,
      href: '/portal/messages',
    });
  }

  revalidatePath('/messages');
  return { success: true };
}
