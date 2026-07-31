import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function getCurrentProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, full_name, phone, role, avatar_url, practice_id, is_super_admin, practices(name, tagline, logo_url, primary_color, font_choice, timezone, currency, suspended_at)'
    )
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // the untyped client infers this many-to-one embed as an array; it's a
  // single row at runtime, so normalize it once here.
  const practiceRow = Array.isArray(profile.practices) ? profile.practices[0] : profile.practices;

  return { user, profile: { ...profile, practices: practiceRow } };
}

export async function requireProfile() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    redirect('/login');
  }
  if (result.profile.practices?.suspended_at) {
    redirect('/suspended');
  }
  return result;
}

export async function requireSuperAdmin() {
  const result = await requireProfile();
  if (!result.profile.is_super_admin) {
    redirect('/dashboard');
  }
  return result;
}

export async function getCurrentClient(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: client } = await supabase
    .from('clients')
    .select(
      'id, full_name, email, phone, photo_url, practice_id, practices(name, tagline, logo_url, primary_color, timezone, currency)'
    )
    .eq('user_id', user.id)
    .single();

  if (!client) return null;

  const practiceRow = Array.isArray(client.practices) ? client.practices[0] : client.practices;

  // Queried separately so a not-yet-run migration for these two columns
  // can't lock every client out of the portal — worst case, they're blank.
  const { data: contactInfo } = await supabase
    .from('practices')
    .select('contact_phone, contact_email')
    .eq('id', client.practice_id)
    .maybeSingle();

  return {
    user,
    client: {
      ...client,
      practices: practiceRow ? { ...practiceRow, ...contactInfo } : practiceRow,
    },
  };
}

export async function requireClient() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    redirect('/portal/login');
  }
  return result;
}
