import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';
import { DeleteTemplateButton } from '@/components/diet-plans/delete-template-button';
import { DuplicateTemplateButton } from '@/components/diet-plans/duplicate-template-button';
import { AssignTemplateDialog } from '@/components/diet-plans/assign-template-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

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

  const { data: assignedRows } = await supabase
    .from('diet_plans')
    .select('client_id, clients(full_name)')
    .eq('is_template', false)
    .eq('template_id', templateId);

  const { data: allClients } = await supabase
    .from('clients')
    .select('id, full_name')
    .neq('status', 'archived')
    .order('full_name');

  type ClientRel = { full_name: string } | { full_name: string }[] | null;
  const seenClientIds = new Set<string>();
  const assignedClients: { id: string; name: string }[] = [];
  for (const row of assignedRows ?? []) {
    if (seenClientIds.has(row.client_id)) continue;
    seenClientIds.add(row.client_id);
    const rel = row.clients as ClientRel;
    const name = (Array.isArray(rel) ? rel[0]?.full_name : rel?.full_name) ?? 'Unknown';
    assignedClients.push({ id: row.client_id, name });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/diet-plans/templates" className="text-sm text-muted-foreground hover:underline">
          ← Back to templates
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/diet-plans/templates/${templateId}/edit`} />}>
            Edit
          </Button>
          <DuplicateTemplateButton templateId={templateId} showLabel />
          <AssignTemplateDialog templateId={templateId} clients={allClients ?? []} />
        </div>
      </div>

      <PlanView plan={plan} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned clients</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedClients.length === 0 ? (
            <EmptyState icon={Users} title="Not assigned to any client yet" compact />
          ) : (
            <div className="space-y-1">
              {assignedClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted hover:underline"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteTemplateButton templateId={templateId} />
    </div>
  );
}
