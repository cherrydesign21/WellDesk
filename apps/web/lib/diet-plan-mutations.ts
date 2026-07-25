import type { SupabaseClient } from '@supabase/supabase-js';
import type { DietPlanInput } from '@welldesk/shared';

export async function insertMealsAndItems(
  supabase: SupabaseClient,
  planId: string,
  meals: DietPlanInput['meals']
): Promise<string | null> {
  if (meals.length === 0) return null;

  // One bulk insert for every meal slot, then one bulk insert for every food
  // item across all of them — instead of a meal-at-a-time loop (2 round
  // trips per slot), which made saving a 6-slot plan take several seconds.
  const { data: mealRows, error: mealsError } = await supabase
    .from('diet_plan_meals')
    .insert(meals.map((meal, i) => ({ diet_plan_id: planId, slot_name: meal.slotName, slot_order: i })))
    .select('id, slot_order');

  if (mealsError || !mealRows) return mealsError?.message ?? 'Failed to save meal slots';

  const mealIdByOrder = new Map(mealRows.map((m) => [m.slot_order, m.id]));

  const itemsToInsert = meals.flatMap((meal, i) =>
    meal.items.map((item, j) => ({
      meal_id: mealIdByOrder.get(i),
      food_item: item.foodItem,
      quantity: item.quantity || null,
      calories: item.calories ?? null,
      notes: item.notes || null,
      item_order: j,
    }))
  );

  if (itemsToInsert.length === 0) return null;

  const { error: itemsError } = await supabase.from('diet_plan_meal_items').insert(itemsToInsert);
  if (itemsError) return itemsError.message;

  return null;
}
