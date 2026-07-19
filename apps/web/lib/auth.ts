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
      'id, full_name, role, avatar_url, practice_id, practices(name, tagline, logo_url, primary_color, font_choice, timezone)'
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
  return result;
}

export async function getCurrentClient(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, email, practice_id, practices(name, tagline, logo_url, primary_color, timezone)')
    .eq('user_id', user.id)
    .single();

  if (!client) return null;

  const practiceRow = Array.isArray(client.practices) ? client.practices[0] : client.practices;

  return { user, client: { ...client, practices: practiceRow } };
}

export async function requireClient() {
  const supabase = await createClient();
  const result = await getCurrentClient(supabase);
  if (!result) {
    redirect('/portal/login');
  }
  return result;
}
