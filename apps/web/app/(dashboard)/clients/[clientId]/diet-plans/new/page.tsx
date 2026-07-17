import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { NewClientPlanForm } from '@/components/diet-plans/new-client-plan-form';
import { defaultMeals } from '@/components/diet-plans/plan-builder';
import type { DietPlanInput } from '@welldesk/shared';

export default async function NewClientDietPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ fromTemplateId?: string; fromPlanId?: string }>;
}) {
  const { clientId } = await params;
  const { fromTemplateId, fromPlanId } = await searchParams;

  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  let initialName: string | undefined;
  let initialMeals: DietPlanInput['meals'] | undefined;

  const seedId = fromTemplateId ?? fromPlanId;
  if (seedId) {
    const seed = await getPlanWithMeals(supabase, seedId);
    if (seed) {
      initialName = seed.name;
      initialMeals = seed.diet_plan_meals.map((m) => ({
        slotName: m.slot_name,
        items: m.diet_plan_meal_items.map((i) => ({
          foodItem: i.food_item,
          quantity: i.quantity ?? '',
          calories: i.calories ?? undefined,
          notes: i.notes ?? '',
        })),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New diet plan</h1>
      <NewClientPlanForm
        clientId={clientId}
        initialName={initialName}
        initialMeals={initialMeals ?? defaultMeals()}
        supersedesPlanId={fromPlanId}
      />
    </div>
  );
}
