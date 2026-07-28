'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getProfileNotifications, markNotificationsRead } from '@/lib/notifications-store';

export async function fetchProfileNotifications() {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return [];
  return getProfileNotifications(supabase);
}

export async function markProfileNotificationsRead() {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return;
  await markNotificationsRead(supabase);
}
