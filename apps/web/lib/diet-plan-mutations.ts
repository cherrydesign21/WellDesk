import type { SupabaseClient } from '@supabase/supabase-js';
import type { DietPlanInput } from '@welldesk/shared';

export async function insertMealsAndItems(
  supabase: SupabaseClient,
  planId: string,
  meals: DietPlanInput['meals']
): Promise<string | null> {
  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    const { data: mealRow, error: mealError } = await supabase
      .from('diet_plan_meals')
      .insert({ diet_plan_id: planId, slot_name: meal.slotName, slot_order: i })
      .select('id')
      .single();

    if (mealError || !mealRow) return mealError?.message ?? 'Failed to save meal slot';

    const itemsToInsert = meal.items.map((item, j) => ({
      meal_id: mealRow.id,
      food_item: item.foodItem,
      quantity: item.quantity || null,
      calories: item.calories ?? null,
      notes: item.notes || null,
      item_order: j,
    }));

    const { error: itemsError } = await supabase.from('diet_plan_meal_items').insert(itemsToInsert);
    if (itemsError) return itemsError.message;
  }
  return null;
}
