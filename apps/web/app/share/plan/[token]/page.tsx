import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: planRow } = await supabase
    .from('diet_plans')
    .select('id, practice_id')
    .eq('share_token', token)
    .maybeSingle();

  if (!planRow) notFound();

  const plan = await getPlanWithMeals(supabase, planRow.id);
  if (!plan) notFound();

  const { data: practice } = await supabase
    .from('practices')
    .select('name, tagline, primary_color')
    .eq('id', planRow.practice_id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {practice && (
        <div className="border-b pb-4">
          <p className="text-lg font-semibold" style={{ color: practice.primary_color ?? undefined }}>
            {practice.name}
          </p>
          {practice.tagline && <p className="text-sm text-muted-foreground">{practice.tagline}</p>}
        </div>
      )}
      <PlanView plan={plan} />
    </div>
  );
}
