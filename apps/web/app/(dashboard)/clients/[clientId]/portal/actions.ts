'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';

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

  // inviteUserByEmail doesn't support the PKCE flow our callback route relies
  // on (the browser that opens the invite is often not the one that started
  // it), so create the account directly and send a PKCE-compatible password
  // recovery email instead — same accept-and-set-password experience.
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: client.email,
    email_confirm: true,
    user_metadata: { full_name: client.full_name, portal_client: true },
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? 'Failed to create portal account' };
  }

  const { error: linkError } = await supabase
    .from('clients')
    .update({ user_id: created.user.id })
    .eq('id', clientId);

  if (linkError) {
    return { error: linkError.message };
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(client.email, {
    redirectTo: `${getSiteUrl()}/portal/auth/callback`,
  });

  if (resetError) {
    return { error: resetError.message };
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
