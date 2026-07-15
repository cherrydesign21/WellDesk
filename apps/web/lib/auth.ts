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
    .select('id, full_name, role, practice_id, practices(name, tagline, logo_url, primary_color)')
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
