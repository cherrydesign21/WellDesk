'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { insertMealsAndItems } from '@/lib/diet-plan-mutations';
import { sendEmail } from '@/lib/email';
import { renderDietPlanReadyEmail } from '@/lib/email-templates/diet-plan-ready';
import { getSiteUrl } from '@/lib/site';
import { dietPlanSchema, type DietPlanInput } from '@welldesk/shared';

export async function createClientDietPlan(
  clientId: string,
  values: DietPlanInput,
  options?: { supersedesPlanId?: string }
) {
  const parsed = dietPlanSchema.safeParse(values);
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

  let version = 1;
  if (options?.supersedesPlanId) {
    const { data: sourcePlan } = await supabase
      .from('diet_plans')
      .select('version')
      .eq('id', options.supersedesPlanId)
      .single();
    version = (sourcePlan?.version ?? 0) + 1;
  }

  const { data: plan, error: planError } = await supabase
    .from('diet_plans')
    .insert({
      practice_id: profile.practice_id,
      client_id: clientId,
      enrollment_id: activeEnrollment?.id ?? null,
      is_template: false,
      name: data.name,
      plan_date: data.planDate,
      version,
      supersedes_plan_id: options?.supersedesPlanId ?? null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (planError || !plan) {
    return { error: planError?.message ?? 'Failed to create plan' };
  }

  const insertError = await insertMealsAndItems(supabase, plan.id, data.meals);
  if (insertError) {
    return { error: insertError };
  }

  if (options?.supersedesPlanId) {
    const { error: supersedeError } = await supabase
      .from('diet_plans')
      .update({ status: 'superseded' })
      .eq('id', options.supersedesPlanId);
    if (supersedeError) {
      return { error: supersedeError.message };
    }
  }

  revalidatePath(`/clients/${clientId}/diet-plans`);

  const { data: clientRow } = await supabase.from('clients').select('full_name, email').eq('id', clientId).single();
  if (clientRow?.email) {
    const { subject, html, text } = renderDietPlanReadyEmail({
      clientFirstName: clientRow.full_name.trim().split(/\s+/)[0] ?? clientRow.full_name,
      practiceName: profile.practices?.name ?? 'Your dietitian',
      practiceLogoUrl: profile.practices?.logo_url,
      practiceAccentColor: profile.practices?.primary_color,
      planName: data.name,
      portalUrl: `${getSiteUrl()}/portal`,
    });
    await sendEmail({ to: clientRow.email, subject, html, text });
  }

  return { id: plan.id };
}

export async function getOrCreateShareLink(planId: string) {
  const supabase = await createSupabaseClient();

  const { data: plan } = await supabase.from('diet_plans').select('share_token').eq('id', planId).single();
  if (!plan) {
    return { error: 'Plan not found' };
  }
  if (plan.share_token) {
    return { token: plan.share_token as string };
  }

  const token = crypto.randomUUID().replace(/-/g, '');
  const { error } = await supabase.from('diet_plans').update({ share_token: token }).eq('id', planId);
  if (error) {
    return { error: error.message };
  }

  return { token };
}
