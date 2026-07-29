import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './supabase/admin';
import { getSiteUrl } from './site';

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

// Shared by the explicit "Invite to Portal" button and by auto-invite on
// client creation. inviteUserByEmail doesn't support the PKCE flow our
// callback route relies on (the browser that opens the invite is often not
// the one that started it), so this creates the account directly and sends
// a PKCE-compatible password recovery email instead — same
// accept-and-set-password experience. practice_name/dietitian_name are
// exposed to the "Reset Password" email template as
// {{ .Data.practice_name }} / {{ .Data.dietitian_name }}, since that
// template is what actually gets sent for portal invites.
export async function invitePortalAccess(
  supabase: SupabaseClient,
  params: { clientId: string; email: string; fullName: string; practiceName: string; dietitianName: string }
): Promise<{ error: string } | { success: true }> {
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: params.email,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName,
      portal_client: true,
      practice_name: params.practiceName,
      dietitian_name: params.dietitianName,
    },
  });

  if (createError || !created.user) {
    if (createError?.code === 'email_exists') {
      const existingUserId = await findUserIdByEmail(admin, params.email);
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
    .eq('id', params.clientId);

  if (linkError) {
    return { error: linkError.message };
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(params.email, {
    redirectTo: `${getSiteUrl()}/portal/auth/callback`,
  });

  if (resetError) {
    return { error: resetError.message };
  }

  return { success: true };
}
