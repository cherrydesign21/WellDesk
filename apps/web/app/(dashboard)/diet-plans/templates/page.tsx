import Link from 'next/link';
import { Plus, UtensilsCrossed, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteTemplateButton } from '@/components/diet-plans/delete-template-button';
import { DuplicateTemplateButton } from '@/components/diet-plans/duplicate-template-button';
import { AssignTemplateDialog } from '@/components/diet-plans/assign-template-dialog';

export default async function DietPlanTemplatesPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: templates } = await supabase
    .from('diet_plans')
    .select('id, name, created_at')
    .eq('is_template', true)
    .order('name');

  const { data: assignedRows } = await supabase
    .from('diet_plans')
    .select('template_id, client_id')
    .eq('is_template', false)
    .not('template_id', 'is', null);

  const { data: allClients } = await supabase
    .from('clients')
    .select('id, full_name')
    .neq('status', 'archived')
    .order('full_name');

  const clientsByTemplate = new Map<string, Set<string>>();
  for (const row of assignedRows ?? []) {
    const set = clientsByTemplate.get(row.template_id as string) ?? new Set<string>();
    set.add(row.client_id);
    clientsByTemplate.set(row.template_id as string, set);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Diet Plan Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable plans you can start any client&apos;s plan from.</p>
        </div>
        <Button size="lg" render={<Link href="/diet-plans/templates/new" />}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead className="w-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!templates || templates.length === 0) && (
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyState icon={UtensilsCrossed} title="No templates yet" description="Create a template to reuse across clients." compact />
                </TableCell>
              </TableRow>
            )}
            {templates?.map((template) => {
              const assignedCount = clientsByTemplate.get(template.id)?.size ?? 0;
              return (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <Link href={`/diet-plans/templates/${template.id}`} className="hover:underline">
                      {template.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {assignedCount > 0 ? (
                      <Badge variant="info">
                        {assignedCount} client{assignedCount === 1 ? '' : 's'}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <AssignTemplateDialog
                        templateId={template.id}
                        clients={allClients ?? []}
                        trigger={<Button variant="ghost" size="icon" title="Assign to clients" />}
                        triggerContent={
                          <>
                            <Users className="h-4 w-4" />
                            <span className="sr-only">Assign to clients</span>
                          </>
                        }
                      />
                      <DuplicateTemplateButton templateId={template.id} />
                      <DeleteTemplateButton templateId={template.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
