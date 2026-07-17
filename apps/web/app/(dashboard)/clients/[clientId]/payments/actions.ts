'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { paymentSchema, type PaymentInput } from '@welldesk/shared';

export async function createPayment(clientId: string, values: PaymentInput) {
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { profile } = result;

  const { data: latestEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('payments').insert({
    practice_id: profile.practice_id,
    client_id: clientId,
    enrollment_id: latestEnrollment?.id ?? null,
    amount: data.amount,
    payment_date: data.paymentDate,
    mode: data.mode,
    reference_no: data.referenceNo || null,
    notes: data.notes || null,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/payments');
  return { success: true };
}

export async function deletePayment(clientId: string, paymentId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('payments').delete().eq('id', paymentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/payments');
  return { success: true };
}
