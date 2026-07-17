'use client';

import { useRouter } from 'next/navigation';
import type { DietPlanInput } from '@welldesk/shared';
import { createClientDietPlan } from '@/app/(dashboard)/clients/[clientId]/diet-plans/actions';
import { PlanBuilder } from './plan-builder';

export function NewClientPlanForm({
  clientId,
  initialName,
  initialMeals,
  supersedesPlanId,
}: {
  clientId: string;
  initialName?: string;
  initialMeals?: DietPlanInput['meals'];
  supersedesPlanId?: string;
}) {
  const router = useRouter();

  return (
    <PlanBuilder
      mode="plan"
      initialName={initialName}
      initialMeals={initialMeals}
      submitLabel={supersedesPlanId ? 'Save new version' : 'Create plan'}
      onSubmitAction={(values) => createClientDietPlan(clientId, values, { supersedesPlanId })}
      onSaved={(id) => router.push(`/clients/${clientId}/diet-plans/${id}`)}
    />
  );
}
