import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { EditTemplateForm } from '@/components/diet-plans/edit-template-form';
import type { DietPlanInput } from '@welldesk/shared';

export default async function EditDietPlanTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const template = await getPlanWithMeals(supabase, templateId);
  if (!template || !template.is_template) notFound();

  const initialMeals: DietPlanInput['meals'] = template.diet_plan_meals.map((m) => ({
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
      <h1 className="text-2xl font-semibold">Edit template</h1>
      <EditTemplateForm
        templateId={templateId}
        initialName={template.name}
        initialPlanDate={template.plan_date}
        initialMeals={initialMeals}
      />
    </div>
  );
}
