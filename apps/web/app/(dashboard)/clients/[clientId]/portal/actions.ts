'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { invitePortalAccess } from '@/lib/portal-invite';

export async function inviteClientToPortal(clientId: string) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, email, full_name, user_id')
    .eq('id', clientId)
    .single();

  if (!client) {
    return { error: 'Client not found' };
  }
  if (!client.email) {
    return { error: 'Add an email address for this client before inviting them to the portal.' };
  }
  if (client.user_id) {
    return { error: 'This client already has portal access.' };
  }

  const inviteResult = await invitePortalAccess(supabase, {
    clientId,
    email: client.email,
    fullName: client.full_name,
    practiceName: result.profile.practices?.name ?? 'WellDesk',
    dietitianName: result.profile.full_name,
  });
  if ('error' in inviteResult) {
    return { error: inviteResult.error };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function revokeClientPortalAccess(clientId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('clients').update({ user_id: null }).eq('id', clientId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
