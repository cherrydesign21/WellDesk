'use client';

import { useRouter } from 'next/navigation';
import type { DietPlanInput } from '@welldesk/shared';
import { updateClientDietPlan } from '@/app/(dashboard)/clients/[clientId]/diet-plans/actions';
import { PlanBuilder } from './plan-builder';

export function EditClientPlanForm({
  clientId,
  planId,
  initialName,
  initialPlanDate,
  initialMeals,
}: {
  clientId: string;
  planId: string;
  initialName: string;
  initialPlanDate: string;
  initialMeals: DietPlanInput['meals'];
}) {
  const router = useRouter();

  return (
    <PlanBuilder
      mode="plan"
      initialName={initialName}
      initialPlanDate={initialPlanDate}
      initialMeals={initialMeals}
      submitLabel="Save changes"
      onSubmitAction={(values) => updateClientDietPlan(clientId, planId, values)}
      onSaved={(id) => router.push(`/clients/${clientId}/diet-plans/${id}`)}
    />
  );
}
