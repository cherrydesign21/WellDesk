'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { razorpaySettingsSchema, type RazorpaySettingsInput, updateCurrencySchema, type UpdateCurrencyInput } from '@welldesk/shared';

export async function updateRazorpaySettings(values: RazorpaySettingsInput) {
  const parsed = razorpaySettingsSchema.safeParse(values);
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
      razorpay_key_id: data.keyId,
      razorpay_key_secret: data.keySecret,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.profile.practice_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/payments');
  return { success: true };
}

export async function updatePracticeCurrency(values: UpdateCurrencyInput) {
  const parsed = updateCurrencySchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase
    .from('practices')
    .update({ currency: parsed.data.currency, updated_at: new Date().toISOString() })
    .eq('id', result.profile.practice_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/payments');
  revalidatePath('/dashboard');
  revalidatePath('/payments');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function disconnectRazorpay() {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error } = await supabase
    .from('practices')
    .update({ razorpay_key_id: null, razorpay_key_secret: null, updated_at: new Date().toISOString() })
    .eq('id', result.profile.practice_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings/payments');
  return { success: true };
}
