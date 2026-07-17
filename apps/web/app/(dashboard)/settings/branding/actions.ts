'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { brandingSchema, type BrandingInput } from '@welldesk/shared';

export async function updateBranding(values: BrandingInput) {
  const parsed = brandingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase
    .from('practices')
    .update({
      name: data.name,
      tagline: data.tagline || null,
      primary_color: data.primaryColor,
      font_choice: data.fontChoice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.profile.practice_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/branding');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateLogoUrl(logoUrl: string | null) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase
    .from('practices')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', result.profile.practice_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/branding');
  revalidatePath('/', 'layout');
  return { success: true };
}
