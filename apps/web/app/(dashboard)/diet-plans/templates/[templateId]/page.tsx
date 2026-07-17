import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';
import { DeleteTemplateButton } from '@/components/diet-plans/delete-template-button';

export default async function DietPlanTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const plan = await getPlanWithMeals(supabase, templateId);
  if (!plan || !plan.is_template) notFound();

  return (
    <div className="space-y-6">
      <Link href="/diet-plans/templates" className="text-sm text-muted-foreground hover:underline">
        ← Back to templates
      </Link>

      <PlanView plan={plan} />

      <DeleteTemplateButton templateId={templateId} />
    </div>
  );
}
