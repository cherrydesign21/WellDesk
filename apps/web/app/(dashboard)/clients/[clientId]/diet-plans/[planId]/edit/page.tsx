import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { EditClientPlanForm } from '@/components/diet-plans/edit-client-plan-form';
import type { DietPlanInput } from '@welldesk/shared';

export default async function EditClientDietPlanPage({
  params,
}: {
  params: Promise<{ clientId: string; planId: string }>;
}) {
  const { clientId, planId } = await params;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const plan = await getPlanWithMeals(supabase, planId);
  if (!plan || plan.client_id !== clientId) notFound();

  const initialMeals: DietPlanInput['meals'] = plan.diet_plan_meals.map((m) => ({
    slotName: m.slot_name,
    items: m.diet_plan_meal_items.map((i) => ({
      foodItem: i.food_item,
      quantity: i.quantity ?? '',
      calories: i.calories ?? undefined,
      notes: i.notes ?? '',
    })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit diet plan</h1>
      <EditClientPlanForm
        clientId={clientId}
        planId={planId}
        initialName={plan.name}
        initialPlanDate={plan.plan_date}
        initialMeals={initialMeals}
      />
    </div>
  );
}
