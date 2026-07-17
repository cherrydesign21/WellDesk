'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { insertMealsAndItems } from '@/lib/diet-plan-mutations';
import { dietPlanSchema, type DietPlanInput } from '@welldesk/shared';

export async function createTemplate(values: DietPlanInput) {
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

  const { data: template, error: templateError } = await supabase
    .from('diet_plans')
    .insert({
      practice_id: profile.practice_id,
      client_id: null,
      is_template: true,
      name: data.name,
      plan_date: data.planDate,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (templateError || !template) {
    return { error: templateError?.message ?? 'Failed to create template' };
  }

  const insertError = await insertMealsAndItems(supabase, template.id, data.meals);
  if (insertError) {
    return { error: insertError };
  }

  revalidatePath('/diet-plans/templates');
  return { id: template.id };
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from('diet_plans').delete().eq('id', templateId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/diet-plans/templates');
  return { success: true };
}
