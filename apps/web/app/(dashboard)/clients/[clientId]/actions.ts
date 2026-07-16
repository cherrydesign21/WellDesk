'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { healthMetricSchema, type HealthMetricInput } from '@welldesk/shared';

export async function createHealthMetric(clientId: string, values: HealthMetricInput) {
  const parsed = healthMetricSchema.safeParse(values);
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

  const { data: activeEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('health_metrics').insert({
    practice_id: profile.practice_id,
    client_id: clientId,
    enrollment_id: activeEnrollment?.id ?? null,
    recorded_at: new Date(data.recordedAt).toISOString(),
    systolic_bp: data.systolicBp ?? null,
    diastolic_bp: data.diastolicBp ?? null,
    blood_sugar_fasting: data.bloodSugarFasting ?? null,
    blood_sugar_post_meal: data.bloodSugarPostMeal ?? null,
    weight_kg: data.weightKg ?? null,
    height_cm: data.heightCm ?? null,
    waist_cm: data.waistCm ?? null,
    chest_cm: data.chestCm ?? null,
    hips_cm: data.hipsCm ?? null,
    body_fat_pct: data.bodyFatPct ?? null,
    target_weight_kg: data.targetWeightKg ?? null,
    notes: data.notes || null,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteHealthMetric(clientId: string, metricId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('health_metrics').delete().eq('id', metricId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
