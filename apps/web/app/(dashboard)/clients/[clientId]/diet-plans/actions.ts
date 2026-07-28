'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { insertMealsAndItems } from '@/lib/diet-plan-mutations';
import { notifyClient } from '@/lib/notifications-store';
import { sendEmail } from '@/lib/email';
import { renderDietPlanReadyEmail } from '@/lib/email-templates/diet-plan-ready';
import { getSiteUrl } from '@/lib/site';
import { dietPlanSchema, type DietPlanInput } from '@welldesk/shared';

export async function createClientDietPlan(
  clientId: string,
  values: DietPlanInput,
  options?: { supersedesPlanId?: string; templateId?: string }
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
  let inheritedTemplateId: string | null = null;
  if (options?.supersedesPlanId) {
    const { data: sourcePlan } = await supabase
      .from('diet_plans')
      .select('version, template_id')
      .eq('id', options.supersedesPlanId)
      .single();
    version = (sourcePlan?.version ?? 0) + 1;
    inheritedTemplateId = sourcePlan?.template_id ?? null;
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
      template_id: options?.templateId ?? inheritedTemplateId,
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

  const { data: clientRow } = await supabase
    .from('clients')
    .select('full_name, email, user_id')
    .eq('id', clientId)
    .single();
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
  if (clientRow?.user_id) {
    await notifyClient({
      practiceId: profile.practice_id,
      clientId,
      type: 'diet_plan_ready',
      title: 'Your new diet plan is ready',
      body: data.name,
      href: '/portal/diet-plans',
    });
  }

  return { id: plan.id };
}

export async function updateClientDietPlan(clientId: string, planId: string, values: DietPlanInput) {
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

  const { data: existingPlan } = await supabase
    .from('diet_plans')
    .select('id, client_id')
    .eq('id', planId)
    .maybeSingle();
  if (!existingPlan || existingPlan.client_id !== clientId) {
    return { error: 'Plan not found' };
  }

  const { error: updateError } = await supabase
    .from('diet_plans')
    .update({ name: data.name, plan_date: data.planDate })
    .eq('id', planId);
  if (updateError) {
    return { error: updateError.message };
  }

  const { error: deleteError } = await supabase.from('diet_plan_meals').delete().eq('diet_plan_id', planId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const insertError = await insertMealsAndItems(supabase, planId, data.meals);
  if (insertError) {
    return { error: insertError };
  }

  revalidatePath(`/clients/${clientId}/diet-plans`);
  revalidatePath(`/clients/${clientId}/diet-plans/${planId}`);

  return { id: planId };
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
