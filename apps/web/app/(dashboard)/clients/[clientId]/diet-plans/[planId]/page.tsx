import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';
import { SharePlanButtons } from '@/components/diet-plans/share-plan-buttons';
import { Button } from '@/components/ui/button';

export default async function ClientDietPlanPage({
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

  return (
    <div className="space-y-6">
      <Link
        href={`/clients/${clientId}/diet-plans`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to plans
      </Link>

      <PlanView plan={plan} />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/pdf`} />}>
          Export PDF
        </Button>
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/xlsx`} />}>
          Export Excel
        </Button>
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/docx`} />}>
          Export Word
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/clients/${clientId}/diet-plans/new?fromPlanId=${planId}`} />}
        >
          New version from this
        </Button>
      </div>

      <SharePlanButtons planId={planId} planName={plan.name} />
    </div>
  );
}
