import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireClient } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';
import { PortalPrintButton } from '@/components/portal/portal-print-button';
import { Button } from '@/components/ui/button';

export default async function PortalDietPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const { client } = await requireClient();
  const supabase = await createClient();

  const plan = await getPlanWithMeals(supabase, planId);
  if (!plan || plan.client_id !== client.id) notFound();

  return (
    <div className="space-y-6">
      <Link href="/portal/diet-plans" className="text-sm text-muted-foreground hover:underline print:hidden">
        ← Back to plans
      </Link>

      <PlanView plan={plan} timezone={client.practices?.timezone ?? 'Asia/Kolkata'} />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/pdf`} />}>
          Export PDF
        </Button>
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/xlsx`} />}>
          Export Excel
        </Button>
        <Button variant="outline" size="sm" render={<a href={`/api/diet-plans/${planId}/export/docx`} />}>
          Export Word
        </Button>
        <PortalPrintButton />
      </div>
    </div>
  );
}
