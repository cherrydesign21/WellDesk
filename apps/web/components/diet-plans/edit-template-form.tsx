'use client';

import { useRouter } from 'next/navigation';
import type { DietPlanInput } from '@welldesk/shared';
import { updateTemplate } from '@/app/(dashboard)/diet-plans/templates/actions';
import { PlanBuilder } from './plan-builder';

export function EditTemplateForm({
  templateId,
  initialName,
  initialPlanDate,
  initialMeals,
}: {
  templateId: string;
  initialName: string;
  initialPlanDate: string;
  initialMeals: DietPlanInput['meals'];
}) {
  const router = useRouter();

  return (
    <PlanBuilder
      mode="template"
      initialName={initialName}
      initialPlanDate={initialPlanDate}
      initialMeals={initialMeals}
      submitLabel="Save changes"
      onSubmitAction={(values) => updateTemplate(templateId, values)}
      onSaved={(id) => router.push(`/diet-plans/templates/${id}`)}
    />
  );
}
