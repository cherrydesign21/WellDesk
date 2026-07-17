import type { SupabaseClient } from '@supabase/supabase-js';

export type PlanMealItem = {
  food_item: string;
  quantity: string | null;
  calories: number | null;
  notes: string | null;
  item_order: number;
};

export type PlanMeal = {
  id: string;
  slot_name: string;
  slot_order: number;
  diet_plan_meal_items: PlanMealItem[];
};

export type PlanWithMeals = {
  id: string;
  name: string;
  plan_date: string;
  version: number;
  is_template: boolean;
  status: string;
  share_token: string | null;
  client_id: string | null;
  diet_plan_meals: PlanMeal[];
};

const PLAN_SELECT =
  'id, name, plan_date, version, is_template, status, share_token, client_id, diet_plan_meals(id, slot_name, slot_order, diet_plan_meal_items(food_item, quantity, calories, notes, item_order))';

export async function getPlanWithMeals(supabase: SupabaseClient, planId: string): Promise<PlanWithMeals | null> {
  const { data } = await supabase.from('diet_plans').select(PLAN_SELECT).eq('id', planId).single();
  if (!data) return null;

  const plan = data as unknown as PlanWithMeals;

  return {
    ...plan,
    diet_plan_meals: [...plan.diet_plan_meals]
      .sort((a, b) => a.slot_order - b.slot_order)
      .map((meal) => ({
        ...meal,
        diet_plan_meal_items: [...meal.diet_plan_meal_items].sort((a, b) => a.item_order - b.item_order),
      })),
  };
}
