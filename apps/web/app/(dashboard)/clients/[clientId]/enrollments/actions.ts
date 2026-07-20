'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { enrollmentSchema, type EnrollmentInput, calculateExpiryDate } from '@welldesk/shared';

export async function pauseEnrollment(clientId: string, enrollmentId: string) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({ status: 'paused', paused_at: new Date().toISOString() })
    .eq('id', enrollmentId);

  if (enrollmentError) {
    return { error: enrollmentError.message };
  }

  const { error: clientError } = await supabase.from('clients').update({ status: 'paused' }).eq('id', clientId);
  if (clientError) {
    return { error: clientError.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/clients');
  return { success: true };
}

export async function resumeEnrollment(clientId: string, enrollmentId: string) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('expiry_date, paused_at, paused_days_total')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) {
    return { error: 'Enrollment not found' };
  }

  const pausedAt = enrollment.paused_at ? new Date(enrollment.paused_at) : new Date();
  const daysPaused = Math.max(0, Math.ceil((Date.now() - pausedAt.getTime()) / (1000 * 60 * 60 * 24)));

  const newExpiry = new Date(enrollment.expiry_date);
  newExpiry.setDate(newExpiry.getDate() + daysPaused);

  const { error: enrollmentError } = await supabase
    .from('enrollments')
    .update({
      status: 'active',
      paused_at: null,
      expiry_date: newExpiry.toISOString().slice(0, 10),
      paused_days_total: (enrollment.paused_days_total ?? 0) + daysPaused,
    })
    .eq('id', enrollmentId);

  if (enrollmentError) {
    return { error: enrollmentError.message };
  }

  const { error: clientError } = await supabase.from('clients').update({ status: 'active' }).eq('id', clientId);
  if (clientError) {
    return { error: clientError.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/clients');
  return { success: true };
}

export async function restartPlan(clientId: string, values: EnrollmentInput) {
  const parsed = enrollmentSchema.safeParse(values);
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

  const { data: latest } = await supabase
    .from('enrollments')
    .select('id, cycle_number, status')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && latest.status !== 'expired') {
    const { error: expireError } = await supabase
      .from('enrollments')
      .update({ status: 'expired' })
      .eq('id', latest.id);
    if (expireError) {
      return { error: expireError.message };
    }
  }

  const expiryDate = calculateExpiryDate(data.startDate, data.planType, data.customDurationDays);

  const { error: insertError } = await supabase.from('enrollments').insert({
    practice_id: profile.practice_id,
    client_id: clientId,
    cycle_number: (latest?.cycle_number ?? 0) + 1,
    plan_type: data.planType,
    custom_duration_days: data.planType === 'custom' ? data.customDurationDays : null,
    start_date: data.startDate,
    expiry_date: expiryDate,
    plan_amount: data.planAmount,
    notes: data.notes || null,
    created_by: profile.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  const { error: clientError } = await supabase
    .from('clients')
    .update({ status: 'active', archived_at: null })
    .eq('id', clientId);

  if (clientError) {
    return { error: clientError.message };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath('/clients');
  return { success: true };
}
