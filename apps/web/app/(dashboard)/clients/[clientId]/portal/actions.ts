'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth';
import { getSiteUrl } from '@/lib/site';

// Supabase's admin API has no "get user by email" lookup, only paginated
// listing — only called on the rare email_exists conflict path below, capped
// well above any realistic user base for now.
async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

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
  // practice_name/dietitian_name are exposed to the "Reset Password" email
  // template as {{ .Data.practice_name }} / {{ .Data.dietitian_name }}, since
  // that template is what actually gets sent for portal invites.
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: client.email,
    email_confirm: true,
    user_metadata: {
      full_name: client.full_name,
      portal_client: true,
      practice_name: result.profile.practices?.name ?? 'WellDesk',
      dietitian_name: result.profile.full_name,
    },
  });

  if (createError || !created.user) {
    if (createError?.code === 'email_exists') {
      const existingUserId = await findUserIdByEmail(admin, client.email);
      if (existingUserId) {
        // Service role, not the RLS-scoped client — this profile is very
        // likely in a different practice than the one making this request.
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id')
          .eq('id', existingUserId)
          .maybeSingle();

        if (existingProfile) {
          return {
            error:
              "This email belongs to an existing WellDesk dietitian account and can't be given client portal access. Use a different email for this client.",
          };
        }
      }
      return {
        error:
          "This email already has client portal access under another practice on WellDesk. Use a different email address for this client's portal access.",
      };
    }
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
