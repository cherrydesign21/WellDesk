'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { insertMealsAndItems } from '@/lib/diet-plan-mutations';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { createClientDietPlan } from '@/app/(dashboard)/clients/[clientId]/diet-plans/actions';
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

export async function updateTemplate(templateId: string, values: DietPlanInput) {
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

  const { data: existing } = await supabase
    .from('diet_plans')
    .select('id, is_template')
    .eq('id', templateId)
    .maybeSingle();
  if (!existing || !existing.is_template) {
    return { error: 'Template not found' };
  }

  const { error: updateError } = await supabase
    .from('diet_plans')
    .update({ name: data.name, plan_date: data.planDate })
    .eq('id', templateId);
  if (updateError) {
    return { error: updateError.message };
  }

  const { error: deleteError } = await supabase.from('diet_plan_meals').delete().eq('diet_plan_id', templateId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  const insertError = await insertMealsAndItems(supabase, templateId, data.meals);
  if (insertError) {
    return { error: insertError };
  }

  revalidatePath('/diet-plans/templates');
  revalidatePath(`/diet-plans/templates/${templateId}`);

  return { id: templateId };
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

export async function duplicateTemplate(templateId: string) {
  const supabase = await createSupabaseClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return { error: 'Your session has expired — please log in again.' };
  }
  const { profile } = result;

  const source = await getPlanWithMeals(supabase, templateId);
  if (!source || !source.is_template) {
    return { error: 'Template not found' };
  }

  const { data: copy, error: copyError } = await supabase
    .from('diet_plans')
    .insert({
      practice_id: profile.practice_id,
      client_id: null,
      is_template: true,
      name: `${source.name} (Copy)`,
      plan_date: source.plan_date,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (copyError || !copy) {
    return { error: copyError?.message ?? 'Failed to duplicate template' };
  }

  const insertError = await insertMealsAndItems(
    supabase,
    copy.id,
    source.diet_plan_meals.map((m) => ({
      slotName: m.slot_name,
      items: m.diet_plan_meal_items.map((i) => ({
        foodItem: i.food_item,
        quantity: i.quantity ?? '',
        calories: i.calories ?? undefined,
        notes: i.notes ?? '',
      })),
    }))
  );
  if (insertError) {
    return { error: insertError };
  }

  revalidatePath('/diet-plans/templates');
  return { id: copy.id };
}

export async function assignTemplateToClients(templateId: string, clientIds: string[]) {
  if (clientIds.length === 0) {
    return { error: 'Select at least one client' };
  }

  const supabase = await createSupabaseClient();
  const template = await getPlanWithMeals(supabase, templateId);
  if (!template || !template.is_template) {
    return { error: 'Template not found' };
  }

  const values: DietPlanInput = {
    name: template.name,
    planDate: new Date().toISOString().slice(0, 10),
    meals: template.diet_plan_meals.map((m) => ({
      slotName: m.slot_name,
      items: m.diet_plan_meal_items.map((i) => ({
        foodItem: i.food_item,
        quantity: i.quantity ?? '',
        calories: i.calories ?? undefined,
        notes: i.notes ?? '',
      })),
    })),
  };

  let successCount = 0;
  let failedCount = 0;
  for (const clientId of clientIds) {
    const outcome = await createClientDietPlan(clientId, values, { templateId });
    if (outcome.error) failedCount += 1;
    else successCount += 1;
  }

  revalidatePath(`/diet-plans/templates/${templateId}`);

  if (failedCount > 0) {
    return { error: `Assigned to ${successCount} of ${clientIds.length} client(s) — ${failedCount} failed.` };
  }
  return { success: true, successCount };
}
