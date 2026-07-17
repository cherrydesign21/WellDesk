'use client';

import { useRouter } from 'next/navigation';
import { createTemplate } from '@/app/(dashboard)/diet-plans/templates/actions';
import { PlanBuilder } from './plan-builder';

export function NewTemplateForm() {
  const router = useRouter();

  return (
    <PlanBuilder
      mode="template"
      submitLabel="Save template"
      onSubmitAction={createTemplate}
      onSaved={(id) => router.push(`/diet-plans/templates/${id}`)}
    />
  );
}
